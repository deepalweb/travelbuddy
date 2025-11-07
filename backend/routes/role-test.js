import express from 'express';
import { validateUserId, validateRole, SECURITY_CONFIG } from '../config/security.js';
const router = express.Router();

// Test role assignment (development only)
router.post('/assign', async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role required' });
    }

    // Validate role and userId
    if (!validateRole(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (!global.User) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    let user;
    try {
      if (SECURITY_CONFIG.MONGODB_ID_REGEX.test(userId)) {
        user = await global.User.findById(userId);
      } else {
        user = await global.User.findOne({ firebaseUid: userId });
      }
    } catch (dbError) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRoles = user.roles || ['user'];
    
    // Add role if not exists
    if (!userRoles.includes(role)) {
      userRoles.push(role);
    }
    
    // Update user with validation
    await global.User.findByIdAndUpdate(
      user._id,
      { 
        $set: { 
          roles: userRoles,
          activeRole: role 
        }
      },
      { runValidators: true }
    );

    res.json({
      success: true,
      userId: user._id,
      roles: userRoles,
      activeRole: role
    });
  } catch (error) {
    console.error('Role assignment error:', error);
    res.status(500).json({ error: 'Role assignment failed' });
  }
});

// Get user roles (development only)
router.get('/check/:userId', async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!validateUserId(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (!global.User) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    let user;
    try {
      if (SECURITY_CONFIG.MONGODB_ID_REGEX.test(userId)) {
        user = await global.User.findById(userId).select('roles activeRole');
      } else {
        user = await global.User.findOne({ firebaseUid: userId }).select('roles activeRole');
      }
    } catch (dbError) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: user._id,
      roles: user.roles || ['user'],
      activeRole: user.activeRole || 'user'
    });
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ error: 'Role check failed' });
  }
});

export default router;