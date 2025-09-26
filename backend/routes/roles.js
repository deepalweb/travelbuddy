import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Get user role and permissions
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    // Access User model from app context
    const User = req.app.get('User') || global.User;
    if (!User) {
      return res.json({
        role: 'regular',
        permissions: ['search_places', 'create_posts'],
        isVerified: false
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      role: user.role || 'regular',
      permissions: user.permissions || ['search_places', 'create_posts'],
      businessProfile: user.businessProfile,
      serviceProfile: user.serviceProfile,
      isVerified: user.isVerified || false
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user role' });
  }
});

// Request role change
router.post('/request-change', verifyFirebaseToken, async (req, res) => {
  try {
    const { targetRole, profileData } = req.body;
    const User = req.app.get('User') || global.User;
    
    if (!User) {
      return res.json({
        message: 'Role change request submitted (demo mode)',
        status: 'pending'
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user role and profile
    const updateData = { role: targetRole };
    
    if (targetRole === 'merchant' && profileData) {
      updateData.businessProfile = {
        ...profileData,
        verificationStatus: 'pending'
      };
    } else if (targetRole === 'agent' && profileData) {
      updateData.serviceProfile = {
        ...profileData,
        verificationStatus: 'pending'
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Role change request submitted',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request role change' });
  }
});

export default router;