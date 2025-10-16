import React, { useState } from 'react';

interface ProfileType {
  id: string;
  icon: string;
  title: string;
  description: string;
  features: string[];
  modules: string[];
}

interface ProfileTypeOnboardingProps {
  onComplete: (profileType: string, modules: string[]) => void;
  onSkip: () => void;
}

const ProfileTypeOnboarding: React.FC<ProfileTypeOnboardingProps> = ({ onComplete, onSkip }) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

  const profileTypes: ProfileType[] = [
    {
      id: 'traveler',
      icon: '🧳',
      title: 'Traveler',
      description: 'Discover places and plan amazing trips',
      features: ['Trip Planning', 'Place Discovery', 'Save Favorites', 'Community Posts'],
      modules: ['places', 'trips', 'community', 'favorites']
    },
    {
      id: 'business',
      icon: '🏪',
      title: 'Business Owner',
      description: 'Promote your business and create deals',
      features: ['Create Deals', 'Business Analytics', 'Customer Reviews', 'Promotions'],
      modules: ['deals', 'analytics', 'reviews', 'business']
    },
    {
      id: 'service',
      icon: '🎯',
      title: 'Service Provider',
      description: 'Offer travel services and manage bookings',
      features: ['Service Listings', 'Booking Management', 'Calendar', 'Earnings'],
      modules: ['services', 'bookings', 'calendar', 'earnings']
    },
    {
      id: 'creator',
      icon: '👥',
      title: 'Community Creator',
      description: 'Share experiences and build community',
      features: ['Create Posts', 'Organize Events', 'Photo Sharing', 'Community Building'],
      modules: ['posts', 'events', 'photos', 'community']
    }
  ];

  const selectedProfileData = profileTypes.find(p => p.id === selectedProfile);

  const handleContinue = () => {
    if (selectedProfile) {
      setStep('confirmation');
    }
  };

  const handleConfirm = () => {
    if (selectedProfileData) {
      onComplete(selectedProfile, selectedProfileData.modules);
    }
  };

  if (step === 'confirmation' && selectedProfileData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{selectedProfileData.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome, {selectedProfileData.title}!
            </h2>
            <p className="text-gray-600 mb-4">{selectedProfileData.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Your features include:</h3>
            <div className="space-y-2">
              {selectedProfileData.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('selection')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Profile</h2>
          <p className="text-gray-600">Select the profile that best describes how you'll use Travel Buddy</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {profileTypes.map((profile) => (
            <div
              key={profile.id}
              onClick={() => setSelectedProfile(profile.id)}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProfile === profile.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{profile.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">{profile.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{profile.description}</p>
              </div>
              
              <div className="space-y-1">
                {profile.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <span className="text-green-500 mr-2 text-xs">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
                {profile.features.length > 3 && (
                  <div className="text-xs text-gray-500">+{profile.features.length - 3} more features</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip for now
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedProfile}
            className={`px-6 py-2 rounded-md ${
              selectedProfile
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileTypeOnboarding;