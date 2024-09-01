const crypto = require('crypto');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const util = require('util');
// we can use util to promisify the func

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const verifyToken = (token, secretKey) => {
  return new Promise((res, rej) => {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return rej(err);
      res(decoded);
    });
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // sending token as cookie
  //name of cookie,cookie itself,object of option

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // make sure that cookie can't be accessed or modify by any way in the browser
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; //send cookie on encrypted connection

  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// name signup not createuser as it is related to authentication
exports.signup = catchAsync(async function(req, res, next) {
  const newUser = await User.create({
    name: req.body.name,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    email: req.body.email,
    passwordChangedAt: req.body.passwordChangedAt
    // role: req.body.role
  });
  // 201 created\
  createSendToken(newUser, 201, res);
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('Please provide email and password:', 400));
  const user = await User.findOne({ email }).select('+password');

  //401 unauthorized access
  if (!user || !(await user.correctPassword(password, user.password)))
    return next(
      new AppError('Please  provide correct email or password:', 401)
    );
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) get the token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  if (!token)
    return next(
      new AppError(
        'You are not logged in! Please log in to get the access',
        401
      )
    );

  // 2) validate the token
  const decoded = await verifyToken(token, process.env.JWT_SECRET);

  //3) check if user still exists

  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError('The user belonging to the token does not exist', 401)
    );
  console.log(freshUser);

  // 4) Check if user changed password after the JWT token was issued
  if (freshUser.passwordChangedAt) {
    if (freshUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError(
          'User recently changed password! Please log in again to get the access',
          401
        )
      );
  }

  req.user = freshUser;

  // Grant access to protected route
  next();
});

exports.restrictTo = function(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        // 403 error means prohibited not authorized
        new AppError('You do not have permission to perform this action', 403)
      );
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError(' There is no user with that email address', 404));
  //2) Generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  console.log(req.get('host'), req.protocol);
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n If you didn't forget your password, please ignore this email! `;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token(valid for 10 min)',
      message
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to the email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again later!', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on token
  //2) set the new password if token has not expired and there is a user
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // in this  i am searching docs based on hashedToken and expire time should be less than current time
  // in password expires time already added 10 min
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // 3) update changePasswordAt property for the user

  await user.save();

  //4) Login the user send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user form collection
  const user = await User.findOne({ _id: req.user._id }).select('+password');
  const currentPassword = req.body.currentPassword;

  //2) Check if posted current password is correct
  if (
    !currentPassword ||
    !(await user.correctPassword(currentPassword, user.password))
  )
    return next(
      new AppError(
        'Your current Password is wrong! Please enter it correctly.',
        401
      )
    );
  //3) if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //4 Log user in send JWT
  createSendToken(user, 200, res);
});
