const AppError = require("../utils/appError");
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  // 400 signifies bad reequest
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")} `;
  return new AppError(message, 400);
};
const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value `;
  return new AppError(message, 400);
};
const handleJwtError = (err) => {
  const message = `Invalid Token, Please Login Again! `;
  return new AppError(message, 401);
};
const handleJwtExpiredError = (err) =>
  new AppError("Your token has expired! Please login again.", 401);

const sendErrorDev = function(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,

    error: err,
  });
};
const sendErrorProd = function(err, res) {
  // Operation trusted errors, send message to client
  if (err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  //Programming or other errors don't leak error details
  else {
    console.error("ERROR", err);

    // 2) send generic message
    res.status(500).json({
      status: "error",
      message: "Something went wrong !",
    });
  }
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.create(err);
    console.log(error);
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") error = handleJwtError();
    if (err.name === "TokenExpiredError") error = handleJwtExpiredError(err);
    sendErrorProd(error, res);
  }
};
