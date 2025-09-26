import React from 'react';
import { CurrentUser } from '../types';
import { Colors } from '../constants';

interface OnboardingProgressProps {
  user: CurrentUser;
  onStartOnboarding: () => void;
  onCompleteProfileSetup: () => void;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ 
  user, 
  onStartOnboarding, 
  onCompleteProfileSetup 
}) => {
  const hasCompletedWizard = user.hasCompletedWizard ?? false;
  const hasCompletedProfileSetup = user.hasCompletedProfileSetup ?? false;
  
  const completionPercentage = (() => {
    let completed = 0;
    if (hasCompletedWizard) completed += 50;
    if (hasCompletedProfileSetup) completed += 50;
    return completed;
  })();

  if (completionPercentage === 100) {
    return null; // Don't show if fully completed
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Complete Your Profile Setup
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get the most out of Travel Buddy by completing your profile setup
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500 mb-3">
            {completionPercentage}% Complete
          </div>

          {/* Setup Steps */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className={`mr-2 ${hasCompletedWizard ? 'text-green-500' : 'text-gray-400'}`}>
                {hasCompletedWizard ? '✓' : '○'}
              </span>
              <span className={hasCompletedWizard ? 'text-gray-700 line-through' : 'text-gray-900'}>
                Basic preferences (language, currency, interests)
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className={`mr-2 ${hasCompletedProfileSetup ? 'text-green-500' : 'text-gray-400'}`}>
                {hasCompletedProfileSetup ? '✓' : '○'}
              </span>
              <span className={hasCompletedProfileSetup ? 'text-gray-700 line-through' : 'text-gray-900'}>
                Profile type and features
              </span>
            </div>
          </div>
        </div>

        <div className="ml-4">
          {!hasCompletedWizard || !hasCompletedProfileSetup ? (
            <button
              onClick={onStartOnboarding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Continue Setup
            </button>
          ) : (
            <button
              onClick={onCompleteProfileSetup}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Complete Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgress;