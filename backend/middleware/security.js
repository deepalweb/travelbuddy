import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers - CSP disabled for Google APIs compatibility
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
});

// CSRF protection
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(validator.escape(value));
    }
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  next();
};

// Authentication middleware
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token (implement your token verification logic)
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Simple token verification (replace with your JWT logic)
const verifyToken = (token) => {
  // Implement JWT verification here
  return { id: 'user_id', role: 'user' };
};