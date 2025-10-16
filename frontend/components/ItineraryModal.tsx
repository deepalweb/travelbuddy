



import React, { useEffect, useCallback, useState } from 'react';
import { Place, ItinerarySuggestion } from '../types.ts'; // Import ItinerarySuggestion from types.ts
import { Colors } from '../constants.ts';
import { useToast } from '../contexts/ToastContext.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import LockIcon from './LockIcon.tsx';
// Removed: import { FaTimes, FaMapSigns } from 'react-icons/fa';

// ItinerarySuggestion interface is now in types.ts

interface ItineraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: ItinerarySuggestion | null;
  isLoading: boolean;
  error: string | null;
  selectedPlaces: Place[]; 
  onSaveItinerary: (itinerary: ItinerarySuggestion) => void;
  savedOneDayItineraryIds: string[];
  isPlanSavable?: boolean;
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({ 
  isOpen,
  onClose,
  itinerary,
  isLoading,
  error,
  selectedPlaces,
  onSaveItinerary,
  savedOneDayItineraryIds,
  isPlanSavable,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [completedActivityIndices, setCompletedActivityIndices] = useState<number[]>([]);
  const { addToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCompletedActivityIndices([]); 
    }
  }, [isOpen]);
  
  useEffect(() => {
    setCompletedActivityIndices([]);
  }, [itinerary]);


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

  const getPlaceNameById = (id?: string): string => {
    if (!id) return "Activity";
    const place = selectedPlaces.find(p => p.id === id);
    return place?.name || id; 
  }

  const handleToggleActivityCompletion = (activityIndex: number) => {
    setCompletedActivityIndices(prev =>
      prev.includes(activityIndex)
        ? prev.filter(idx => idx !== activityIndex)
        : [...prev, activityIndex]
    );
  };

  const handleGetItineraryDirections = () => {
    if (!itinerary || !itinerary.dailyPlan || itinerary.dailyPlan.length === 0 || itinerary.dailyPlan[0].activities.length === 0) {
      addToast({ message: t('itineraryModal.noPlacesForDirections'), type: "warning" });
      return;
    }

    // Build a list of map points using address when available, otherwise use coordinates
    const mapPoints = itinerary.dailyPlan[0].activities
      .map(activity => {
        if (!activity.placeId) return null;
        const placeDetail = selectedPlaces.find(p => p.id === activity.placeId);
        if (!placeDetail) return null;

        const address = (placeDetail.formatted_address || placeDetail.address || '').trim();
        const lat = placeDetail.geometry?.location?.lat;
        const lng = placeDetail.geometry?.location?.lng;

        if (address) {
          return encodeURIComponent(address);
        } else if (typeof lat === 'number' && typeof lng === 'number') {
          return `${lat},${lng}`;
        }
        return null;
      })
      .filter((v): v is string => !!v);

    if (mapPoints.length === 0) {
      addToast({ message: t('itineraryModal.noValidAddresses'), type: "warning"});
      return;
    }

    // Single destination case
    if (mapPoints.length === 1) {
      const destination = mapPoints[0];
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      addToast({ message: t('itineraryModal.openingMapsForLocation'), type: "info" });
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const origin = mapPoints[0];
    const destination = mapPoints[mapPoints.length - 1];
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (mapPoints.length > 2) {
      const waypoints = mapPoints.slice(1, -1).join('|');
      mapsUrl += `&waypoints=${waypoints}`;
    }

    addToast({ message: t('itineraryModal.openingMapsForItinerary'), type: "info" });
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const canGenerateDirections = itinerary && itinerary.dailyPlan && itinerary.dailyPlan.length > 0 && itinerary.dailyPlan[0].activities.length > 0;
  const isItinerarySaved = itinerary?.id ? savedOneDayItineraryIds.includes(itinerary.id) : false;
  
  const commonButtonStyles = "px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-98 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-opacity-70 shadow-sm";

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-40 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(30, 41, 58, 0.4)', backdropFilter: 'blur(5px)' }}                  
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-modal-title"
    >
      <div
        className={`rounded-xl shadow-xl overflow-hidden w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col relative
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{
          backgroundColor: Colors.cardBackground, 
          boxShadow: Colors.boxShadow 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b" 
             style={{
                backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
                borderColor: Colors.cardBorder
             }}>
          <h2 id="itinerary-modal-title" className="text-lg sm:text-xl font-semibold text-white">
            {isLoading ? t('itineraryModal.craftingAdventure') : itinerary?.title || t('itineraryModal.titleDefault')}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 ring-white"
            aria-label="Close itinerary modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div
                className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 mb-3"
                style={{ borderColor: Colors.primaryGradientEnd, borderTopColor: Colors.primary }}
              ></div>
              <p className="text-md" style={{ color: Colors.text_secondary }}>{t('itineraryModal.mappingJourney')}</p>
            </div>
          )}

          {error && !isLoading && (
            <div
              className="p-3 my-1.5 rounded-lg text-sm text-center"
              style={{ backgroundColor: `${Colors.accentError}1A`, border: `1px solid ${Colors.accentError}99`, color: Colors.accentError }}
              role="alert"
            >
              <p className="font-semibold text-md mb-1">{t('itineraryModal.ohNoSomethingAwry')}</p>
              <p>{error}</p>
              {error.includes(t('placeExplorer.selectAtLeastTwoPlaces').toLowerCase()) && selectedPlaces.length > 0 && (
                <p className="mt-1.5 text-xs" style={{color: Colors.text_secondary}}>{t('itineraryModal.selectedPlacesInfo', { count: selectedPlaces.length.toString(), placeNames: selectedPlaces.map(p => p.name).join(', ') })}</p>
              )}
            </div>
          )}

          {!isLoading && !error && itinerary && (
            <div className="prose prose-sm max-w-none" style={{color: Colors.text_secondary}}>
              {itinerary.introduction && <p className="lead text-sm mb-3" style={{color: Colors.text, lineHeight: 1.6}}>{itinerary.introduction}</p>}
              
              {itinerary.dailyPlan?.map((dayPlan, dayIndex) => (
                <div key={dayIndex} className="mb-5">
                  {dayPlan.day && <h3 className="text-lg font-semibold mb-2 pb-1 border-b" style={{color: Colors.primary, borderColor: `${Colors.primary}30`}}>{t('itineraryModal.dayTitle', {day: dayPlan.day.toString()})}</h3>}
                  {dayPlan.theme && <p className="italic text-sm mb-3" style={{color: Colors.primaryGradientEnd}}>{dayPlan.theme}</p>}
                  
                  <ul className="list-none p-0 space-y-3">
                    {dayPlan.activities.map((activity, activityIndex) => {
                      const isCompleted = completedActivityIndices.includes(activityIndex);
                      return (
                        <li 
                          key={activityIndex} 
                          className="p-3 rounded-lg flex items-start gap-2.5" 
                          style={{
                            border: `1px solid ${Colors.cardBorder}`, 
                            backgroundColor: Colors.inputBackground, 
                            boxShadow: Colors.boxShadowSoft,
                            opacity: isCompleted ? 0.75 : 1,
                          }}
                        >
                          <button
                            onClick={() => handleToggleActivityCompletion(activityIndex)}
                            className="flex-shrink-0 w-5 h-5 rounded-md mt-0.5 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                            style={{
                              border: `1.5px solid ${isCompleted ? Colors.accentSuccess : Colors.text_secondary}80`,
                              backgroundColor: isCompleted ? Colors.accentSuccess : 'transparent',
                            }}
                            aria-pressed={isCompleted}
                            aria-label={`Mark activity ${activity.activityDescription || getPlaceNameById(activity.placeId)} as ${isCompleted ? 'incomplete' : 'complete'}`}
                          >
                            {isCompleted && <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <div className="flex-grow">
                            <p className="font-semibold text-sm leading-tight" style={{color: isCompleted ? Colors.text_secondary : Colors.text, textDecoration: isCompleted ? 'line-through' : 'none'}}>
                              {activity.placeName || getPlaceNameById(activity.placeId)}
                            </p>
                            <p className="text-xs mt-0.5" style={{color: Colors.text_secondary, textDecoration: isCompleted ? 'line-through' : 'none'}}>{activity.activityDescription}</p>
                            {activity.estimatedTime && <p className="text-xs mt-0.5 italic" style={{color: Colors.text_secondary, textDecoration: isCompleted ? 'line-through' : 'none'}}>Time: {activity.estimatedTime}</p>}
                            {activity.notes && <p className="text-xs mt-0.5" style={{color: Colors.text_secondary, textDecoration: isCompleted ? 'line-through' : 'none'}}>Note: {activity.notes}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              
              {itinerary.travelTips && itinerary.travelTips.length > 0 && (
                 <div className="mt-4 pt-3 border-t" style={{borderColor: `${Colors.cardBorder}80`}}>
                    <h4 className="text-md font-semibold mb-1" style={{color: Colors.primary}}>{t('itineraryModal.travelTips')}</h4>
                    <ul className="list-disc list-inside text-xs space-y-0.5">
                        {itinerary.travelTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                    </ul>
                </div>
              )}
              {itinerary.conclusion && <p className="mt-4 pt-3 border-t text-sm" style={{borderColor: `${Colors.cardBorder}80`, color: Colors.text}}>{itinerary.conclusion}</p>}
            </div>
          )}
        </div>

        <div className="p-3 border-t flex flex-col sm:flex-row justify-end gap-2.5 items-center" style={{ backgroundColor: `${Colors.inputBackground}80`, borderColor: Colors.cardBorder }}>
          {itinerary && !isLoading && !error && (
             <button
                onClick={() => onSaveItinerary(itinerary)}
                disabled={isItinerarySaved || !isPlanSavable}
                className={`${commonButtonStyles} text-white w-full sm:w-auto hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center`}
                style={{ 
                    backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
                    boxShadow: Colors.boxShadowButton,
                }}
                aria-label={isItinerarySaved ? t('oneDayItineraryTab.itinerarySavedButton') : t('oneDayItineraryTab.saveItineraryButton')}
            >
               {!isPlanSavable && <LockIcon className="w-4 h-4 mr-2" color="white"/>}
               {isItinerarySaved ? t('oneDayItineraryTab.itinerarySavedButton') : t('oneDayItineraryTab.saveItineraryButton')}
            </button>
          )}
          {canGenerateDirections && (
             <button
                onClick={handleGetItineraryDirections}
                className={`${commonButtonStyles} text-white w-full sm:w-auto hover:-translate-y-0.5 flex items-center justify-center`}
                style={{ 
                    backgroundImage: `linear-gradient(135deg, ${Colors.accentSuccess}, #20c997)`,
                    boxShadow: Colors.boxShadowSoft,
                }}
                aria-label={t('modals.getItineraryDirections')}
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-.553-.894l-5.447-2.724M9 7l6-3m-6 3l6 3" /></svg>
               {t('modals.getItineraryDirections')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
