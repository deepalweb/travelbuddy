import React, { useState } from 'react';
import { CurrentUser, UserInterest, ProfileType } from '../types';
import { Colors, COMMON_CURRENCIES, SUPPORTED_LANGUAGES, AVAILABLE_USER_INTERESTS, DEFAULT_LANGUAGE } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { moduleService } from '../services/moduleService';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface EnhancedOnboardingFlowProps {
  user: CurrentUser;
  onComplete: (userData: {
    language: string;
    homeCurrency: string;
    selectedInterests: UserInterest[];
    profileType: ProfileType;
    enabledModules: string[];
  }) => void;
  onClose: () => void;
}

const EnhancedOnboardingFlow: React.FC<EnhancedOnboardingFlowProps> = ({ 
  user, 
  onComplete, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [language, setLanguage] = useState(user.language || DEFAULT_LANGUAGE);
  const [homeCurrency, setHomeCurrency] = useState(user.homeCurrency || 'USD');
  const [selectedInterests, setSelectedInterests] = useState<UserInterest[]>(user.selectedInterests || []);
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType>('traveler');
  
  const { t, setLanguage: setAppLanguage } = useLanguage();

  const profileTypes = [
    {
      id: 'traveler' as ProfileType,
      icon: '🧳',
      title: 'Traveler',
      description: 'Discover places and plan amazing trips',
      features: ['Trip Planning', 'Place Discovery', 'Save Favorites', 'Community Posts'],
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'business' as ProfileType,
      icon: '🏪',
      title: 'Business Owner',
      description: 'Promote your business and create deals',
      features: ['Create Deals', 'Business Analytics', 'Customer Reviews', 'Promotions'],
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'service' as ProfileType,
      icon: '🎯',
      title: 'Service Provider',
      description: 'Offer travel services and manage bookings',
      features: ['Service Listings', 'Booking Management', 'Calendar', 'Earnings'],
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'creator' as ProfileType,
      icon: '👥',
      title: 'Community Creator',
      description: 'Share experiences and build community',
      features: ['Create Posts', 'Organize Events', 'Photo Sharing', 'Community Building'],
      color: 'from-pink-500 to-rose-600'
    }
  ];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setAppLanguage(langCode);
  };

  const handleInterestToggle = (interest: UserInterest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const enabledModules = moduleService.getModulesForProfile(selectedProfileType);
    onComplete({
      language,
      homeCurrency,
      selectedInterests,
      profileType: selectedProfileType,
      enabledModules
    });
  };

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Travel Buddy!',
      description: 'Let\'s personalize your experience in just a few steps',
      component: (
        <div className="text-center py-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✈️</span>
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: Colors.text }}>
            Welcome, {user.username}!
          </h2>
          <p className="text-lg mb-6" style={{ color: Colors.text_secondary }}>
            We're excited to help you discover amazing places and plan unforgettable trips.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-sm font-medium">Discover Places</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium">Plan Trips</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Join Community</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Find Deals</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'profile-type',
      title: 'Choose Your Profile',
      description: 'Select the profile that best describes how you\'ll use Travel Buddy',
      component: (
        <div className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileTypes.map((profile) => (
              <div
                key={profile.id}
                onClick={() => setSelectedProfileType(profile.id)}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                  selectedProfileType === profile.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${profile.color} flex items-center justify-center mx-auto mb-3`}>
                    <span className="text-2xl">{profile.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: Colors.text }}>
                    {profile.title}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: Colors.text_secondary }}>
                    {profile.description}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {profile.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      <span style={{ color: Colors.text }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'preferences',
      title: 'Set Your Preferences',
      description: 'Choose your language and currency for a personalized experience',
      component: (
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.text }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: Colors.text }}>
                Home Currency
              </label>
              <select
                value={homeCurrency}
                onChange={(e) => setHomeCurrency(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
              >
                {COMMON_CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'interests',
      title: 'What Interests You?',
      description: 'Select your travel interests to get personalized recommendations',
      component: (
        <div className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AVAILABLE_USER_INTERESTS.map(interest => (
              <button
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`p-4 rounded-lg text-sm font-medium text-center transition-all duration-200 transform hover:scale-105 ${
                  selectedInterests.includes(interest)
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`userInterests.${interest.toLowerCase().replace(/\s&/g, '')}`)}
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm" style={{ color: Colors.text_secondary }}>
              Selected {selectedInterests.length} interests
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Your profile has been configured. Let\'s start exploring!',
      component: (
        <div className="text-center py-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.text }}>
            Welcome to Travel Buddy!
          </h2>
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-4">Your Profile Summary:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Profile Type:</span>
                <div className="flex items-center mt-1">
                  <span className="mr-2">{profileTypes.find(p => p.id === selectedProfileType)?.icon}</span>
                  {profileTypes.find(p => p.id === selectedProfileType)?.title}
                </div>
              </div>
              <div>
                <span className="font-medium">Language:</span>
                <div className="mt-1">{SUPPORTED_LANGUAGES.find(l => l.code === language)?.name}</div>
              </div>
              <div>
                <span className="font-medium">Currency:</span>
                <div className="mt-1">{homeCurrency}</div>
              </div>
              <div>
                <span className="font-medium">Interests:</span>
                <div className="mt-1">{selectedInterests.length} selected</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: Colors.cardBackground }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: Colors.cardBorder }}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>
              {currentStepData.title}
            </h1>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm mb-4" style={{ color: Colors.text_secondary }}>
            {currentStepData.description}
          </p>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-xs mt-2" style={{ color: Colors.text_secondary }}>
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStepData.component}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center" style={{ borderColor: Colors.cardBorder }}>
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isFirstStep
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Back
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Skip Setup
            </button>
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOnboardingFlow;