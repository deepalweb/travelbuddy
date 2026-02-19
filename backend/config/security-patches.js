// Security patches for production deployment
import { validateEnv, isProduction } from './env-validator.js';
import { getCorsOptions } from './cors.js';
import { sanitizeInput, getRateLimitConfig } from '../middleware/security-enhanced.js';
import { errorHandler, notFoundHandler } from '../middleware/error-handler-secure.js';
import rateLimit from 'express-rate-limit';

export const applySecurityPatches = (app) => {
  // 1. Validate environment variables
  validateEnv();

  // 2. Apply rate limiting (ALWAYS enabled in production)
  if (isProduction() || process.env.ENFORCE_RATE_LIMIT === 'true') {
    const limiter = rateLimit(getRateLimitConfig());
    app.use('/api', limiter);
    console.log('✅ Rate limiting enabled');
  }

  // 3. Apply input sanitization
  app.use(sanitizeInput);
  console.log('✅ Input sanitization enabled');

  // 4. Disable debug endpoints in production
  if (isProduction()) {
    // Remove debug routes
    const debugRoutes = [
      '/api/debug/*',
      '/api/test-*',
      '/api/*/test-*',
      '/api/firebase-debug',
      '/api/cors-test'
    ];
    
    debugRoutes.forEach(route => {
      app.use(route, (req, res) => {
        res.status(404).json({ error: 'Not found' });
      });
    });
    console.log('✅ Debug endpoints disabled');
  }

  // 5. Enforce HTTPS in production
  if (isProduction()) {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
    console.log('✅ HTTPS enforcement enabled');
  }

  // 6. Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    if (isProduction()) {
      res.removeHeader('X-Powered-By');
    }
    next();
  });
  console.log('✅ Security headers applied');

  return {
    errorHandler,
    notFoundHandler,
    corsOptions: getCorsOptions()
  };
};
