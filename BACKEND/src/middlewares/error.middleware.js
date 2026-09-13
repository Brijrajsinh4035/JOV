import { ApiError } from '../utils/apiError.util.js';
import { envConfig } from '../config/env.config.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle MongoDB Duplicate Key (E11000) errors gracefully
  if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const message =
      field === 'phone'
        ? 'This mobile number is already registered with another account.'
        : field === 'email'
        ? 'User already exists with this email ID'
        : `Duplicate entry for ${field}. Value must be unique.`;
    error = new ApiError(409, message);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    message: error.message,
    success: false,
    errors: error.errors,
    ...(envConfig.nodeEnv === 'development' ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export default errorHandler;
