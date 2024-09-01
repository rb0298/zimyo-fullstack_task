// morgan- for logging the results and express framework to manage complex routing
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControler');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();
// Setting security http headers
app.use(helmet());


//  development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many request from this IP, please try again in an hour!'
});
app.use('/api', limiter);


// body parser,reading data from body into req.body
app.use(
  express.json({
    limit: '10kb' // limiting the data that can be entered in the body otherwise not accepted
  })
);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);


//custom middleware function passed in app.use is registered to middleware stack and it get access to req,res and next params
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});


// 3) ROUTES

// to add Router to our middleware stack tourROUTER will only be executed when it matches the url
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const error = new AppError(
    `Can't find ${req.originalUrl} on this server!`,
    404
  );
  next(error);
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
