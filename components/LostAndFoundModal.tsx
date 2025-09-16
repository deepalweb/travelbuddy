<<<<<<< HEAD
import React from 'react';
=======

import React, { useState, useEffect, useCallback } from 'react';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { generateLostAndFoundAdvice } from '../services/geminiService.ts';
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2

interface LostAndFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity: string;
}

export const LostAndFoundModal: React.FC<LostAndFoundModalProps> = ({
  isOpen,
  onClose,
<<<<<<< HEAD
  userCity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Lost & Found</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600">
            Lost something in {userCity}? Here are some helpful resources:
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-800">Local Police</h3>
              <p className="text-sm text-blue-600">Contact local authorities for lost items</p>
            </div>

            <div className="p-3 bg-green-50 rounded">
              <h3 className="font-semibold text-green-800">Transportation Hubs</h3>
              <p className="text-sm text-green-600">Check airports, train stations, bus terminals</p>
            </div>

            <div className="p-3 bg-orange-50 rounded">
              <h3 className="font-semibold text-orange-800">Hotels & Restaurants</h3>
              <p className="text-sm text-orange-600">Contact places you recently visited</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
=======
  userCity,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [item, setItem] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
        onClose();
        setItem('');
        setAdvice('');
        setError(null);
    }, 300);
  }, [onClose]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return;
    setIsLoading(true);
    setError(null);
    setAdvice('');
    try {
      const result = await generateLostAndFoundAdvice(item, userCity);
      setAdvice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('lostAndFound.adviceError'));
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
  const buttonStyle = { ...inputStyle, width: 'auto', backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryDark})`, color: 'white', fontWeight: 600, cursor: 'pointer' };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(30, 41, 58, 0.4)', backdropFilter: 'blur(5px)' }}
      onClick={handleCloseWithAnimation} role="dialog" aria-modal="true" aria-labelledby="lost-and-found-title">
      <div className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-lg flex flex-col relative transform transition-all duration-300 ease-out ${isVisible && isOpen ? 'scale-100' : 'scale-95'}`}
        style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="lost-and-found-title" className="text-lg font-semibold" style={{ color: Colors.text }}>{t('lostAndFound.title')}</h2>
          <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2" aria-label={t('close')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm" style={{ color: Colors.text_secondary }}>{t('lostAndFound.description')}</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <input type="text" value={item} onChange={e => setItem(e.target.value)} placeholder={t('lostAndFound.itemPlaceholder')} style={{...inputStyle, flexGrow: 1}} required />
            <button type="submit" style={buttonStyle} disabled={isLoading || !item.trim()} className="disabled:opacity-60 w-full sm:w-auto">
              {isLoading ? t('lostAndFound.gettingAdvice') : t('lostAndFound.getAdviceButton')}
            </button>
          </form>

          {error && <p className="text-center text-sm" style={{color: Colors.accentError}}>{error}</p>}

          {advice && (
             <div className="mt-4 p-4 rounded-lg" style={{backgroundColor: Colors.inputBackground}}>
                 <h3 className="font-semibold mb-2" style={{color: Colors.text_primary}}>{t('lostAndFound.adviceFromAI')}</h3>
                 <div className="prose prose-sm max-w-none" style={{color: Colors.text_secondary}} dangerouslySetInnerHTML={{ __html: advice.replace(/\n/g, '<br />') }} />
             </div>
          )}
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2
        </div>
      </div>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> 25dfd0e7057dc9918b9fb42f119370715379fda2
