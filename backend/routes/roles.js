import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { SECURITY_CONFIG, validateRole, sanitizeProfileData } from '../config/security.js';

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
      roles: user.roles || ['user'],
      activeRole: user.activeRole || 'user',
      permissions: user.permissions || ['search_places', 'create_posts'],
      businessProfile: user.businessProfile,
      agentProfile: user.agentProfile,
      transportProfile: user.transportProfile,
      isVerified: user.isVerified || false
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user role' });
  }
});

// Add role (multi-role support)
router.post('/add-role', verifyFirebaseToken, async (req, res) => {
  try {
    const { targetRole, profileData } = req.body;
    
    // Validate role
    if (!validateRole(targetRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const User = req.app.get('User') || global.User;
    if (!User) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has role
    if (user.roles && user.roles.includes(targetRole)) {
      return res.status(400).json({ error: 'User already has this role' });
    }

    const updateData = {
      roles: [...(user.roles || ['user']), targetRole]
    };
    
    // Validate and sanitize profile data
    if (targetRole === 'merchant' && profileData) {
      const sanitized = sanitizeProfileData(profileData, ['businessName', 'businessType']);
      updateData.businessProfile = {
        ...sanitized,
        verificationStatus: 'pending',
        isActive: false
      };
    } else if (targetRole === 'travel_agent' && profileData) {
      const sanitized = sanitizeProfileData(profileData, ['agencyName', 'ownerName']);
      updateData.agentProfile = {
        ...sanitized,
        verificationStatus: 'pending',
        isActive: false,
        rating: 0,
        reviewCount: 0
      };
    } else if (targetRole === 'transport_provider' && profileData) {
      const sanitized = sanitizeProfileData(profileData, ['companyName', 'ownerName']);
      updateData.transportProfile = {
        ...sanitized,
        verificationStatus: 'pending',
        isActive: false
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Role added successfully',
      roles: updatedUser.roles,
      requiresVerification: targetRole !== 'user'
    });
  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// Switch active role
router.post('/switch-role', verifyFirebaseToken, async (req, res) => {
  try {
    const { activeRole } = req.body;
    
    // Validate role
    if (!validateRole(activeRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    const User = req.app.get('User') || global.User;
    if (!User) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRoles = user.roles || ['user'];
    if (!userRoles.includes(activeRole)) {
      return res.status(403).json({ error: 'Role not available for this user' });
    }

    await User.findByIdAndUpdate(
      user._id, 
      { $set: { activeRole } },
      { runValidators: true }
    );
    
    res.json({ message: 'Active role switched', activeRole });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ error: 'Failed to switch role' });
  }
});

// Get available roles
router.get('/available', async (req, res) => {
  try {
    const roles = [
      {
        id: 'user',
        name: 'Regular User',
        description: 'Browse and book travel services',
        permissions: ['search_places', 'create_posts', 'create_reviews', 'book_services'],
        requiresVerification: false
      },
      {
        id: 'merchant',
        name: 'Merchant',
        description: 'Create and manage deals for your business',
        permissions: ['create_deals', 'manage_deals', 'view_deal_analytics', 'manage_business_profile'],
        requiresVerification: true
      },
      {
        id: 'transport_provider',
        name: 'Transport Service Provider',
        description: 'Offer transportation services to travelers',
        permissions: ['create_transport_service', 'manage_transport_fleet', 'accept_transport_bookings'],
        requiresVerification: true
      },
      {
        id: 'travel_agent',
        name: 'Travel Agent',
        description: 'Provide professional travel planning services',
        permissions: ['create_travel_packages', 'manage_client_bookings', 'access_agent_tools'],
        requiresVerification: true
      }
    ];

    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available roles' });
  }
});

export default router;