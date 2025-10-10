import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageAssistantModal } from './LanguageAssistantModal';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageQuickAccessProps {
  userLocation?: { latitude: number; longitude: number };
}

export const LanguageQuickAccess: React.FC<LanguageQuickAccessProps> = ({
  userLocation
}) => {
  const { language, t } = useLanguage();
  const [showAssistant, setShowAssistant] = useState(false);
  const [isNewLocation, setIsNewLocation] = useState(false);

  useEffect(() => {
    // Simple check if user might be in a different country
    // In a real app, you'd compare with previous location
    if (userLocation) {
      setIsNewLocation(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setIsNewLocation(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [userLocation]);

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setShowAssistant(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isNewLocation
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 animate-pulse'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
          title="Language Assistant"
        >
          <span className="text-lg">{currentLang?.flag || '🌍'}</span>
          <span className="hidden sm:inline text-sm font-medium">
            {currentLang?.name || 'Language'}
          </span>
          {isNewLocation && (
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
          )}
        </button>

        {/* New Location Tooltip */}
        {isNewLocation && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-blue-600 text-white text-xs rounded-lg p-2 shadow-lg z-10">
            <div className="text-center">
              <div className="font-medium">New location detected!</div>
              <div className="opacity-90">Tap for local language help</div>
            </div>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
          </div>
        )}
      </div>

      <LanguageAssistantModal
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        userLocation={userLocation}
      />
    </>
  );
};