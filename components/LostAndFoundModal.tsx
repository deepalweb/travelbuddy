
import React, { useState, useEffect, useCallback } from 'react';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { generateLostAndFoundAdvice } from '../services/geminiService.ts';

interface LostAndFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity: string;
}

export const LostAndFoundModal: React.FC<LostAndFoundModalProps> = ({
  isOpen,
  onClose,
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
        </div>
      </div>
    </div>
  );
};
