// Production-safe error handling
export const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log full error server-side
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Production: Send minimal error info
  if (isProduction) {
    return res.status(statusCode).json({
      error: statusCode === 500 ? 'Internal server error' : err.message,
      statusCode
    });
  }

  // Development: Send detailed error
  res.status(statusCode).json({
    error: err.message,
    statusCode,
    stack: err.stack,
    details: err.details
  });
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
};
