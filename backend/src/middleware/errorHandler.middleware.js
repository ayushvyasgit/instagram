import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle operational errors (known errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'UNAUTHORIZED',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Handle database unique constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      code: 'CONFLICT',
    });
  }

  // Handle database foreign key constraint errors
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
      code: 'BAD_REQUEST',
    });
  }

  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large',
      code: 'FILE_TOO_LARGE',
    });
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
};