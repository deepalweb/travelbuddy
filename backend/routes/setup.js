import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Create demo admin user endpoint
router.post('/create-admin', async (req, res) => {
  try {
    const User = global.User || mongoose.model('User');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@travelbuddy.com' },
        { username: 'admin' }
      ]
    });

    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Admin user already exists',
        user: {
          id: existingAdmin._id,
          username: existingAdmin.username,
          email: existingAdmin.email,
          isAdmin: existingAdmin.isAdmin
        }
      });
    }

    // Create demo admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@travelbuddy.com',
      role: 'admin',
      isAdmin: true,
      tier: 'pro',
      subscriptionStatus: 'active'
    });

    await adminUser.save();
    
    res.json({
      success: true,
      message: 'Demo admin user created successfully',
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create admin user', 
      details: error.message 
    });
  }
});

export default router;