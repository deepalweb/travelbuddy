// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    // Log error for monitoring
    console.error(`[${new Date().toISOString()}] ${err.stack}`);
    
    // Generic error response
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    });
  }

  // Development error response
  res.status(err.status || 500).json({
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
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
    error: 'Resource not found',
    path: req.path,
    method: req.method
  });
};