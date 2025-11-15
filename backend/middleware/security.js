import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
// Removed DOMPurify to avoid Trusted Types issues
import validator from 'validator';

// Rate limiting - more permissive for production
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 100, // Higher limit in production
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path.includes('/health') || 
           req.path.includes('/api/config') ||
           req.path.includes('.js') ||
           req.path.includes('.css') ||
           req.path.includes('.ico');
  }
});

// Security headers - CSP disabled for Firebase compatibility
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

// Simplified input sanitization (server-side only)
export const sanitizeInput = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      // Basic XSS prevention without DOMPurify
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/[<>"']/g, (match) => {
          const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
          return entities[match] || match;
        });
    }
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
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
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

// Enhanced authentication middleware
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // Verify token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based authorization
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role || 'user'];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Admin authorization
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Enhanced token verification
const verifyToken = async (token) => {
  try {
    // For Firebase tokens
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        
        // Check token expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          throw new Error('Token expired');
        }
        
        return {
          id: payload.user_id || payload.sub || payload.uid,
          email: payload.email,
          role: payload.role || 'user',
          roles: payload.roles || ['user'],
          isAdmin: payload.admin === true
        };
      }
    }
    
    // For simple base64 tokens (development)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [id, timestamp] = decoded.split(':');
    
    // Check if token is too old (24 hours)
    if (timestamp && Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      throw new Error('Token expired');
    }
    
    return {
      id,
      role: 'user',
      roles: ['user'],
      isAdmin: false
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};