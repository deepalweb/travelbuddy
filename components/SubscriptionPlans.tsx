import React, { useMemo, useState } from 'react';
import { CurrentUser, SubscriptionTier } from '../types.ts';
import { SUBSCRIPTION_TIERS } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { CheckCircle, Crown } from './Icons.tsx';

interface SubscriptionPlansProps {
  user: CurrentUser;
  onStartTrial: (tier: SubscriptionTier) => void;
  onSubscribe: (tier: SubscriptionTier) => void;
  onCancelSubscription: () => void;
  onUpgradeDowngradeTier: (tier: SubscriptionTier) => void;
}

type BillingCycle = 'monthly' | 'annual';

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  user,
  onStartTrial,
  onSubscribe,
  onCancelSubscription,
  onUpgradeDowngradeTier,
}) => {
  const { t } = useLanguage();
  const [billing, setBilling] = useState<BillingCycle>('monthly');

  const visibleTiers = useMemo(() => SUBSCRIPTION_TIERS, []);

  const getPrice = (tierKey: SubscriptionTier) => {
    const info = visibleTiers.find(ti => ti.key === tierKey);
    if (!info) return { amount: 0, suffix: '/mo' };
    if (billing === 'annual' && info.priceAnnually) {
      return { amount: info.priceAnnually, suffix: '/yr' };
    }
    return { amount: info.priceMonthly, suffix: '/mo' };
  };

  const renderAction = (tierKey: SubscriptionTier) => {
    const isCurrent = user.tier === tierKey;
    if (isCurrent) {
      // Allow cancel if active paid plan
      const canCancel = user.subscriptionStatus === 'active' && tierKey !== 'free';
      return (
        <div className="flex gap-2">
          <button className="w-full btn btn-secondary" disabled>
            {t('profileView.subscription.currentPlan')}
          </button>
          {canCancel && (
            <button className="w-full btn btn-secondary" onClick={onCancelSubscription}>
              {t('profileView.subscription.cancel')}
            </button>
          )}
        </div>
      );
    }

    if (user.tier === 'free' && tierKey !== 'free') {
      return (
        <div className="flex gap-2">
          <button className="w-full btn btn-primary" onClick={() => onStartTrial(tierKey)}>
            {t('profileView.subscription.startTrial')}
          </button>
          <button className="w-full btn btn-secondary" onClick={() => onSubscribe(tierKey)}>
            {t('profileView.subscription.upgrade')}
          </button>
        </div>
      );
    }

    // Upgrade or Downgrade path
    return (
      <button className="w-full btn btn-primary" onClick={() => onUpgradeDowngradeTier(tierKey)}>
        {t('profileView.subscription.choosePlan')}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Billing toggle */}
      <div className="card-base p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-indigo-600" />
          <p className="font-semibold">{t('profileView.subscription.chooseBilling')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`btn text-sm ${billing === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBilling('monthly')}
          >
            {t('profileView.subscription.monthly')}
          </button>
          <button
            className={`btn text-sm ${billing === 'annual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBilling('annual')}
          >
            {t('profileView.subscription.annual')}
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {visibleTiers.map(tier => {
          const isCurrent = user.tier === tier.key;
          const price = getPrice(tier.key);
          return (
            <div
              key={tier.key}
              className={`p-6 rounded-xl transition-all duration-300 border relative ${isCurrent ? 'border-indigo-500 shadow-md' : 'border-gray-200'}`}
              style={{ backgroundColor: isCurrent ? 'var(--color-primary)08' : 'transparent' }}
            >
              {tier.isRecommended && (
                <span className="absolute -top-3 left-3 px-2 py-1 text-xs rounded-md bg-indigo-600 text-white">
                  {t('profileView.subscription.recommended')}
                </span>
              )}
              {tier.badgeTextKey && (
                <span className="absolute -top-3 right-3 px-2 py-1 text-xs rounded-md bg-amber-500 text-white">
                  {t(tier.badgeTextKey)}
                </span>
              )}
              <h4 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{t(tier.nameKey)}</h4>
              <p className="text-3xl font-bold my-2">
                ${price.amount}
                <span className="text-sm font-normal">{price.suffix}</span>
              </p>
              <ul className="space-y-2 my-4 text-sm">
                {tier.features.map((feat, i) => (
                  <li key={i} className={`flex items-start gap-2 ${feat.isHighlighted ? 'font-medium' : ''}`}>
                    <CheckCircle size={16} className="mt-0.5 text-green-500" />
                    <span>{t(feat.textKey)}</span>
                  </li>
                ))}
              </ul>
              {renderAction(tier.key)}
            </div>
          );
        })}
      </div>

      {/* Comparison table (compact) */}
      <div className="card-base p-4 overflow-auto">
        <p className="font-semibold mb-3">{t('profileView.subscription.compare')}</p>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4">{t('profileView.subscription.feature')}</th>
              {visibleTiers.map(tier => (
                <th key={tier.key} className="text-left py-2 pr-4">{t(tier.nameKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/** Use a subset of common features to compare visually */}
            {[
              'subscriptionTiers.features.placeDiscoveryFull',
              'subscriptionTiers.features.oneDayItineraryGeneration',
              'subscriptionTiers.features.aiTripPlanner',
              'subscriptionTiers.features.communityCreateAndShare',
              'subscriptionTiers.features.userReviewsWrite',
            ].map((featureKey) => (
              <tr key={featureKey} className="border-t border-gray-200">
                <td className="py-2 pr-4">{t(featureKey)}</td>
                {visibleTiers.map(tier => (
                  <td key={tier.key} className="py-2 pr-4">
                    {tier.features.some(f => f.textKey === featureKey) ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
