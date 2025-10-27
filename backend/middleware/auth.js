import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

// Simple bypass auth for development
export const bypassAuth = (req, res, next) => {
  console.log('🔓 Bypassing auth for development - headers:', req.headers.authorization?.substring(0, 50));
  
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      // Try to decode Firebase JWT payload without verification
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        req.user = { uid: uid || 'dev-user', email: payload.email };
        console.log('✅ Extracted user from JWT:', uid);
        return next();
      }
    } catch (e) {
      console.log('⚠️ JWT decode failed:', e.message);
    }
    
    try {
      // Fallback to simple base64 decode
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [uid] = decoded.split(':');
      req.user = { uid: uid || 'dev-user' };
      console.log('✅ Extracted user from simple token:', uid);
      return next();
    } catch (e) {
      console.log('⚠️ Simple decode failed:', e.message);
    }
  }
  
  req.user = { uid: 'dev-user' };
  console.log('✅ Using fallback dev-user');
  next();
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

// Development-friendly auth that allows profile updates
export const devFriendlyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    console.log('🔓 Using development-friendly auth for token:', token.substring(0, 20) + '...');
    
    // Try to decode as Firebase JWT first
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          req.user = { uid, email: payload.email };
          console.log('✅ Decoded Firebase JWT for user:', uid);
          return next();
        }
      }
    } catch (jwtError) {
      console.log('⚠️ Could not decode as Firebase JWT:', jwtError.message);
    }
    
    // Try to decode as simple token
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [uid] = decoded.split(':');
      if (uid) {
        req.user = { uid };
        console.log('✅ Decoded simple token for user:', uid);
        return next();
      }
    } catch (decodeError) {
      console.log('⚠️ Could not decode as simple token:', decodeError.message);
    }

    // Development fallback: allow any token
    console.log('🔧 Using development fallback auth');
    req.user = { uid: 'dev-user-' + Date.now() };
    return next();
    
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Authentication failed' });
  }
};