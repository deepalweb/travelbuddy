// API Key Protection Middleware
import rateLimit from 'express-rate-limit';

// Rate limiting for API endpoints
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many API requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Secure headers middleware
export const secureHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
};

// API key validation
export const validateApiAccess = (req, res, next) => {
  const clientKey = req.headers['x-client-key'];
  const validKeys = process.env.VALID_CLIENT_KEYS?.split(',') || [];
  
  if (!clientKey || !validKeys.includes(clientKey)) {
    return res.status(401).json({ error: 'Invalid client key' });
  }
  next();
};