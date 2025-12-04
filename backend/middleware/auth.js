import admin from 'firebase-admin';

// ============================================================================
// CORE AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require Firebase authentication
 * Use this for all protected endpoints
 */
/**
 * Verify Firebase token (alias for requireAuth)
 */
export const verifyFirebaseToken = async (req, res, next) => {
  return requireAuth(req, res, next);
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    
    // Handle demo tokens
    if (token.startsWith('demo-token-')) {
      req.user = {
        uid: 'demo-user-123',
        email: 'demo@travelbuddy.com',
        emailVerified: true
      };
      return next();
    }
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Optional authentication
 * Use for endpoints that work with or without auth
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified
      };
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  next();
};

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Require resource ownership
 * Use after requireAuth to check if user owns the resource
 */
export const requireOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      const ownerId = await getOwnerId(req);
      if (!ownerId) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (ownerId.toString() !== req.user.uid) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

/**
 * Require admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check admin custom claim
    const userRecord = await admin.auth().getUser(req.user.uid);
    if (!userRecord.customClaims?.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Admin verification failed' });
  }
};

// ============================================================================
// DEVELOPMENT ONLY
// ============================================================================

/**
 * Development bypass - ONLY for local testing
 * NEVER use in production routes
 */
export const devBypass = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Development endpoint disabled' });
  }
  
  req.user = {
    uid: 'dev-user-123',
    email: 'dev@localhost',
    emailVerified: true
  };
  
  next();
};
