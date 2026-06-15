import admin from 'firebase-admin';

// ============================================================================
// CORE AUTHENTICATION MIDDLEWARE
// ============================================================================

const isProduction = () =>
  process.env.NODE_ENV === 'production' || Boolean(process.env.WEBSITE_SITE_NAME);

const decodeDevelopmentFirebaseToken = (token) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed Firebase token');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  const uid = payload.user_id || payload.sub;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const now = Math.floor(Date.now() / 1000);

  if (!uid || !payload.exp || payload.exp <= now) {
    throw new Error('Expired or incomplete Firebase token');
  }

  if (!payload.iss?.startsWith('https://securetoken.google.com/')) {
    throw new Error('Invalid Firebase token issuer');
  }

  if (projectId) {
    const expectedIssuer = `https://securetoken.google.com/${projectId}`;
    if (payload.aud !== projectId || payload.iss !== expectedIssuer) {
      throw new Error('Firebase token project mismatch');
    }
  }

  return {
    uid,
    email: payload.email,
    emailVerified: payload.email_verified
  };
};

const verifyFirebaseIdToken = async (token) => {
  if (admin.apps.length > 0) {
    return admin.auth().verifyIdToken(token);
  }

  if (!isProduction()) {
    console.warn('Firebase Admin is unavailable; using validated local-development token claims');
    return decodeDevelopmentFirebaseToken(token);
  }

  const error = new Error('Firebase Admin is not configured');
  error.code = 'auth/service-unavailable';
  throw error;
};

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
    const decodedToken = await verifyFirebaseIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    if (error.code === 'auth/service-unavailable') {
      return res.status(503).json({ error: 'Authentication service unavailable' });
    }
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
      const decodedToken = await verifyFirebaseIdToken(token);
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


