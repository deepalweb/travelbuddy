import mongoose from 'mongoose';

// Subscription tiers and their features
const SUBSCRIPTION_TIERS = {
  free: {
    aiTripGeneration: { limit: 2, period: 'month' },
    placesSearch: { limit: 50, period: 'day' },
    tripPlans: { limit: 3, period: 'month' }
  },
  basic: {
    aiTripGeneration: { limit: 10, period: 'month' },
    placesSearch: { limit: 200, period: 'day' },
    tripPlans: { limit: 15, period: 'month' }
  },
  premium: {
    aiTripGeneration: { limit: 50, period: 'month' },
    placesSearch: { limit: 1000, period: 'day' },
    tripPlans: { limit: 100, period: 'month' }
  },
  pro: {
    aiTripGeneration: { limit: -1 }, // unlimited
    placesSearch: { limit: -1 },
    tripPlans: { limit: -1 }
  }
};

// Usage tracking schema
const usageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feature: { type: String, required: true },
  count: { type: Number, default: 0 },
  period: { type: String, required: true }, // 'day' or 'month'
  date: { type: String, required: true }, // YYYY-MM-DD or YYYY-MM
  createdAt: { type: Date, default: Date.now }
});

usageSchema.index({ userId: 1, feature: 1, period: 1, date: 1 }, { unique: true });

let Usage;
try {
  Usage = mongoose.model('Usage', usageSchema);
} catch {
  Usage = mongoose.model('Usage');
}

// Get current usage for a user and feature
async function getCurrentUsage(userId, feature, period) {
  const now = new Date();
  const dateKey = period === 'day' 
    ? now.toISOString().split('T')[0] // YYYY-MM-DD
    : now.toISOString().slice(0, 7);  // YYYY-MM

  try {
    const usage = await Usage.findOne({
      userId,
      feature,
      period,
      date: dateKey
    });
    return usage ? usage.count : 0;
  } catch (error) {
    console.error('Error getting usage:', error);
    return 0;
  }
}

// Increment usage for a user and feature
async function incrementUsage(userId, feature, period) {
  const now = new Date();
  const dateKey = period === 'day' 
    ? now.toISOString().split('T')[0] // YYYY-MM-DD
    : now.toISOString().slice(0, 7);  // YYYY-MM

  try {
    await Usage.findOneAndUpdate(
      { userId, feature, period, date: dateKey },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

// Check if user has access to a feature
export const requireSubscription = (feature) => {
  return async (req, res, next) => {
    try {
      // Get user ID from various sources
      const userId = req.headers['x-user-id'] || req.user?.uid || req.user?.id;
      const demoToken = req.headers['authorization']?.includes('demo-token');
      
      // Allow demo users or bypass in development
      if (!userId && !demoToken) {
        // In development, create a temporary user for testing
        if (process.env.NODE_ENV !== 'production') {
          req.subscription = {
            tier: 'premium',
            feature,
            usage: 1,
            limit: 50,
            period: 'month'
          };
          return next();
        }
        
        return res.status(401).json({ 
          error: 'Authentication required',
          feature,
          upgradeRequired: true
        });
      }
      
      // Handle demo users
      if (demoToken) {
        req.subscription = {
          tier: 'premium',
          feature,
          usage: 1,
          limit: 50,
          period: 'month'
        };
        return next();
      }

      // Get user from database
      const User = global.User || mongoose.model('User');
      let user = await User.findOne({ firebaseUid: userId });
      if (!user) {
        user = await User.findById(userId);
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userTier = user.tier || 'free';
      const tierLimits = SUBSCRIPTION_TIERS[userTier];

      if (!tierLimits || !tierLimits[feature]) {
        return res.status(403).json({
          error: 'Feature not available in your plan',
          feature,
          currentTier: userTier,
          upgradeRequired: true
        });
      }

      const featureLimit = tierLimits[feature];
      
      // Check if unlimited access
      if (featureLimit.limit === -1) {
        return next();
      }

      // Check current usage
      const currentUsage = await getCurrentUsage(user._id, feature, featureLimit.period);
      
      if (currentUsage >= featureLimit.limit) {
        return res.status(429).json({
          error: 'Feature usage limit exceeded',
          feature,
          currentTier: userTier,
          limit: featureLimit.limit,
          period: featureLimit.period,
          currentUsage,
          upgradeRequired: true,
          nextTier: getNextTier(userTier)
        });
      }

      // Increment usage
      await incrementUsage(user._id, feature, featureLimit.period);

      // Add usage info to request
      req.subscription = {
        tier: userTier,
        feature,
        usage: currentUsage + 1,
        limit: featureLimit.limit,
        period: featureLimit.period
      };

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Subscription check failed' });
    }
  };
};

// Get next available tier
function getNextTier(currentTier) {
  const tiers = ['free', 'basic', 'premium', 'pro'];
  const currentIndex = tiers.indexOf(currentTier);
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
}

// Get user's subscription status and usage
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.user?.uid || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const User = global.User || mongoose.model('User');
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userTier = user.tier || 'free';
    const tierLimits = SUBSCRIPTION_TIERS[userTier];

    // Get current usage for all features
    const usage = {};
    for (const [feature, limits] of Object.entries(tierLimits)) {
      if (limits.period) {
        usage[feature] = {
          current: await getCurrentUsage(user._id, feature, limits.period),
          limit: limits.limit,
          period: limits.period
        };
      }
    }

    res.json({
      tier: userTier,
      limits: tierLimits,
      usage,
      availableTiers: SUBSCRIPTION_TIERS
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

// Upgrade user subscription (manual for now)
export const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.user?.uid || req.user?.id;
    const { tier } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!SUBSCRIPTION_TIERS[tier]) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const User = global.User || mongoose.model('User');
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user tier
    user.tier = tier;
    user.subscriptionStatus = 'active';
    user.subscriptionEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await user.save();

    res.json({
      success: true,
      tier,
      message: `Successfully upgraded to ${tier} plan`
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
};

export default { requireSubscription, getSubscriptionStatus, upgradeSubscription };