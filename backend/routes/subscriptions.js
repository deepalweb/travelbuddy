import express from 'express';
import { getSubscriptionStatus, upgradeSubscription } from '../middleware/subscriptionCheck.js';

const router = express.Router();

// Get user's subscription status and usage
router.get('/status', getSubscriptionStatus);

// Upgrade subscription (manual for now)
router.post('/upgrade', upgradeSubscription);

// Get available subscription tiers
router.get('/tiers', (req, res) => {
  const tiers = {
    free: {
      name: 'Explorer',
      price: 0,
      features: [
        '2 AI trip generations per month',
        '50 place searches per day',
        '3 trip plans per month',
        'Basic support'
      ]
    },
    basic: {
      name: 'Wanderer',
      price: 9.99,
      features: [
        '10 AI trip generations per month',
        '200 place searches per day',
        '15 trip plans per month',
        'Email support',
        'Offline maps'
      ]
    },
    premium: {
      name: 'Adventurer',
      price: 19.99,
      features: [
        '50 AI trip generations per month',
        '1000 place searches per day',
        '100 trip plans per month',
        'Priority support',
        'Advanced features',
        'Custom itineraries'
      ]
    },
    pro: {
      name: 'Explorer Pro',
      price: 39.99,
      features: [
        'Unlimited AI trip generations',
        'Unlimited place searches',
        'Unlimited trip plans',
        '24/7 priority support',
        'All premium features',
        'API access',
        'White-label options'
      ]
    }
  };

  res.json(tiers);
});

export default router;