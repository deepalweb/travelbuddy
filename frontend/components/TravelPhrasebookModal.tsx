import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translationService, TravelPhrase } from '../services/translationService';
import { TRAVEL_PHRASE_CATEGORIES, SUPPORTED_LANGUAGES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';

interface TravelPhrasebookModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage?: string;
}

export const TravelPhrasebookModal: React.FC<TravelPhrasebookModalProps> = ({
  isOpen,
  onClose,
  targetLanguage
}) => {
  const { t, language } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(targetLanguage || 'fr');
  const [selectedCategory, setSelectedCategory] = useState('emergency');
  const [phrases, setPhrases] = useState<TravelPhrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPhrases();
    }
  }, [isOpen, selectedLanguage, selectedCategory]);

  const loadPhrases = async () => {
    setLoading(true);
    try {
      const phrasesData = await translationService.getTravelPhrases(selectedLanguage, selectedCategory);
      setPhrases(phrasesData);
    } catch (error) {
      console.error('Failed to load phrases:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = (phrase: TravelPhrase) => {
    if (playingAudio === phrase.id) {
      setPlayingAudio(null);
      return;
    }

    setPlayingAudio(phrase.id);
    
    // Use Web Speech API for pronunciation
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.translation);
      utterance.lang = selectedLanguage;
      utterance.rate = 0.8;
      
      utterance.onend = () => {
        setPlayingAudio(null);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback: show pronunciation text
      setPlayingAudio(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('phrasebook.title')}
              </h2>
              <p className="text-gray-600 mt-1">
                {t('phrasebook.subtitle')} {targetLang?.flag} {targetLang?.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Language and Category Selectors */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phrasebook.selectLanguage')}
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'en').map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phrasebook.category')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TRAVEL_PHRASE_CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {t(`phrasebook.categories.${category}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : phrases.length > 0 ? (
            <div className="space-y-4">
              {phrases.map((phrase) => (
                <div
                  key={phrase.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-gray-900 font-medium mb-1">
                        {phrase.english}
                      </div>
                      <div className="text-lg text-blue-600 font-semibold mb-1">
                        {phrase.translation}
                      </div>
                      {phrase.pronunciation && (
                        <div className="text-sm text-gray-500 italic">
                          {phrase.pronunciation}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => playPronunciation(phrase)}
                        className={`p-2 rounded-lg transition-colors ${
                          playingAudio === phrase.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                        title={t('phrasebook.playPronunciation')}
                      >
                        {playingAudio === phrase.id ? '⏸️' : '🔊'}
                      </button>
                      
                      <button
                        onClick={() => copyToClipboard(phrase.translation)}
                        className="p-2 bg-white text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={t('phrasebook.copyToClipboard')}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('phrasebook.noPhrasesFound')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {t('phrasebook.offlineNote')}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};