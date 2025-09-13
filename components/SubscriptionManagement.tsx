import React, { useState, useEffect } from 'react';
import { CurrentUser, SubscriptionTier } from '../types.ts';
import { subscriptionService, SubscriptionData, TIER_LIMITS } from '../services/subscriptionService.ts';
import { SUBSCRIPTION_TIERS } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { Colors } from '../constants.ts';
import { CheckCircle, Crown, TrendingUp } from './Icons.tsx';

interface SubscriptionManagementProps {
  user: CurrentUser;
  onSubscriptionChange: (subscriptionData: SubscriptionData) => void;
  onShowUsageAnalytics?: () => void;
  isAdmin?: boolean;
}

const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  user,
  onSubscriptionChange,
  onShowUsageAnalytics,
  isAdmin = false,
}) => {
  const { t } = useLanguage();
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate trial days remaining
  const getTrialInfo = () => {
    if (user.subscriptionStatus !== 'trial' || !user.trialEndDate) return null;
    
    const trialEnd = new Date(user.trialEndDate);
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    return { daysRemaining, totalDays: TIER_LIMITS[user.tier].trialDays };
  };

  // Load user usage stats
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const userKey = user.mongoId || user.email || user.username;
        const userUsage = await subscriptionService.getUserUsage(userKey);
        setUsage(userUsage);
      } catch (err) {
        console.error('Failed to load usage:', err);
      }
    };

    loadUsage();
  }, [user]);

  const handleStartTrial = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const subscriptionData = await subscriptionService.startTrial(user, tier);
      onSubscriptionChange(subscriptionData);
    } catch (err: any) {
      setError(err.message || 'Failed to start trial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tier: SubscriptionTier) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const subscriptionData = await subscriptionService.subscribe(user, tier);
      onSubscriptionChange(subscriptionData);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const subscriptionData = await subscriptionService.cancelSubscription(user);
      onSubscriptionChange(subscriptionData);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeTier = async (newTier: SubscriptionTier) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const subscriptionData = await subscriptionService.changeTier(user, newTier);
      onSubscriptionChange(subscriptionData);
    } catch (err: any) {
      setError(err.message || 'Failed to change tier');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (tierKey: SubscriptionTier) => {
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.key === tierKey);
    if (!tierInfo) return { amount: 0, suffix: '/mo' };
    
    if (selectedBilling === 'annual' && tierInfo.priceAnnually) {
      const monthlyEquivalent = (tierInfo.priceAnnually / 12).toFixed(2);
      return { 
        amount: tierInfo.priceAnnually, 
        suffix: '/year',
        monthlyEquivalent: `($${monthlyEquivalent}/mo)`
      };
    }
    
    return { amount: tierInfo.priceMonthly, suffix: '/mo' };
  };

  const renderUsageBar = (used: number, limit: number, label: string) => {
    if (limit === -1) {
      return (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium" style={{ color: Colors.text }}>{label}</span>
          <span className="text-sm text-green-600">Unlimited</span>
        </div>
      );
    }

    const percentage = Math.min((used / limit) * 100, 100);
    const isNearLimit = percentage > 80;

    return (
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium" style={{ color: Colors.text }}>{label}</span>
          <span className="text-sm" style={{ color: isNearLimit ? Colors.accentError : Colors.text_secondary }}>
            {used}/{limit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: isNearLimit ? Colors.accentError : Colors.primary,
            }}
          />
        </div>
      </div>
    );
  };

  const renderActionButton = (tierKey: SubscriptionTier) => {
    const isCurrent = user.tier === tierKey;
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.key === tierKey);
    const limits = TIER_LIMITS[tierKey];
    const trialInfo = getTrialInfo();

    if (isCurrent) {
      if (user.subscriptionStatus === 'trial') {
        return (
          <div className="space-y-2">
            <button
              className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: Colors.primary,
                color: 'white',
              }}
              onClick={() => handleSubscribe(tierKey)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Upgrade to Full ${tierInfo?.nameKey || tierKey}`}
            </button>
            {trialInfo && (
              <p className="text-sm text-center" style={{ color: Colors.text_secondary }}>
                {trialInfo.daysRemaining} days left in trial
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="space-y-2">
          <button
            className="w-full py-2 px-4 rounded-lg font-medium"
            style={{
              backgroundColor: Colors.cardBackground,
              color: Colors.text,
              border: `1px solid ${Colors.primary}`,
            }}
            disabled
          >
            Current Plan
          </button>
          {user.subscriptionStatus === 'active' && tierKey !== 'free' && (
            <button
              className="w-full py-2 px-4 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
              onClick={handleCancelSubscription}
              disabled={isLoading}
            >
              {isLoading ? 'Canceling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      );
    }

    // Not current tier
    const tierHierarchy: Record<SubscriptionTier, number> = { free: 0, basic: 1, premium: 2, pro: 3 };
    const isUpgrade = tierHierarchy[tierKey] > tierHierarchy[user.tier];

    if (tierKey === 'free') {
      return (
        <button
          className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200"
          style={{
            backgroundColor: Colors.cardBackground,
            color: Colors.text,
            border: `1px solid ${Colors.cardBorder}`,
          }}
          onClick={() => handleChangeTier('free')}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Downgrade to Free'}
        </button>
      );
    }

    if (user.subscriptionStatus === 'none' && limits.hasTrialAccess) {
      return (
        <div className="space-y-2">
          <button
            className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: Colors.primary,
              color: 'white',
            }}
            onClick={() => handleStartTrial(tierKey)}
            disabled={isLoading}
          >
            {isLoading ? 'Starting...' : `Start ${limits.trialDays}-Day Free Trial`}
          </button>
          <button
            className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: Colors.cardBackground,
              color: Colors.text,
              border: `1px solid ${Colors.primary}`,
            }}
            onClick={() => handleSubscribe(tierKey)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>
      );
    }

    return (
      <button
        className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200"
        style={{
          backgroundColor: isUpgrade ? Colors.primary : Colors.cardBackground,
          color: isUpgrade ? 'white' : Colors.text,
          border: isUpgrade ? 'none' : `1px solid ${Colors.primary}`,
        }}
        onClick={() => isUpgrade ? handleSubscribe(tierKey) : handleChangeTier(tierKey)}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : (isUpgrade ? 'Upgrade' : 'Change to This Plan')}
      </button>
    );
  };

  const renderUsageStats = () => {
    if (!usage) return null;

    const limits = TIER_LIMITS[user.tier];

    return (
      <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: Colors.text }}>
          Your Usage This Month
        </h3>
        
        {renderUsageBar(usage.placesSearched, limits.placesPerDay, 'Places Searched')}
        {renderUsageBar(usage.aiQueriesUsed, limits.aiQueriesPerDay, 'AI Queries')}
        {renderUsageBar(usage.dealsViewed, limits.dealsPerDay, 'Deals Viewed')}
        {renderUsageBar(usage.favoritesUsed, limits.favoritesMax, 'Favorites Saved')}
        {renderUsageBar(usage.postsCreated, limits.postsPerDay, 'Posts Created')}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: Colors.text }}>
          Subscription Management
        </h1>
        <p className="text-lg" style={{ color: Colors.text_secondary }}>
          Choose the perfect plan for your travel needs
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              selectedBilling === 'monthly' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setSelectedBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
              selectedBilling === 'annual' ? 'bg-white shadow-sm' : ''
            }`}
            onClick={() => setSelectedBilling('annual')}
          >
            Annual (Save 17%)
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      {renderUsageStats()}

      {/* Subscription Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SUBSCRIPTION_TIERS.map((tier) => {
          const price = getPrice(tier.key);
          const isCurrent = user.tier === tier.key;
          const isRecommended = tier.isRecommended;

          return (
            <div
              key={tier.key}
              className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                isCurrent ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
              } ${isRecommended && !isCurrent ? 'border-green-500' : ''}`}
              style={{ backgroundColor: Colors.cardBackground }}
            >
              {/* Badges */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}
              {isRecommended && !isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}

              {/* Tier Header */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2" style={{ color: Colors.text }}>
                  {t(tier.nameKey)}
                  {tier.key === 'premium' && <Crown className="inline ml-2 w-5 h-5 text-yellow-500" />}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold" style={{ color: Colors.text }}>
                    ${price.amount}
                  </span>
                  <span className="text-lg" style={{ color: Colors.text_secondary }}>
                    {price.suffix}
                  </span>
                </div>
                {price.monthlyEquivalent && (
                  <p className="text-sm text-green-600">{price.monthlyEquivalent}</p>
                )}
                <p className="text-sm" style={{ color: Colors.text_secondary }}>
                  {t(tier.descriptionKey)}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span
                      className={`text-sm ${feature.isHighlighted ? 'font-medium' : ''}`}
                      style={{ color: Colors.text }}
                    >
                      {t(feature.textKey)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              {renderActionButton(tier.key)}
            </div>
          );
        })}
      </div>

      {/* Admin Analytics */}
      {isAdmin && onShowUsageAnalytics && (
        <div className="text-center">
          <button
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: Colors.primary,
              color: 'white',
              boxShadow: Colors.boxShadowButton,
            }}
            onClick={onShowUsageAnalytics}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            View Subscription Analytics
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
