import admin from 'firebase-admin';

// Firebase ID token verification middleware
export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    // Skip verification if Firebase Admin not configured
    if (!admin.apps.length) {
      console.warn('Firebase Admin not configured, skipping token verification');
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };
    
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth middleware - allows requests without tokens
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token && admin.apps.length) {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture
      };
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    console.warn('Optional auth failed:', error.message);
    next();
  }
}