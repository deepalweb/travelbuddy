
import React from 'react';
import { Colors, SUBSCRIPTION_TIERS } from '../constants.ts';
import { CurrentUser, SubscriptionTier } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import LockIcon from './LockIcon.tsx';

interface SubscriptionRequiredOverlayProps {
  currentUser: CurrentUser | null;
  onStartTrial: (tier: SubscriptionTier) => void;
  onSubscribe: (tier: SubscriptionTier) => void;
  onUpgradeDowngradeTier: (newTier: SubscriptionTier) => void;
  featureName?: string; 
  requiredTier: SubscriptionTier;
  onNavigateToProfile: () => void;
}

const SubscriptionRequiredOverlay: React.FC<SubscriptionRequiredOverlayProps> = ({
  currentUser,
  onStartTrial,
  // onSubscribe, // Direct subscribe might be less common here, usually trial or upgrade
  onUpgradeDowngradeTier,
  featureName,
  requiredTier,
  onNavigateToProfile
}) => {
  const { t } = useLanguage();

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1.25rem', 
    padding: '2rem', 
    boxShadow: Colors.boxShadow,
    textAlign: 'center',
    maxWidth: '550px', 
    margin: '2rem auto',
  };

  const headingStyle: React.CSSProperties = {
    color: Colors.primary,
    fontSize: '1.5rem', 
    fontWeight: '700',
    marginBottom: '1rem',
  };

  const textStyle: React.CSSProperties = {
    color: Colors.text_secondary,
    fontSize: '1rem', 
    lineHeight: 1.7,
    marginBottom: '1.5rem',
  };

  const baseButtonStyle: React.CSSProperties = {
    padding: '0.875rem 1.75rem', 
    borderRadius: '0.75rem', 
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: Colors.boxShadowButton,
    display: 'inline-block',
    textAlign: 'center',
    fontSize: '1rem', 
    margin: '0.5rem',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundImage: `linear-gradient(145deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
    color: 'white',
  };
  
  const secondaryButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: Colors.cardBackground,
    color: Colors.primary,
    border: `1px solid ${Colors.primary}`,
  };

  const requiredTierInfo = SUBSCRIPTION_TIERS.find(tInfo => tInfo.key === requiredTier);
  const requiredTierName = requiredTierInfo ? t(requiredTierInfo.nameKey) : requiredTier;
  const featureDisplayName = featureName || t('subscriptionOverlay.thisFeature');

  let title = t('subscriptionOverlay.accessFeature', { featureName: featureDisplayName });
  let message = t('subscriptionOverlay.messageDefault', { featureName: featureDisplayName, requiredTierName });
  let ctaAction = () => onNavigateToProfile();
  let ctaTextKey = 'subscriptionOverlay.viewAllPlansButton'; // Default to viewing plans


  if (currentUser) {
    const userTierInfo = SUBSCRIPTION_TIERS.find(tInfo => tInfo.key === currentUser.tier);
    const currentUserTierName = userTierInfo ? t(userTierInfo.nameKey) : currentUser.tier;
    const tierHierarchy: Record<SubscriptionTier, number> = { free: 0, basic: 1, premium: 2, pro: 3 };

    if (currentUser.subscriptionStatus === 'expired') {
      title = t('subscriptionOverlay.statusExpiredTitle');
      message = t('subscriptionOverlay.statusExpiredMessage', { featureName: featureDisplayName, requiredTierName });
      ctaAction = () => onUpgradeDowngradeTier(requiredTier); 
      ctaTextKey = 'subscriptionOverlay.resubscribeToTierButton';
    } else if (currentUser.subscriptionStatus === 'canceled') {
      title = t('subscriptionOverlay.statusCanceledTitle');
      message = t('subscriptionOverlay.statusCanceledMessage', { featureName: featureDisplayName, requiredTierName });
      ctaAction = () => onUpgradeDowngradeTier(requiredTier);
      ctaTextKey = 'subscriptionOverlay.resubscribeToTierButton';
    } else if (tierHierarchy[currentUser.tier] < tierHierarchy[requiredTier]) { // User's tier is lower than required
        if (currentUser.tier === 'free' && requiredTier !== 'free') {
            title = t('subscriptionOverlay.upgradeRequiredTitle', { requiredTierName });
            message = t('subscriptionOverlay.upgradeMessage', { featureName: featureDisplayName, requiredTierName });
            // Offer trial for the specific required tier if it's not 'free'
            ctaAction = () => onStartTrial(requiredTier); 
            ctaTextKey = 'subscriptionOverlay.startTrialForTierButton';
        } else { // User is on a paid tier, but it's lower than requiredTier
            title = t('subscriptionOverlay.upgradeRequiredTitle', { requiredTierName });
            message = t('subscriptionOverlay.upgradeMessageHigherTier', { featureName: featureDisplayName, currentTierName: currentUserTierName, requiredTierName});
            ctaAction = () => onUpgradeDowngradeTier(requiredTier);
            ctaTextKey = 'subscriptionOverlay.upgradeToTierButton';
        }
    } else { 
         // This case implies user has the tier but status is 'none' or something unexpected.
         // Or, the feature is actually available but overlay was shown by mistake.
         // Defaulting to "manage subscription" is safer.
         title = t('subscriptionOverlay.accessFeature', { featureName: featureDisplayName });
         message = t('subscriptionOverlay.manageSubscriptionToAccess', { featureName: featureDisplayName, requiredTierName });
         ctaAction = () => onNavigateToProfile();
         ctaTextKey = 'subscriptionOverlay.manageSubscriptionButton';
    }
  } else { // Not logged in
     title = t('subscriptionOverlay.loginRequiredTitle');
     message = t('subscriptionOverlay.notLoggedInMessage', { featureName: featureDisplayName, requiredTierName });
     ctaAction = () => onNavigateToProfile(); // Profile page will show auth modal
     ctaTextKey = 'subscriptionOverlay.loginRegisterButton';
  }


  return (
    <div style={cardStyle} className="animate-fadeInUp">
      <LockIcon className="w-12 h-12 mx-auto mb-4" color={Colors.primary} />
      <h2 style={headingStyle}>{title}</h2>
      <p style={textStyle}>{message}</p>
      
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <button 
          onClick={ctaAction} 
          style={primaryButtonStyle}
          className="focus:outline-none focus:ring-2 focus:ring-white/70 active:scale-95"
          aria-label={t(ctaTextKey, { tierName: requiredTierName })}
        >
          {t(ctaTextKey, { tierName: requiredTierName })}
        </button>
        {currentUser && (ctaTextKey !== 'subscriptionOverlay.manageSubscriptionButton' && ctaTextKey !== 'subscriptionOverlay.viewAllPlansButton') && (
            // Show "View All Plans" as secondary if primary CTA is something else
            <button 
                onClick={onNavigateToProfile} 
                style={secondaryButtonStyle}
                className="focus:outline-none focus:ring-2 focus:ring-blue-400/70 active:scale-95"
                aria-label={t('subscriptionOverlay.viewAllPlansButton')}
            >
                {t('subscriptionOverlay.viewAllPlansButton')}
            </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRequiredOverlay;
