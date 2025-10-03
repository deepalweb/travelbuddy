const express = require('express');
const router = express.Router();
const User = require('../models/EnhancedUser');

// Get user's daily usage
router.get('/users/:userId/usage/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    const user = await User.findOne({
      $or: [{ _id: userId }, { uid: userId }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const usage = user.dailyUsage?.get(date) || {
      places: 0,
      aiQueries: 0,
      deals: 0,
      posts: 0
    };
    
    res.json({ usage });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Update user's daily usage
router.post('/users/:userId/usage', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date, usage } = req.body;
    
    const user = await User.findOne({
      $or: [{ _id: userId }, { uid: userId }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize dailyUsage if not exists
    if (!user.dailyUsage) {
      user.dailyUsage = new Map();
    }
    
    user.dailyUsage.set(date, usage);
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

// Get user's usage history (last 30 days)
router.get('/users/:userId/usage-history', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({
      $or: [{ _id: userId }, { uid: userId }]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const usage = user.dailyUsage?.get(dateStr) || {
        places: 0,
        aiQueries: 0,
        deals: 0,
        posts: 0
      };
      
      history.push({ date: dateStr, usage });
    }
    
    res.json({ history });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

module.exports = router;