import React, { useEffect, useState } from 'react';
import { CurrentUser, ProfileType } from '../types';
import { Colors } from '../constants';

interface OnboardingCompletionToastProps {
  user: CurrentUser;
  isVisible: boolean;
  onClose: () => void;
}

const OnboardingCompletionToast: React.FC<OnboardingCompletionToastProps> = ({ 
  user, 
  isVisible, 
  onClose 
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible && !show) return null;

  const getProfileTypeInfo = (profileType: ProfileType) => {
    switch (profileType) {
      case 'traveler':
        return { icon: '🧳', color: 'from-blue-500 to-purple-600', name: 'Traveler' };
      case 'business':
        return { icon: '🏪', color: 'from-green-500 to-teal-600', name: 'Business Owner' };
      case 'service':
        return { icon: '🎯', color: 'from-orange-500 to-red-600', name: 'Service Provider' };
      case 'creator':
        return { icon: '👥', color: 'from-pink-500 to-rose-600', name: 'Community Creator' };
      default:
        return { icon: '✨', color: 'from-blue-500 to-purple-600', name: 'Explorer' };
    }
  };

  const profileInfo = getProfileTypeInfo(user.profileType || 'traveler');

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${profileInfo.color} flex items-center justify-center mr-3 flex-shrink-0`}>
            <span className="text-xl">{profileInfo.icon}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Welcome to Travel Buddy!
              </h3>
              <button
                onClick={() => {
                  setShow(false);
                  setTimeout(onClose, 300);
                }}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
            
            <p className="text-xs text-gray-600 mt-1">
              Your profile as a <span className="font-medium">{profileInfo.name}</span> is now complete!
            </p>
            
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Profile Setup Complete
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            🎉 You're all set! Start exploring with your personalized dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompletionToast;