import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  tier: { type: String, required: true, enum: ['free', 'basic', 'premium', 'pro'] },
  status: { type: String, required: true, enum: ['trial', 'active', 'cancelled', 'expired'] },
  paymentId: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// Trial History Schema
const trialHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  tier: String,
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const TrialHistory = mongoose.model('TrialHistory', trialHistorySchema);

// Create subscription
router.post('/', async (req, res) => {
  try {
    console.log('Creating subscription with data:', req.body);
    
    const { userId, tier, status, paymentId, startDate, endDate } = req.body;
    
    // Validate required fields
    if (!userId || !tier || !status || !startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['userId', 'tier', 'status', 'startDate', 'endDate'],
        received: { userId, tier, status, startDate, endDate }
      });
    }
    
    // Check if user exists (Firebase UID)
    const User = mongoose.model('User');
    const user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create subscription
    const subscription = new Subscription({
      userId,
      tier,
      status,
      paymentId,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    });

    await subscription.save();
    console.log('Subscription created:', subscription._id);

    // Update user subscription status
    await User.findOneAndUpdate({ firebaseUid: userId }, {
      tier,
      subscriptionStatus: status,
      subscriptionEndDate: endDate,
      trialEndDate: status === 'trial' ? endDate : undefined
    });
    console.log('User updated with subscription status');

    // Record trial history if it's a trial
    if (status === 'trial') {
      const trialHistory = new TrialHistory({
        userId,
        tier,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      await trialHistory.save();
      console.log('Trial history recorded');
    }

    res.status(201).json(subscription);
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(400).json({ error: error.message, details: error.stack });
  }
});

// Get subscription by user ID
router.get('/:userId', async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    if (!subscription) {
      return res.json({ tier: 'free', status: 'none', active: false });
    }

    const now = new Date();
    const isActive = subscription.endDate > now && subscription.status !== 'cancelled';

    res.json({
      tier: subscription.tier,
      status: subscription.status,
      endDate: subscription.endDate,
      autoRenew: subscription.autoRenew,
      active: isActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check trial history
router.get('/:userId/trial-history', async (req, res) => {
  try {
    console.log('Checking trial history for user:', req.params.userId);
    const trialHistory = await TrialHistory.findOne({ userId: req.params.userId });
    console.log('Trial history found:', !!trialHistory);
    res.json({ hasUsedTrial: !!trialHistory });
  } catch (error) {
    console.error('Trial history check error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/:userId/cancel', async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    
    const subscription = await Subscription.findOneAndUpdate(
      { userId: req.params.userId, status: { $in: ['active', 'trial'] } },
      { 
        $set: { 
          cancelAtPeriodEnd,
          status: cancelAtPeriodEnd ? 'active' : 'cancelled'
        }
      },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Active subscription not found' });
    }

    // Update user status if immediate cancellation
    if (!cancelAtPeriodEnd) {
      const User = mongoose.model('User');
      await User.findOneAndUpdate({ firebaseUid: req.params.userId }, {
        tier: 'free',
        subscriptionStatus: 'cancelled'
      });
    }

    res.json({ success: true, subscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;