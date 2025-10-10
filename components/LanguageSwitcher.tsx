import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../constants';
import { translationService } from '../services/translationService';

interface LanguageSwitcherProps {
  showLocationSuggestion?: boolean;
  userLocation?: { latitude: number; longitude: number };
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showLocationSuggestion = true,
  userLocation
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  useEffect(() => {
    if (showLocationSuggestion && userLocation) {
      checkLocationLanguage();
    }
  }, [userLocation, showLocationSuggestion]);

  const checkLocationLanguage = async () => {
    if (!userLocation) return;

    try {
      const locationInfo = await translationService.getLocationLanguageInfo(
        userLocation.latitude,
        userLocation.longitude
      );

      if (locationInfo && locationInfo.primaryLanguage !== language) {
        const supportedLang = SUPPORTED_LANGUAGES.find(
          lang => lang.code === locationInfo.primaryLanguage
        );
        
        if (supportedLang) {
          setSuggestedLanguage(locationInfo.primaryLanguage);
          setShowSuggestion(true);
        }
      }
    } catch (error) {
      console.error('Failed to get location language:', error);
    }
  };

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setIsOpen(false);
    setShowSuggestion(false);
  };

  const acceptSuggestion = () => {
    if (suggestedLanguage) {
      handleLanguageChange(suggestedLanguage);
    }
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
  const suggestedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === suggestedLanguage);

  return (
    <div className="relative">
      {/* Language Suggestion Banner */}
      {showSuggestion && suggestedLang && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600">🌍</span>
              <div>
                <div className="text-sm font-medium text-blue-900">
                  {t('languageSwitcher.locationSuggestion')}
                </div>
                <div className="text-xs text-blue-700">
                  {t('languageSwitcher.switchTo')} {suggestedLang.flag} {suggestedLang.name}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={acceptSuggestion}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                {t('languageSwitcher.switch')}
              </button>
              <button
                onClick={dismissSuggestion}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
              >
                {t('languageSwitcher.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg">{currentLang?.flag}</span>
          <span className="text-sm font-medium text-gray-700">
            {currentLang?.name}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-40 max-h-60 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  lang.code === language ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {lang.code === language && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};