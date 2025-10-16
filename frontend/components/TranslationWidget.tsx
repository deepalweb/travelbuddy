import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translationService } from '../services/translationService';
import { SUPPORTED_LANGUAGES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';

interface TranslationWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TranslationWidget: React.FC<TranslationWidgetProps> = ({
  isOpen,
  onClose
}) => {
  const { t, language } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState(language === 'en' ? 'es' : 'en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    try {
      const translation = await translationService.translateText({
        text: inputText,
        targetLanguage,
        sourceLanguage
      });
      setTranslatedText(translation);
    } catch (error) {
      console.error('Translation failed:', error);
      setTranslatedText(t('translation.error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(t('translation.voiceNotSupported'));
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = sourceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handlePlayTranslation = () => {
    if ('speechSynthesis' in window && translatedText) {
      const utterance = new SpeechSynthesisUtterance(translatedText);
      utterance.lang = targetLanguage;
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const sourceLang = SUPPORTED_LANGUAGES.find(lang => lang.code === sourceLanguage);
  const targetLang = SUPPORTED_LANGUAGES.find(lang => lang.code === targetLanguage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('translation.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapLanguages}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title={t('translation.swapLanguages')}
            >
              ⇄
            </button>

            <div className="flex-1">
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Translation Interface */}
        <div className="p-6">
          {/* Input Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {sourceLang?.flag} {sourceLang?.name}
              </span>
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                className={`p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={t('translation.voiceInput')}
              >
                {isListening ? '🎤' : '🎙️'}
              </button>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('translation.inputPlaceholder')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          </div>

          {/* Translate Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isTranslating ? (
                <>
                  <LoadingSpinner size="sm" />
                  {t('translation.translating')}
                </>
              ) : (
                t('translation.translate')
              )}
            </button>
          </div>

          {/* Output Section */}
          {translatedText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {targetLang?.flag} {targetLang?.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePlayTranslation}
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title={t('translation.playAudio')}
                  >
                    🔊
                  </button>
                  <button
                    onClick={() => copyToClipboard(translatedText)}
                    className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title={t('translation.copy')}
                  >
                    📋
                  </button>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-gray-900">{translatedText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {t('translation.poweredBy')}
          </div>
        </div>
      </div>
    </div>
  );
};