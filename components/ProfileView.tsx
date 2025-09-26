import React, { useState } from 'react';
import { CurrentUser, Place, TripPlanSuggestion, SubscriptionTier } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { SUBSCRIPTION_TIERS, SUPPORTED_LANGUAGES } from '../constants.ts';
import {
    User, Heart, Calendar, Crown, Settings, Edit3, Camera, Share, Download, Bell, Sun, Moon, Lock, MapPin
} from './Icons.tsx';
import MerchantDealManager from './MerchantDealManager.tsx';
import ProfilePictureUpload from './ProfilePictureUpload.tsx';
import { uploadProfilePicture } from '../services/profilePictureService.ts';
import SubscriptionPlans from './SubscriptionPlans.tsx';
import OnboardingProgress from './OnboardingProgress.tsx';
import { apiService } from '../services/apiService.ts';


type ProfileTab = 'profile' | 'favorites' | 'trips' | 'merchant' | 'subscription' | 'settings';

interface ProfileViewProps {
  user: CurrentUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  favoritePlaces: Place[];
  savedTripPlans: TripPlanSuggestion[];
  onViewSavedTripPlan: (plan: TripPlanSuggestion) => void;
  onDeleteSavedTripPlan: (planId: string) => void;
  onShareTripPlanToCommunity: (plan: TripPlanSuggestion) => void;
  onProfilePictureUpload?: (imageDataUrl: string) => Promise<void>;
  onOpenProfilePictureModal?: () => void;
  onSelectPlaceDetail?: (place: Place) => void;
  onRemoveFavorite?: (placeId: string) => void;
  onStartOnboarding?: () => void;
  onCompleteProfileSetup?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
    user,
    setCurrentUser,
    favoritePlaces,
    savedTripPlans,
    onViewSavedTripPlan,
    onSelectPlaceDetail,
    onRemoveFavorite,
    onStartOnboarding,
    onCompleteProfileSetup,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isProfilePictureModalOpen, setIsProfilePictureModalOpen] = useState(false);
  const { t, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

        // --- Subscription actions (persist to backend) ---

    const startTrial = async (tier: SubscriptionTier) => {
    const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        // optimistic update
        setCurrentUser(prev => prev ? ({ ...prev, tier, subscriptionStatus: 'trial', trialEndDate }) : null);
        // persist to backend
        try {
            if (user?.mongoId) {
                    const res = await apiService.startTrial(user.mongoId, tier);
                    const updated = res.user || res;
                setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
            }
        } catch (e) {
            console.error('Failed to start trial:', e);
        }
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.key === tier);
    addToast({message: t('accountSettings.freeTrialStartedForTier', {tierName: t(tierInfo?.nameKey || 'tier')}), type: 'success'});
  };

    const subscribe = async (tier: SubscriptionTier) => {
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        const newState = { tier, subscriptionStatus: 'active' as const, subscriptionEndDate: subscriptionEndDate.toISOString(), trialEndDate: undefined };
        setCurrentUser(prev => prev ? ({ ...prev, ...newState }) : null);
        try {
            if (user?.mongoId) {
                    const res = await apiService.subscribeUser(user.mongoId, tier);
                    const updated = res.user || res;
                setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
            }
        } catch (e) {
            console.error('Failed to activate subscription:', e);
        }
    const tierInfo = SUBSCRIPTION_TIERS.find(t => t.key === tier);
    addToast({message: t('accountSettings.subscriptionActivatedForTier', {tierName: t(tierInfo?.nameKey || 'tier')}), type: 'success'});
  };

    const cancelSubscription = async () => {
        setCurrentUser(prev => prev ? ({ ...prev, subscriptionStatus: 'canceled' as const }) : null);
        try {
            if (user?.mongoId) {
                    const res = await apiService.cancelSubscription(user.mongoId);
                    const updated = res.user || res;
                setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
            }
        } catch (e) {
            console.error('Failed to cancel subscription:', e);
        }
    addToast({message: t('accountSettings.subscriptionCanceled'), type: 'info'});
  };

    const upgradeDowngradeTier = async (newTier: SubscriptionTier) => {
    if (newTier === 'free') {
            const payload = { tier: 'free' as const, subscriptionStatus: 'canceled' as const, subscriptionEndDate: undefined, trialEndDate: undefined };
            setCurrentUser(prev => prev ? ({ ...prev, ...payload }) : null);
            try {
                if (user?.mongoId) {
                    const updated = await apiService.updateUser(user.mongoId, payload);
                    setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
                }
            } catch (e) {
                console.error('Failed to downgrade tier:', e);
            }
      addToast({message: t('subscriptionTiers.downgradedToFree'), type: 'info'});
    } else {
            await subscribe(newTier);
    }
  };

    const handleLanguageChange = async (newLanguage: string) => {
            setCurrentUser(prev => prev ? ({ ...prev, language: newLanguage }) : null);
            setLanguage(newLanguage);
            try {
                if (user?.mongoId) {
                    const updated = await apiService.updateUser(user.mongoId, { language: newLanguage });
                    setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
                }
            } catch (e) {
                console.error('Failed to persist language change:', e);
            }
    };

  const handleProfilePictureUpload = async (imageDataUrl: string) => {
    if (!user?.mongoId) {
      addToast({ message: t('profilePicture.userNotFound'), type: 'error' });
      return;
    }

    try {
      const result = await uploadProfilePicture(user.mongoId, imageDataUrl);
      setCurrentUser(prev => prev ? ({ ...prev, profilePicture: result.profilePicture }) : null);
      addToast({ message: t('profilePicture.uploadSuccess'), type: 'success' });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      addToast({ message: t('profilePicture.uploadError'), type: 'error' });
      throw error;
    }
  };

  // --- End of moved logic ---

  const tabs: { id: ProfileTab; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'profile', labelKey: 'profileView.tabs.profile', icon: <User size={18} /> },
    { id: 'favorites', labelKey: 'profileView.tabs.favorites', icon: <Heart size={18} /> },
    { id: 'trips', labelKey: 'profileView.tabs.trips', icon: <Calendar size={18} /> },
    { id: 'merchant', labelKey: 'Merchant', icon: <span>🏪</span> },
    { id: 'subscription', labelKey: 'profileView.tabs.subscription', icon: <Crown size={18} /> },
    { id: 'settings', labelKey: 'profileView.tabs.settings', icon: <Settings size={18} /> },
  ];

    const renderContent = () => {
        switch (activeTab) {
                        case 'profile':
                                return (
                                        <ProfileTabContent
                                                user={user}
                                                onOpenProfilePictureModal={() => setIsProfilePictureModalOpen(true)}
                                                onSaveBasicInfo={async ({ username, email }) => {
                                                    try {
                                                        if (!user?.mongoId) return;
                                                        const payload: Partial<CurrentUser> = {};
                                                        if (username !== undefined) payload.username = username;
                                                        if (email !== undefined) payload.email = email;
                                                        const updated = await apiService.updateUser(user.mongoId, payload);
                                                        setCurrentUser(prev => prev ? ({ ...prev, ...updated }) : prev);
                                                    } catch (e) {
                                                        console.error('Failed to save basic profile info:', e);
                                                        throw e;
                                                    }
                                                }}
                                        />
                                );
            case 'favorites':
                return <FavoritesTabContent favoritePlaces={favoritePlaces} onSelectPlace={onSelectPlaceDetail} onRemoveFavorite={onRemoveFavorite} />;
            case 'trips':
                return (
                    <TripsTabContent
                        savedTripPlans={savedTripPlans}
                        onViewSavedTripPlan={onViewSavedTripPlan}
                    />
                );
            case 'merchant':
                return <MerchantTabContent user={user} />;
            case 'subscription':
                return (
                    <SubscriptionTabContent
                        user={user}
                        onStartTrial={startTrial}
                        onSubscribe={subscribe}
                        onCancelSubscription={cancelSubscription}
                        onUpgradeDowngradeTier={upgradeDowngradeTier}
                    />
                );
            case 'settings':
                return (
                    <SettingsTabContent
                        onLanguageChange={handleLanguageChange}
                        theme={theme}
                        setTheme={setTheme}
                    />
                );
            default:
                return null;
        }
    };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-fadeInUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t('profileView.title')}</h1>
        <p className="mt-1 text-md" style={{ color: 'var(--color-text-secondary)' }}>{t('profileView.description')}</p>
      </div>
      
      {/* Onboarding Progress */}
      {onStartOnboarding && onCompleteProfileSetup && (
        <OnboardingProgress 
          user={user}
          onStartOnboarding={onStartOnboarding}
          onCompleteProfileSetup={onCompleteProfileSetup}
        />
      )}
      <div className="card-base p-2 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400`}
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {tab.icon}
              <span>{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
      <div>{renderContent()}</div>
      
      {/* Profile Picture Upload Modal */}
      <ProfilePictureUpload
        isOpen={isProfilePictureModalOpen}
        onClose={() => setIsProfilePictureModalOpen(false)}
        currentPicture={user.profilePicture}
        onUpload={handleProfilePictureUpload}
      />
    </div>
  );
};

