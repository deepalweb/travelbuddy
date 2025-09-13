
import React, { useEffect, useCallback } from 'react';
import { SurpriseSuggestion } from '../types.ts';
import { Colors } from '../constants.ts';

interface SurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: SurpriseSuggestion | null;
  isLoading: boolean;
  error: string | null;
}

const SurpriseModal: React.FC<SurpriseModalProps> = ({
  isOpen,
  onClose,
  suggestion,
  isLoading,
  error,
}) => {
  const [isVisible, setIsVisible] = React.useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseWithAnimation();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, handleCloseWithAnimation]);

  if (!isOpen && !isVisible) {
    return null;
  }
  
  const commonButtonStyles = "px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-70";

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)' }}                  
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="surprise-modal-title"
    >
      <div
        className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-lg max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
          backgroundColor: Colors.cardBackground,
          boxShadow: Colors.boxShadow
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b" style={{borderColor: Colors.cardBorder}}>
          <h2 id="surprise-modal-title" className="text-lg sm:text-xl font-semibold" style={{ color: Colors.text }}>
            ✨ Your Surprise! ✨
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 ring-gray-400"
            aria-label="Close surprise modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mb-3"
                style={{ borderColor: Colors.highlight, borderTopColor: Colors.primaryGradientEnd }}
              ></div>
              <p className="text-md" style={{ color: Colors.text_secondary }}>Conjuring a fantastic surprise...</p>
            </div>
          )}

          {error && !isLoading && (
            <div
              className="p-3 my-1.5 rounded-lg text-sm text-center"
              style={{ backgroundColor: `${Colors.accentError}1A`, border: `1px solid ${Colors.accentError}50`, color: Colors.accentError }}
              role="alert"
            >
              <p className="font-semibold text-md mb-1">Surprise Spoiled!</p>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && suggestion && (
            <div className="prose prose-sm max-w-none text-center sm:text-left" style={{color: Colors.text_secondary}}>
              <h3 className="text-xl font-bold mb-2.5" style={{color: Colors.highlight}}>{suggestion.title}</h3>
              {suggestion.photoUrl && (
                <img 
                    src={suggestion.photoUrl} 
                    alt={suggestion.title} 
                    loading="lazy"
                    className="w-full h-48 object-cover rounded-lg mb-3 shadow-md" 
                    style={{boxShadow: Colors.boxShadow}}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                />
              )}
              {suggestion.category && (
                <p className="text-xs uppercase font-semibold tracking-wider mb-1.5" style={{color: Colors.primary}}>
                  Category: {suggestion.category}
                </p>
              )}
              <p className="text-sm mb-3" style={{color: Colors.text, lineHeight: 1.6}}>{suggestion.description}</p>
              {suggestion.funFact && (
                <div className="mt-3 p-2.5 rounded-lg" style={{backgroundColor: Colors.inputBackground, borderLeft: `3px solid ${Colors.secondary}`, boxShadow: Colors.boxShadowSoft}}>
                    <p className="text-xs italic"><strong style={{color: Colors.secondary}}>Fun Fact:</strong> {suggestion.funFact}</p>
                </div>
              )}
            </div>
          )}
           {!isLoading && !error && !suggestion && (
             <div className="text-center py-8">
                <p className="text-md" style={{color: Colors.text_secondary}}>
                    Click the "Surprise Me!" button to get a suggestion.
                </p>
             </div>
           )}
        </div>

        <div className="p-3 border-t flex justify-end gap-2.5 items-center" style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}>
          <button
            onClick={handleCloseWithAnimation}
            className={`${commonButtonStyles} text-white w-full sm:w-auto`}
            style={{
              backgroundImage: `linear-gradient(145deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
              boxShadow: Colors.boxShadowSoft,
            }}
            aria-label="Close surprise"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurpriseModal;
