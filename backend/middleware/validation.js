import { body, query, param, validationResult } from 'express-validator';
// Removed DOMPurify import

// Validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Simple HTML sanitization without DOMPurify
export const sanitizeHtml = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>"'&]/g, (match) => {
      const entities = { 
        '<': '&lt;', 
        '>': '&gt;', 
        '"': '&quot;', 
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
};

// Common validation rules
export const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).isAlphanumeric(),
  body('password').isLength({ min: 6 }).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
  handleValidationErrors
];

export const validatePost = [
  body('content.text').isLength({ max: 1000 }).customSanitizer(sanitizeHtml),
  body('tags').optional().isArray({ max: 5 }),
  body('category').optional().isIn(['travel', 'food', 'culture', 'adventure']),
  handleValidationErrors
];

export const validateTrip = [
  body('tripTitle').isLength({ min: 1, max: 100 }).customSanitizer(sanitizeHtml),
  body('destination').isLength({ min: 1, max: 100 }).customSanitizer(sanitizeHtml),
  body('duration').isLength({ min: 1, max: 50 }),
  handleValidationErrors
];

export const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }),
  body('text').isLength({ min: 10, max: 500 }).customSanitizer(sanitizeHtml),
  body('place_id').isLength({ min: 1 }),
  handleValidationErrors
];

export const validateCoordinates = [
  query('lat').isFloat({ min: -90, max: 90 }),
  query('lng').isFloat({ min: -180, max: 180 }),
  handleValidationErrors
];