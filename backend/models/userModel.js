const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function(val) {
        // This only works on CREATE AND SAVE
        return this.password === val;
      },
      message: 'Passwords are not the same'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  photo: {
    type: String
  },
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});
userSchema.pre('save', async function(next) {
  // Only run this func if the passowrd is modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  // Delete the password confirm
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
userSchema.pre(/^find/, function(next) {
  // this points to the query
  this.find({ active: { $ne: false } });
  next();
});

// instance method(method available on directly on doc (eq not extact but can relate to method attached to a proptoype property of a schema))
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  // candidatepassword- entered by user
  // func return true or false

  return await bcrypt.compare(candidatePassword, userPassword);
};
// checking whether password has changed after creating token or not
userSchema.methods.changedPasswordAfter = function(JWTtimestamp) {
  const changedTimestamp = parseInt(
    this.passwordChangedAt.getTime() / 1000,
    10
  );

  return JWTtimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
