import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiService } from '../../services/apiService';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: string;
  languages?: string[];
  interests?: string[];
  travelStyle?: string;
  status?: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  subscriptionStatus: 'none' | 'trial' | 'active' | 'canceled';
  trialEndDate?: string;
  subscriptionEndDate?: string;
  mongoId?: string;
}

interface UserStats {
  totalPosts: number;
  followers: number;
  following: number;
  placesVisited: number;
  totalDistance: number;
  currentStreak: number;
  favoriteCategory: string;
}

interface TravelStyle {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  description: string;
}

const TRAVEL_STYLES: TravelStyle[] = [
  { id: 'explorer', name: 'explorer', displayName: 'Explorer', emoji: '🗺️', description: 'Love discovering new places and hidden gems' },
  { id: 'foodie', name: 'foodie', displayName: 'Foodie', emoji: '🍽️', description: 'Passionate about local cuisine and dining experiences' },
  { id: 'culture', name: 'culture', displayName: 'Culture Enthusiast', emoji: '🎨', description: 'Fascinated by history, art, and cultural experiences' },
  { id: 'nature', name: 'nature', displayName: 'Nature Lover', emoji: '🌿', description: 'Prefer outdoor activities and natural landscapes' },
  { id: 'nightOwl', name: 'nightOwl', displayName: 'Night Owl', emoji: '🌙', description: 'Enjoy nightlife, bars, and evening entertainment' },
  { id: 'relaxer', name: 'relaxer', displayName: 'Relaxer', emoji: '🧘', description: 'Seek peaceful, stress-free travel experiences' },
];

const EnhancedProfileView: React.FC = () => {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    bio: '',
    location: '',
    website: '',
    birthday: '',
    status: ''
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserStats();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      // Try to load from backend first
      const backendProfile = await apiService.getUserProfile();
      if (backendProfile) {
        setUserProfile(backendProfile);
        setProfileForm({
          username: backendProfile.username || backendProfile.displayName || '',
          bio: backendProfile.bio || '',
          location: backendProfile.location || '',
          website: backendProfile.website || '',
          birthday: backendProfile.birthday || '',
          status: backendProfile.status || ''
        });
      } else {
        // Fallback to Firebase user data
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          tier: 'free',
          subscriptionStatus: 'none'
        };
        setUserProfile(profile);
        setProfileForm({
          username: profile.displayName,
          bio: '',
          location: '',
          website: '',
          birthday: '',
          status: ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      addToast({
        message: 'Failed to load profile data',
        type: 'error'
      });
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      if (stats) {
        setUserStats(stats);
      } else {
        // Default stats
        setUserStats({
          totalPosts: 0,
          followers: 0,
          following: 0,
          placesVisited: 0,
          totalDistance: 0,
          currentStreak: 0,
          favoriteCategory: 'Exploring'
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
      setUserStats({
        totalPosts: 0,
        followers: 0,
        following: 0,
        placesVisited: 0,
        totalDistance: 0,
        currentStreak: 0,
        favoriteCategory: 'Exploring'
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      const updatedProfile = {
        ...userProfile,
        ...profileForm
      };
      
      await apiService.updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setIsEditing(false);
      
      addToast({
        message: 'Profile updated successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast({
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTravelStyleChange = async (styleId: string) => {
    if (!userProfile) return;
    
    try {
      const updatedProfile = { ...userProfile, travelStyle: styleId };
      await apiService.updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      
      addToast({
        message: 'Travel style updated!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating travel style:', error);
      addToast({
        message: 'Failed to update travel style',
        type: 'error'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({
        message: 'Signed out successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error signing out:', error);
      addToast({
        message: 'Failed to sign out',
        type: 'error'
      });
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="flex items-center gap-6 mb-6">
          {/* Profile Picture */}
          <div className="relative">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Username"
                />
                <input
                  type="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userProfile?.username || userProfile?.displayName || 'User'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{userProfile?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                    {userProfile?.tier?.toUpperCase() || 'FREE'} PLAN
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Member since 2024
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Profile Fields */}
        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={profileForm.location}
                onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={profileForm.website}
                onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://your-website.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <input
                type="text"
                value={profileForm.status}
                onChange={(e) => setProfileForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="What's on your mind?"
                maxLength={100}
              />
            </div>
          </div>
        )}

        {/* Travel Style Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Travel Style</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TRAVEL_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleTravelStyleChange(style.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  userProfile?.travelStyle === style.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{style.emoji}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {style.displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {style.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Travel Statistics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStats?.placesVisited || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Places Visited</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {userStats?.totalPosts || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Posts</div>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {userStats?.followers || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {userStats?.currentStreak || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Travel Insights</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Distance:</span>
                <span className="font-medium">{userStats?.totalDistance || 0} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Favorite Category:</span>
                <span className="font-medium">{userStats?.favoriteCategory || 'Exploring'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Following:</span>
                <span className="font-medium">{userStats?.following || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Achievements</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <span className="text-sm">Explorer Badge</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="text-sm">First Check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <span className="text-sm">Photo Enthusiast</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* App Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Settings</h2>
        
        <div className="space-y-4">
          {/* Theme Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Theme</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Language Setting */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Language</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select your preferred language</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
            </select>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications about new features</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account</h2>
        
        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 mb-6 shadow-sm">
          <div className="flex gap-2">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'stats', label: 'Statistics', icon: '📊' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'stats' && renderStatsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default EnhancedProfileView;