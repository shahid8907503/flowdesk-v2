const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    reqId: req.id,
    err: {
      message: err.message,
      stack: err.stack,
      ...err
    }
  }, `Error handling request: ${err.message}`);

  // Default error code and message
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || undefined;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.keys(err.errors).map(key => ({
      field: key,
      message: err.errors[key].message
    }));
  }

  // Handle Mongoose Cast Error (Invalid Object ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for path: ${err.path}`;
  }

  // Handle Mongo Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    errors = Object.keys(err.keyValue).map(key => ({
      field: key,
      message: `The value '${err.keyValue[key]}' is already taken.`
    }));
  }

  // Zod Validation Error (if throwed)
  if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    statusCode = 400;
    message = 'Validation Error';
    errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    reqId: req.id
  });
};

module.exports = errorHandler;
