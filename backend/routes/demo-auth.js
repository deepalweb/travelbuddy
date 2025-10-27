import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Demo login endpoint for testing admin panel
router.post('/demo-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // For demo purposes, accept admin@travelbuddy.com with any password
    if (email === 'admin@travelbuddy.com') {
      const User = global.User || mongoose.model('User');
      const adminUser = await User.findOne({ email: 'admin@travelbuddy.com' });
      
      if (adminUser) {
        // Generate a simple demo token
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
    
    res.status(401).json({ 
      error: 'Invalid credentials',
      hint: 'Use admin@travelbuddy.com for demo admin access'
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