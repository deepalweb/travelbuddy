import { SUBSCRIPTION_PLANS, checkFeatureAccess } from '../config/subscriptionPlans.js';

export const requireSubscription = (feature, options = {}) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userTier = user.tier || 'explorer';
      const hasAccess = checkFeatureAccess(userTier, feature, options.usage);

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Subscription upgrade required',
          feature,
          currentTier: userTier,
          requiredTier: getRequiredTier(feature)
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Subscription check failed' });
    }
  };
};

const getRequiredTier = (feature) => {
  for (const [tier, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.features[feature]) return tier;
  }
  return 'globetrotter';
};