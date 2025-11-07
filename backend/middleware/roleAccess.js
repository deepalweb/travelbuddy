import { SECURITY_CONFIG, ROLE_FEATURES, validateUserId } from '../config/security.js';

export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.uid;
      if (!userId || typeof userId !== 'string') {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate userId format
      if (!validateUserId(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      if (!global.User) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }

      let user;
      // Try MongoDB ObjectId first, then Firebase UID
      if (SECURITY_CONFIG.MONGODB_ID_REGEX.test(userId)) {
        user = await global.User.findById(userId).select('roles activeRole');
      } else {
        user = await global.User.findOne({ firebaseUid: userId }).select('roles activeRole');
      }
      
      const userRoles = user?.roles || ['user'];
      
      // Validate allowed roles
      const validAllowedRoles = allowedRoles.filter(role => SECURITY_CONFIG.VALID_ROLES.includes(role));
      
      if (validAllowedRoles.length === 0) {
        return res.status(500).json({ error: 'Invalid role configuration' });
      }
      
      // Check if user has any of the allowed roles
      const hasAccess = validAllowedRoles.some(role => userRoles.includes(role)) || 
                       userRoles.includes('admin');
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied', 
          requiredRoles: validAllowedRoles
        });
      }
      
      req.userRoles = userRoles;
      req.userId = user._id;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

export const requireFeature = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] || req.user?.uid;
      
      // Validate feature name
      if (!feature || typeof feature !== 'string') {
        return res.status(500).json({ error: 'Invalid feature configuration' });
      }
      
      if (!userId) {
        // Allow anonymous access only for basic features
        if (SECURITY_CONFIG.PUBLIC_FEATURES.includes(feature)) {
          return next();
        }
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Validate userId format
      if (!validateUserId(userId)) {
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      if (!global.User) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }

      let user;
      if (SECURITY_CONFIG.MONGODB_ID_REGEX.test(userId)) {
        user = await global.User.findById(userId).select('roles activeRole');
      } else {
        user = await global.User.findOne({ firebaseUid: userId }).select('roles activeRole');
      }
      
      const userRoles = user?.roles || ['user'];
      
      // Admin has access to all features
      if (userRoles.includes('admin')) {
        return next();
      }
      
      // Check if any user role has access to this feature
      const hasFeatureAccess = userRoles.some(role => {
        const roleFeatures = ROLE_FEATURES[role] || [];
        return roleFeatures.includes(feature) || roleFeatures.includes('all');
      });
      
      if (!hasFeatureAccess) {
        return res.status(403).json({ 
          error: 'Feature access denied', 
          feature
        });
      }
      
      next();
    } catch (error) {
      console.error('Feature access error:', error);
      res.status(500).json({ error: 'Feature access check failed' });
    }
  };
};

export default { requireRole, requireFeature };

// Import User model reference
if (typeof global !== 'undefined' && !global.User) {
  try {
    const mongoose = await import('mongoose');
    global.User = mongoose.model('User');
  } catch (e) {
    // User model will be set by server.js
  }
}