// Sub-components for each tab
interface ProfileTabProps {
    user: CurrentUser;
    onOpenProfilePictureModal?: () => void;
    onSaveBasicInfo?: (data: { username?: string; email?: string }) => Promise<void>;
}

const ProfileTabContent: React.FC<ProfileTabProps> = ({ user, onOpenProfilePictureModal, onSaveBasicInfo }) => {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    // Mock user data for editing that doesn't affect global state until saved
    const [name, setName] = useState(user.username);
    const [email, setEmail] = useState(user.email || '');

    const handleSave = async () => {
        try {
            if (onSaveBasicInfo) {
                await onSaveBasicInfo({ username: name, email });
            }
        } finally {
            setIsEditing(false);
        }
    };
    
    const stats = [
        { labelKey: 'profileView.profile.statsCountries', value: 12 },
        { labelKey: 'profileView.profile.statsPlaces', value: 42 },
        { labelKey: 'profileView.profile.statsTrips', value: 5 },
    ];

    return (
        <Card title={t('profileView.profile.title')} icon={<User />}>
            <button onClick={() => (isEditing ? handleSave() : setIsEditing(true))} className="absolute top-4 right-4 btn btn-secondary text-sm p-2">
                {isEditing ? t('profileView.profile.saveButton') : t('profileView.profile.editButton')} <Edit3 size={16} className="ml-2" />
            </button>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                    {user.profilePicture ? (
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                            <img
                                src={user.profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to default avatar if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold hidden" style={{color: 'var(--color-primary)'}}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold" style={{color: 'var(--color-primary)'}}>
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isEditing && (
                        <button 
                            onClick={onOpenProfilePictureModal}
                            className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                            <Camera size={16} />
                        </button>
                    )}
                </div>
                <div className="flex-grow text-center md:text-left">
                    {isEditing ? (
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-base text-2xl font-bold mb-1" />
                    ) : (
                        <h3 className="text-2xl font-bold">{user.username}</h3>
                    )}
                    {isEditing ? (
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-base text-md" />
                    ) : (
                        <p className="text-md" style={{color: 'var(--color-text-secondary)'}}>{user.email}</p>
                    )}
                     <div className="mt-2 flex items-center gap-2 justify-center md:justify-start">
                        <span className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1" style={{backgroundColor: `var(--color-primary)20`, color: 'var(--color-primary)'}}>
                            <Crown size={14}/> {user.tier} Plan
                        </span>
                        <span className="text-xs" style={{color: 'var(--color-text-secondary)'}}>Member since 2024</span>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t" style={{borderColor: 'var(--color-glass-border)'}}>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    {stats.map(stat => (
                        <div key={stat.labelKey}>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>{t(stat.labelKey)}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </Card>
    );
};

interface FavoritesTabProps { 
  favoritePlaces: Place[];
  onSelectPlace?: (place: Place) => void;
  onRemoveFavorite?: (placeId: string) => void;
}
const FavoritesTabContent: React.FC<FavoritesTabProps> = ({ favoritePlaces, onSelectPlace, onRemoveFavorite }) => {
    const { t } = useLanguage();
    
    if (favoritePlaces.length === 0) {
        return (
            <Card title={t('profileView.favorites.title')} icon={<Heart />}>
                <div className="text-center py-8">
                    <Heart size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No favorites yet</p>
                    <p className="text-sm opacity-70">Start exploring places and add them to your favorites!</p>
                </div>
            </Card>
        );
    }
    
    return (
        <Card title={t('profileView.favorites.title')} icon={<Heart />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoritePlaces.map(place => (
                    <div 
                        key={place.id} 
                        className="p-3 rounded-lg relative overflow-hidden hover:shadow-md transition-shadow" 
                        style={{backgroundColor: 'var(--color-input-bg)'}}
                    >
                        <div className="cursor-pointer" onClick={() => onSelectPlace?.(place)}>
                            <img src={place.photoUrl || '/images/placeholder.svg'} alt={place.name} className="w-full h-24 object-cover rounded-md mb-2" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}/>
                            <h4 className="font-semibold text-sm">{place.name}</h4>
                            <p className="text-xs flex items-center gap-1" style={{color: 'var(--color-text-secondary)'}}>
                                <MapPin size={12} /> {place.address?.split(',')[0] || 'Unknown location'}
                            </p>
                            <p className="text-xs flex items-center gap-1" style={{color: 'var(--color-text-secondary)'}}>
                               ⭐ {place.rating || 'N/A'}
                            </p>
                        </div>
                        <button 
                            onClick={() => onRemoveFavorite?.(place.id)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            title="Remove from favorites"
                        >
                            <Heart size={16} className="fill-current" />
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
};

interface TripsTabProps { savedTripPlans: TripPlanSuggestion[]; onViewSavedTripPlan: (plan: TripPlanSuggestion) => void }
const TripsTabContent: React.FC<TripsTabProps> = ({ savedTripPlans, onViewSavedTripPlan }) => {
    const { t } = useLanguage();
    const getStatusStyle = (status: string) => {
        switch(status){
            case 'upcoming': return {backgroundColor: `var(--color-accent-info)20`, color: 'var(--color-accent-info)'};
            case 'completed': return {backgroundColor: `var(--color-accent-success)20`, color: 'var(--color-accent-success)'};
            default: return {backgroundColor: `var(--color-accent-warning)20`, color: 'var(--color-accent-warning)'};
        }
    };
    return (
        <Card title={t('profileView.trips.title')} icon={<Calendar />}>
            <div className="space-y-4">
                {savedTripPlans.map(plan => (
                     <div key={plan.id} className="p-3 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-4" style={{backgroundColor: 'var(--color-input-bg)'}}>
                        <img src={plan.dailyPlans[0]?.photoUrl || '/images/placeholder.svg'} alt={plan.destination} className="w-full md:w-32 h-20 object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}/>
                        <div className="flex-grow">
                            <h4 className="font-semibold">{plan.tripTitle}</h4>
                            <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>{plan.duration} to {plan.destination}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 text-xs rounded-full font-semibold" style={getStatusStyle('upcoming')}>Upcoming</span>
                                <span className="px-2 py-0.5 text-xs rounded-full" style={{backgroundColor: 'var(--color-input-bg)'}}>{plan.duration}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 self-start md:self-center">
                            <button onClick={() => onViewSavedTripPlan(plan)} className="p-2 btn-secondary"><Edit3 size={16}/></button>
                            <button className="p-2 btn-secondary"><Share size={16}/></button>
                            <button className="p-2 btn-secondary"><Download size={16}/></button>
                        </div>
                     </div>
                ))}
            </div>
        </Card>
    );
};

interface SubscriptionTabProps {
    user: CurrentUser;
    onStartTrial: (tier: SubscriptionTier) => void;
    onSubscribe: (tier: SubscriptionTier) => void;
    onCancelSubscription: () => void;
    onUpgradeDowngradeTier: (tier: SubscriptionTier) => void;
}
const SubscriptionTabContent: React.FC<SubscriptionTabProps> = ({ user, onStartTrial, onSubscribe, onCancelSubscription, onUpgradeDowngradeTier }) => {
    const { t } = useLanguage();
    return (
                <Card title={t('profileView.subscription.title')} icon={<Crown />}>
                        <SubscriptionPlans
                            user={user}
                            onStartTrial={onStartTrial}
                            onSubscribe={onSubscribe}
                            onCancelSubscription={onCancelSubscription}
                            onUpgradeDowngradeTier={onUpgradeDowngradeTier}
                        />
                </Card>
    );
};

import type { Theme } from '../contexts/ThemeContext.tsx';
interface SettingsTabProps { onLanguageChange: (lang: string) => void; theme: Theme; setTheme: (v: Theme) => void }
const SettingsTabContent: React.FC<SettingsTabProps> = ({ onLanguageChange, theme, setTheme }) => {
    
    const handleRoleChange = async (targetRole: 'merchant' | 'agent') => {
        try {
            const response = await fetch('/api/roles/request-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetRole })
            });
            const result = await response.json();
            alert(result.message || 'Role change request submitted!');
        } catch (error) {
            alert('Failed to request role change');
        }
    };
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState({push: true, email: true, safety: false, deals: true});
    
    const handleNotifToggle = (key: keyof typeof notifications) => {
        setNotifications(prev => ({...prev, [key]: !prev[key]}));
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={t('profileView.settings.notifications.title')} icon={<Bell />}>
                <div className="space-y-4">
                    {Object.keys(notifications).map(key => (
                        <div key={key} className="flex justify-between items-center">
                            <label className="text-sm">{t(`profileView.settings.notifications.${key}`)}</label>
                            <button 
                                onClick={() => handleNotifToggle(key as keyof typeof notifications)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center ${notifications[key as keyof typeof notifications] ? 'justify-end bg-indigo-500' : 'justify-start bg-gray-200'}`}
                            >
                                <span className="w-4 h-4 bg-white rounded-full block"></span>
                            </button>
                        </div>
                    ))}
                </div>
            </Card>
            <Card title={t('profileView.settings.preferences.title')} icon={<Settings />}>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm block mb-2">{t('profileView.settings.preferences.theme.title')}</label>
                        <div className="flex gap-2">
                            <button onClick={() => setTheme('light')} className={`btn text-sm ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}><Sun size={16} className="mr-2"/>{t('profileView.settings.preferences.theme.light')}</button>
                            <button onClick={() => setTheme('dark')} className={`btn text-sm ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}><Moon size={16} className="mr-2"/>{t('profileView.settings.preferences.theme.dark')}</button>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm block mb-2">{t('profileView.settings.preferences.language.title')}</label>
                        <select onChange={(e) => onLanguageChange(e.target.value)} className="input-base">
                            {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm block mb-2">{t('profileView.settings.preferences.privacy.title')}</label>
                        <button className="btn btn-secondary text-sm"><Lock size={16} className="mr-2"/>{t('profileView.settings.preferences.privacy.button')}</button>
                    </div>
                    <div>
                        <label className="text-sm block mb-2">Account Type</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleRoleChange('merchant')}
                                className="btn btn-secondary text-sm"
                            >
                                🏪 Business Account
                            </button>
                            <button 
                                onClick={() => handleRoleChange('agent')}
                                className="btn btn-secondary text-sm"
                            >
                                🎯 Service Provider
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const MerchantTabContent: React.FC<{ user: CurrentUser }> = ({ user }) => {
    return (
        <Card title="Merchant Dashboard" icon={<span>🏪</span>}>
            <MerchantDealManager currentUser={user} />
        </Card>
    );
};

const Card: React.FC<React.PropsWithChildren<{title: string, icon: React.ReactNode}>> = ({title, icon, children}) => (
    <div className="card-base p-6 relative">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3" style={{color: 'var(--color-text-primary)'}}>
            <span style={{color: 'var(--color-primary)'}}>{icon}</span>
            {title}
        </h3>
        {children}
    </div>
);


export default ProfileView;