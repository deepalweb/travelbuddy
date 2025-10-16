import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TravelPhrasebookModal } from './TravelPhrasebookModal';
import { TranslationWidget } from './TranslationWidget';
import { LanguageSwitcher } from './LanguageSwitcher';
import { translationService } from '../services/translationService';

interface LanguageAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { latitude: number; longitude: number };
}

export const LanguageAssistantModal: React.FC<LanguageAssistantModalProps> = ({
  isOpen,
  onClose,
  userLocation
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'phrasebook' | 'translator' | 'settings'>('phrasebook');
  const [showPhrasebook, setShowPhrasebook] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [suggestedLanguage, setSuggestedLanguage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userLocation) {
      checkLocationLanguage();
    }
  }, [isOpen, userLocation]);

  const checkLocationLanguage = async () => {
    if (!userLocation) return;

    try {
      const locationInfo = await translationService.getLocationLanguageInfo(
        userLocation.latitude,
        userLocation.longitude
      );

      if (locationInfo && locationInfo.primaryLanguage !== language) {
        setSuggestedLanguage(locationInfo.primaryLanguage);
      }
    } catch (error) {
      console.error('Failed to get location language:', error);
    }
  };

  const handleTabChange = (tab: 'phrasebook' | 'translator' | 'settings') => {
    setActiveTab(tab);
    if (tab === 'phrasebook') {
      setShowPhrasebook(true);
      setShowTranslator(false);
    } else if (tab === 'translator') {
      setShowTranslator(true);
      setShowPhrasebook(false);
    } else {
      setShowPhrasebook(false);
      setShowTranslator(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  🌍 Language Assistant
                </h2>
                <p className="text-gray-600 mt-1">
                  Communicate anywhere in the world
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Location Language Suggestion */}
            {suggestedLanguage && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🌍</span>
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">
                      {t('languageSwitcher.locationSuggestion')}
                    </div>
                    <div className="text-blue-700">
                      Switch to local language for better communication
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('phrasebook')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'phrasebook'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📖 Phrasebook
            </button>
            <button
              onClick={() => handleTabChange('translator')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'translator'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔄 Translator
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'phrasebook' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Essential Travel Phrases
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Quick access to important phrases in the local language
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPhrasebook(true)}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="text-2xl mb-2">🚨</div>
                    <div className="text-sm font-medium text-red-800">Emergency</div>
                    <div className="text-xs text-red-600">Help, Police, Hospital</div>
                  </button>

                  <button
                    onClick={() => setShowPhrasebook(true)}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="text-2xl mb-2">👋</div>
                    <div className="text-sm font-medium text-green-800">Greetings</div>
                    <div className="text-xs text-green-600">Hello, Thank you</div>
                  </button>

                  <button
                    onClick={() => setShowPhrasebook(true)}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-2xl mb-2">🗺️</div>
                    <div className="text-sm font-medium text-blue-800">Directions</div>
                    <div className="text-xs text-blue-600">Where is, Left, Right</div>
                  </button>

                  <button
                    onClick={() => setShowPhrasebook(true)}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <div className="text-2xl mb-2">🍽️</div>
                    <div className="text-sm font-medium text-yellow-800">Food</div>
                    <div className="text-xs text-yellow-600">Menu, Water, Bill</div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'translator' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Real-Time Translation
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Translate text and speech instantly
                  </p>
                </div>

                <button
                  onClick={() => setShowTranslator(true)}
                  className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">🔄</span>
                    <div>
                      <div className="font-semibold">Open Translator</div>
                      <div className="text-sm opacity-90">Text & Voice Translation</div>
                    </div>
                  </div>
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg mb-1">🎤</div>
                    <div className="text-xs text-gray-600">Voice Input</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-lg mb-1">🔊</div>
                    <div className="text-xs text-gray-600">Audio Output</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Language Settings
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage your language preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      App Language
                    </label>
                    <LanguageSwitcher 
                      showLocationSuggestion={true}
                      userLocation={userLocation}
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Quick Actions
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span>📱</span>
                          <div>
                            <div className="text-sm font-medium">Download Offline Phrases</div>
                            <div className="text-xs text-gray-600">For emergency use</div>
                          </div>
                        </div>
                      </button>
                      
                      <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span>🔄</span>
                          <div>
                            <div className="text-sm font-medium">Clear Translation Cache</div>
                            <div className="text-xs text-gray-600">Free up storage space</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <TravelPhrasebookModal
        isOpen={showPhrasebook}
        onClose={() => setShowPhrasebook(false)}
        targetLanguage={suggestedLanguage || 'fr'}
      />

      <TranslationWidget
        isOpen={showTranslator}
        onClose={() => setShowTranslator(false)}
      />
    </>
  );
};