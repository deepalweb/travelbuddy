import validator from 'validator';

// Sanitize and validate input
export const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS
        obj[key] = validator.escape(obj[key].trim());
        // Limit length
        obj[key] = obj[key].substring(0, 10000);
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  
  next();
};

// Validate email
export const validateEmail = (email) => {
  return email && validator.isEmail(email);
};

// Validate MongoDB ObjectId
export const validateObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

// Validate coordinates
export const validateCoordinates = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return !isNaN(latitude) && !isNaN(longitude) &&
         latitude >= -90 && latitude <= 90 &&
         longitude >= -180 && longitude <= 180;
};

// Rate limiting configuration
export const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 1000, // Strict in production
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  };
};
