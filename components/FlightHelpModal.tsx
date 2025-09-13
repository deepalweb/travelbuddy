
import React, { useState, useEffect, useCallback } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { fetchFlightInfo } from '../services/geminiService.ts';

interface FlightHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightHelpModal: React.FC<FlightHelpModalProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<GenerateContentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
        onClose();
        setFlightNumber('');
        setQuestion('');
        setResponse(null);
        setError(null);
    }, 300);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightNumber.trim() || !question.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await fetchFlightInfo(flightNumber, question);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('flightHelp.flightInfoError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  if (!isOpen && !isVisible) return null;
  
  const modalStyle = { backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow, border: `1px solid ${Colors.cardBorder}` };
  const inputStyle = { color: Colors.text, backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`, borderRadius: '0.625rem', padding: '0.75rem 1rem', width: '100%', fontSize: '1rem' };
  const textareaStyle = {...inputStyle, minHeight: '80px'};
  const buttonStyle = { ...inputStyle, width: '100%', backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryDark})`, color: 'white', fontWeight: 600, cursor: 'pointer' };
  const sources = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(30, 41, 58, 0.4)', backdropFilter: 'blur(5px)' }}
      onClick={handleCloseWithAnimation} role="dialog" aria-modal="true" aria-labelledby="flight-help-title">
      <div className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-lg flex flex-col relative transform transition-all duration-300 ease-out ${isVisible && isOpen ? 'scale-100' : 'scale-95'}`}
        style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="flight-help-title" className="text-lg font-semibold" style={{ color: Colors.text }}>{t('flightHelp.title')}</h2>
          <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2" aria-label={t('close')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm" style={{ color: Colors.text_secondary }}>{t('flightHelp.description')}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="flightNumber" className="text-sm font-medium" style={{color: Colors.text_secondary}}>{t('flightHelp.flightNumberLabel')}</label>
              <input type="text" id="flightNumber" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder={t('flightHelp.flightNumberPlaceholder')} style={inputStyle} required />
            </div>
            <div>
              <label htmlFor="flightQuestion" className="text-sm font-medium" style={{color: Colors.text_secondary}}>{t('flightHelp.questionLabel')}</label>
              <textarea id="flightQuestion" value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('flightHelp.questionPlaceholder')} style={textareaStyle} required />
            </div>
            <button type="submit" style={buttonStyle} disabled={isLoading || !flightNumber.trim() || !question.trim()} className="disabled:opacity-60">
              {isLoading ? t('flightHelp.gettingHelp') : t('flightHelp.getHelpButton')}
            </button>
          </form>

          {error && <p className="text-center text-sm" style={{color: Colors.accentError}}>{error}</p>}
          
          {response && (
            <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: Colors.inputBackground}}>
              <h3 className="font-semibold mb-2" style={{color: Colors.text_primary}}>{t('flightHelp.informationFromAI')}</h3>
              <p className="prose prose-sm max-w-none" style={{color: Colors.text_secondary}}>{response.text}</p>
              
              {sources && sources.length > 0 && (
                <div className="mt-3 pt-3 border-t" style={{borderColor: Colors.cardBorder}}>
                  <h4 className="font-semibold text-xs mb-1" style={{color: Colors.text_primary}}>{t('flightHelp.informationSources')}</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {sources.map((source, index) => (
                      <li key={index} className="text-xs truncate">
                        <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{color: Colors.primary}}>
                          {source.web?.title || source.web?.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
