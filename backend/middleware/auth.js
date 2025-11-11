import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// Secure bypass auth for development only
export const bypassAuth = (req, res, next) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('🔓 Development auth mode');
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const userId = req.headers['x-user-id'];
  
  if (token) {
    try {
      // Only decode Firebase JWT format in development
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid && uid !== 'dev-user') {
          req.user = { uid, email: payload.email };
          return next();
        }
      }
    } catch (e) {
      console.log('⚠️ Token decode failed:', e.message);
    }
  }
  
  if (userId && userId !== 'dev-user') {
    req.user = { uid: userId };
    return next();
  }
  
  return res.status(401).json({ error: 'Valid token or user ID required' });
};

// JWT Authentication
export const authenticateJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Firebase Authentication
export const authenticateFirebase = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Firebase token required' });
    }

    // For local development, allow bypass if Firebase Admin is not configured
    if (!admin.apps.length) {
      console.warn('⚠️ Firebase Admin not configured, using development mode');
      // Try to decode the token to extract user info
      try {
        // First try to decode as Firebase JWT (without verification)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          req.user = { uid: payload.user_id || payload.sub || 'dev-user', email: payload.email };
          return next();
        }
      } catch {}
      
      // Fallback to simple base64 decode
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [uid] = decoded.split(':');
        req.user = { uid: uid || 'dev-user' };
        return next();
      } catch {
        req.user = { uid: 'dev-user' };
        return next();
      }
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (verifyError) {
      console.error('Firebase token verification failed:', verifyError);
      // For local development, allow fallback
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Using development auth fallback');
        // Try to extract user info from token without verification
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            req.user = { uid: payload.user_id || payload.sub || 'dev-user', email: payload.email };
            return next();
          }
        } catch {}
        req.user = { uid: 'dev-user' };
        return next();
      }
      return res.status(403).json({ error: 'Invalid Firebase token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional Firebase Authentication (for public endpoints)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
    }
    next();
  } catch (error) {
    next();
  }
};

// Role-based authorization
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Admin authentication
export const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Alias for consistency with users.js
export const verifyFirebaseToken = authenticateFirebase;

// Secure development auth
export const devFriendlyAuth = async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return authenticateFirebase(req, res, next);
  }
  
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const userId = req.headers['x-user-id'];

    if (!token && !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (token) {
      // Only Firebase JWT in development
      try {
        const parts = token.split('.');
        if (parts.length === 3 && parts.every(part => part.length > 0)) {
          const payload64 = parts[1];
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(payload64)) {
            throw new Error('Invalid Base64 format');
          }
          
          const payloadStr = Buffer.from(payload64, 'base64').toString('utf8');
          const payload = JSON.parse(payloadStr);
          
          if (payload && typeof payload === 'object') {
            const uid = payload.user_id || payload.sub || payload.uid;
            if (uid && typeof uid === 'string') {
              req.user = { uid, email: payload.email };
              return next();
            }
          }
        }
        throw new Error('Invalid token structure');
      } catch (error) {
        console.warn('Token validation failed:', error.message);
        return res.status(401).json({ error: 'Invalid token format' });
      }
    }
    
    if (userId) {
      req.user = { uid: userId };
      return next();
    }
    
    return res.status(401).json({ error: 'Authentication failed' });
  } catch (error) {
    return res.status(403).json({ error: 'Authentication failed' });
  }
};