import express from 'express';
import { ROLE_FEATURES, validateUserId, SECURITY_CONFIG } from '../config/security.js';
const router = express.Router();

// Get available features for user
router.get('/available', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.json({ features: ROLE_FEATURES.user });
    }

    // Validate userId format
    if (!validateUserId(userId)) {
      return res.json({ features: ROLE_FEATURES.user });
    }

    if (!global.User) {
      return res.json({ features: ROLE_FEATURES.user });
    }

    let user;
    try {
      if (SECURITY_CONFIG.MONGODB_ID_REGEX.test(userId)) {
        user = await global.User.findById(userId).select('roles activeRole');
      } else {
        user = await global.User.findOne({ firebaseUid: userId }).select('roles activeRole');
      }
    } catch (dbError) {
      // Silently handle database errors and return default features
      return res.json({ features: ROLE_FEATURES.user });
    }

    if (!user) {
      return res.json({ features: ROLE_FEATURES.user });
    }

    const userRoles = user.roles || ['user'];
    const availableFeatures = userRoles.flatMap(role => ROLE_FEATURES[role] || []);
    const uniqueFeatures = [...new Set(availableFeatures)];

    res.json({
      roles: userRoles,
      activeRole: user.activeRole || 'user',
      features: uniqueFeatures
    });
  } catch (error) {
    console.error('Features route error:', error);
    res.status(500).json({ error: 'Failed to get features' });
  }
});

export default router;