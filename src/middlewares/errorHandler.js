const logger = require('../utils/logger');
const { AppError } = require('../utils/customErrors');

const errorHandler = (err, req, res, _next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    type: err.type || 'INTERNAL_ERROR',
  };

  // Handle custom AppError instances
  if (err instanceof AppError) {
    error = {
      message: err.message,
      statusCode: err.statusCode,
      type: err.type,
      field: err.field,
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400,
      type: 'VALIDATION_ERROR',
    };
  }

  // Prisma validation error
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    error = {
      message: `${field} already exists`,
      statusCode: 409,
      type: 'CONFLICT_ERROR',
    };
  }

  // Prisma not found error
  if (err.code === 'P2025') {
    error = {
      message: 'Record not found',
      statusCode: 404,
      type: 'NOT_FOUND_ERROR',
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
      type: 'UNAUTHORIZED_ERROR',
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
      type: 'UNAUTHORIZED_ERROR',
    };
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.statusCode === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    type: error.type,
    ...(error.field && { field: error.field }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
