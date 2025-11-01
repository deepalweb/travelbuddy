import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Demo login endpoint for testing admin panel
router.post('/demo-login', async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    
    // Accept multiple demo login formats
    if (email === 'admin@travelbuddy.com' || username === 'demo-user' || role === 'regular') {
      const User = global.User || mongoose.model('User');
      let adminUser = await User.findOne({ email: 'admin@travelbuddy.com' });
      
      // Create admin user if doesn't exist
      if (!adminUser && email === 'admin@travelbuddy.com') {
        adminUser = new User({
          email: 'admin@travelbuddy.com',
          username: 'admin',
          isAdmin: true,
          role: 'admin',
          tier: 'pro'
        });
        await adminUser.save();
      }
      
      if (adminUser) {
        const token = Buffer.from(`${adminUser._id}:admin:${Date.now()}`).toString('base64');
        
        return res.json({
          success: true,
          user: {
            id: adminUser._id,
            username: adminUser.username,
            email: adminUser.email,
            isAdmin: adminUser.isAdmin,
            role: adminUser.role,
            tier: adminUser.tier
          },
          token,
          message: 'Demo admin login successful'
        });
      }
    }
    
    // Create demo user if none exists
    const User = global.User || mongoose.model('User');
    const demoUser = {
      _id: new mongoose.Types.ObjectId(),
      username: username || 'demo-user',
      email: email || 'demo@travelbuddy.com',
      isAdmin: role === 'admin' || email === 'admin@travelbuddy.com',
      role: role || 'regular',
      tier: 'free'
    };
    
    const token = Buffer.from(`${demoUser._id}:${demoUser.role}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      user: {
        id: demoUser._id,
        username: demoUser.username,
        email: demoUser.email,
        isAdmin: demoUser.isAdmin,
        role: demoUser.role,
        tier: demoUser.tier
      },
      token,
      message: 'Demo login successful'
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Demo token verification
router.get('/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Decode demo token
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, role] = decoded.split(':');
    
    const User = global.User || mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
        tier: user.tier
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
});

export default router;