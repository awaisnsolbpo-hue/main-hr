/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(detail => detail.message)
    });
  }

  // Supabase errors
  if (err.code) {
    return res.status(400).json({
      error: err.message || 'Database error',
      code: err.code
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

export default errorHandler;
