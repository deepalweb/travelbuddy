
import React, { useState, useEffect, useCallback } from 'react';
import { Place } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { findSpecificPlaces } from '../services/geminiService.ts';
import { MapView } from './MapView.tsx';

interface FeatureDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  query: string;
  userLocation: { latitude: number; longitude: number };
  onSelectPlaceDetail: (place: Place) => void;
}

export const FeatureDiscoveryModal: React.FC<FeatureDiscoveryModalProps> = ({
  isOpen,
  onClose,
  title,
  query,
  userLocation,
  onSelectPlaceDetail,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
        onClose();
        setResults([]);
        setError(null);
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const fetchResults = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        try {
          const foundPlaces = await findSpecificPlaces(query, userLocation.latitude, userLocation.longitude);
          setResults(foundPlaces);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    }
  }, [isOpen, query, userLocation]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  if (!isOpen && !isVisible) return null;

  const handlePlaceClick = (place: Place) => {
    handleCloseWithAnimation();
    setTimeout(() => onSelectPlaceDetail(place), 310);
  };
  
  const handleGetDirections = (place: Place) => {
    if (!place.address) return;
    const encodedAddress = encodeURIComponent(place.address);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(30, 41, 58, 0.4)', backdropFilter: 'blur(5px)' }}
      onClick={handleCloseWithAnimation} role="dialog" aria-modal="true" aria-labelledby="feature-discovery-title">
      
      <div className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-xl md:max-w-4xl max-h-[90vh] flex flex-col relative transform transition-all duration-300 ease-out ${isVisible && isOpen ? 'scale-100' : 'scale-95'}`}
        style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }} onClick={(e) => e.stopPropagation()}>
        
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="feature-discovery-title" className="text-lg font-semibold" style={{ color: Colors.text }}>{title}</h2>
          <button onClick={handleCloseWithAnimation} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2" aria-label={t('close')}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-grow overflow-hidden grid grid-cols-1 md:grid-cols-3">
            <div className="md:col-span-1 overflow-y-auto p-3 space-y-2 border-r" style={{borderColor: Colors.cardBorder}}>
               {isLoading && <p className="p-4 text-center" style={{color: Colors.text_secondary}}>{t('featureDiscovery.finding', {query})}</p>}
               {error && <p className="p-4 text-center text-sm" style={{color: Colors.accentError}}>{t('featureDiscovery.error', {query})}</p>}
               {!isLoading && !error && results.length === 0 && <p className="p-4 text-center" style={{color: Colors.text_secondary}}>{t('featureDiscovery.noResults', {query})}</p>}
               {!isLoading && !error && results.map(place => (
                   <div key={place.id} className="p-3 rounded-lg" style={{backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}`}}>
                       <h3 className="font-semibold text-sm" style={{color: Colors.text_primary}}>{place.name}</h3>
                       <p className="text-xs mt-0.5" style={{color: Colors.text_secondary}}>{place.address}</p>
                       <div className="flex gap-2 mt-2">
                           <button onClick={() => handlePlaceClick(place)} className="px-2 py-1 text-xs font-semibold rounded" style={{backgroundColor: Colors.primary, color: 'white'}}>{t('featureDiscovery.viewDetails')}</button>
                           <button onClick={() => handleGetDirections(place)} className="px-2 py-1 text-xs font-semibold rounded" style={{backgroundColor: Colors.secondary, color: 'white'}}>{t('featureDiscovery.getDirections')}</button>
                       </div>
                   </div>
               ))}
            </div>
            <div className="md:col-span-2 h-full w-full min-h-[300px] md:min-h-0">
                <MapView places={results} onSelectPlaceDetail={handlePlaceClick} userLocation={userLocation} />
            </div>
        </div>
      </div>
    </div>
  );
};
