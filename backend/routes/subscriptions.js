import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tier: String,
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const TrialHistory = mongoose.model('TrialHistory', trialHistorySchema);

// Create subscription
router.post('/', async (req, res) => {
  try {
    const { userId, tier, status, paymentId, startDate, endDate } = req.body;
    
    // Check if user exists
    const User = mongoose.model('User');
    const user = await User.findById(userId);
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

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      tier,
      subscriptionStatus: status,
      subscriptionEndDate: endDate,
      trialEndDate: status === 'trial' ? endDate : undefined
    });

    // Record trial history if it's a trial
    if (status === 'trial') {
      const trialHistory = new TrialHistory({
        userId,
        tier,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });
      await trialHistory.save();
    }

    res.status(201).json(subscription);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    const trialHistory = await TrialHistory.findOne({ userId: req.params.userId });
    res.json({ hasUsedTrial: !!trialHistory });
  } catch (error) {
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
      await User.findByIdAndUpdate(req.params.userId, {
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