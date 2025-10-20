
import React, { useMemo, useState } from 'react';
import { ItinerarySuggestion, Place } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { optimizeRoute, calculateRouteStats } from '../services/routeOptimizationService.ts';
import { PlaceDetailView } from './PlaceDetailView.tsx';

interface OneDayItineraryViewProps {
  selectedPlaceIdsForItinerary: string[];
  onGenerateItinerary: () => void;
  onClearSelection: () => void;
  savedItineraries: ItinerarySuggestion[];
  onViewSavedItinerary: (itinerary: ItinerarySuggestion) => void;
  onDeleteSavedItinerary: (itineraryId: string) => void;
  isPlanSavable: boolean;
  selectedPlaces: Place[];
  userLocation?: { latitude: number; longitude: number } | null;
  onOptimizeRoute: (optimizedPlaces: Place[]) => void;
  // New inline-result props
  generatedItinerary: ItinerarySuggestion | null;
  isGenerating: boolean;
  error: string | null;
  onSaveItinerary: (it: ItinerarySuggestion) => void;
  savedOneDayItineraryIds: string[];
}

const OneDayItineraryView: React.FC<OneDayItineraryViewProps> = ({
  selectedPlaceIdsForItinerary,
  onGenerateItinerary,
  onClearSelection,
  savedItineraries,
  onViewSavedItinerary,
  onDeleteSavedItinerary,
  isPlanSavable,
  selectedPlaces,
  userLocation,
  onOptimizeRoute,
  generatedItinerary,
  isGenerating,
  error,
  onSaveItinerary,
  savedOneDayItineraryIds
}) => {
  const { t } = useLanguage();
  const [selectedPlaceForDetail, setSelectedPlaceForDetail] = useState<Place | null>(null);
  const selectedCount = selectedPlaceIdsForItinerary.length;
  const selectedPlacesById = useMemo(() => {
    const map: Record<string, Place> = {};
    selectedPlaces.forEach(p => { if (p.id) map[p.id] = p; });
    return map;
  }, [selectedPlaces]);
  
  const handleOptimizeRoute = () => {
    if (selectedPlaces.length < 2) return;
    
    const startLocation = userLocation ? {
      lat: userLocation.latitude,
      lng: userLocation.longitude
    } : undefined;
    
    const optimizedPlaces = optimizeRoute(selectedPlaces, startLocation);
    onOptimizeRoute(optimizedPlaces);
  };
  
  const routeStats = selectedPlaces.length >= 2 ? calculateRouteStats(selectedPlaces) : null;
  
  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground, 
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '0.75rem', 
    padding: '1.5rem', 
    boxShadow: Colors.boxShadow, 
    marginBottom: '1.5rem',
  };

  const primaryButtonStyle: React.CSSProperties = {
    padding: '0.875rem 1.75rem', 
    borderRadius: '0.75rem', 
    fontWeight: '600', 
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: Colors.boxShadowButton,
    backgroundImage: `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
    color: 'white',
    fontSize: '1rem',
  };

  const secondaryButtonStyle: React.CSSProperties = { ...primaryButtonStyle, backgroundImage: 'none', backgroundColor: 'transparent', color: Colors.text_secondary, border: `1px solid ${Colors.cardBorder}`, boxShadow: 'none' };

  return (
    <div className="animate-fadeInUp max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: Colors.text }}>
        {t('oneDayItineraryTab.title')}
      </h1>
      
      <div style={cardStyle} className="text-center">
        {selectedCount > 0 ? (
          <p className="text-lg mb-4" style={{color: Colors.text_secondary}}>
            {t('oneDayItineraryTab.selectionInfo', {count: selectedCount.toString()})}
          </p>
        ) : (
          <p className="text-lg mb-4" style={{color: Colors.text_secondary}}>
            {t('oneDayItineraryTab.instruction')}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={onGenerateItinerary}
                disabled={selectedCount < 2}
                style={{...primaryButtonStyle, opacity: selectedCount < 2 ? 0.6 : 1}}
                className="disabled:cursor-not-allowed"
            >
                {t('oneDayItineraryTab.generateButton')}
            </button>
            {selectedCount >= 2 && (
                <button 
                    onClick={handleOptimizeRoute}
                    style={{...secondaryButtonStyle, color: Colors.primary, borderColor: Colors.primary}}
                >
                    🗺️ Optimize Route
                </button>
            )}
            {selectedCount > 0 && (
                <button onClick={onClearSelection} style={secondaryButtonStyle}>
                    {t('oneDayItineraryTab.clearSelectionButton', {count: selectedCount.toString()})}
                </button>
            )}
        </div>
        {routeStats && (
            <div className="mt-4 p-3 rounded-lg text-center text-sm" style={{backgroundColor: Colors.inputBackground, color: Colors.text_secondary}}>
                📍 Total Distance: {routeStats.totalDistance} km | ⏱️ Estimated Time: {routeStats.estimatedTime} min
            </div>
        )}
         {selectedCount > 0 && selectedCount < 2 && (
            <p className="text-sm mt-3" style={{color: Colors.text_secondary}}>
                {t('oneDayItineraryTab.addMorePlacesNote')}
            </p>
        )}
      </div>

      {/* Inline Result Section (replaces ItineraryModal) */}
      {(isGenerating || error || generatedItinerary) && (
        <div style={{...cardStyle, marginTop: '1rem'}}>
          <h2 className="text-2xl font-bold mb-2" style={{color: Colors.text_primary}}>
            {isGenerating ? t('itineraryModal.craftingAdventure') : (generatedItinerary?.title || t('itineraryModal.titleDefault'))}
          </h2>
          {isGenerating && (
            <p className="text-md" style={{ color: Colors.text_secondary }}>{t('itineraryModal.mappingJourney')}</p>
          )}
          {error && !isGenerating && (
            <div className="p-3 my-2 rounded-lg text-sm text-center" style={{ backgroundColor: `${Colors.accentError}15`, border: `1px solid ${Colors.accentError}55`, color: Colors.accentError }}>
              <p className="font-semibold mb-1">{t('error')}</p>
              <p>{error}</p>
            </div>
          )}
          {!isGenerating && !error && generatedItinerary && (
            <div>
              {generatedItinerary.introduction && (
                <p className="mb-4" style={{color: Colors.text_secondary}}>{generatedItinerary.introduction}</p>
              )}
              {generatedItinerary.dailyPlan?.map((day, idx) => (
                <div key={idx} className="p-3 rounded-lg mb-3" style={{backgroundColor: Colors.inputBackground}}>
                  {day.theme && <p className="text-xs mb-1 font-medium" style={{color: Colors.primary}}>{day.theme}</p>}
                  <ul className="space-y-2">
                    {day.activities.map((act, aIdx) => {
                      const place = act.placeId ? selectedPlacesById[act.placeId] : undefined;
                      const displayName = act.placeName || place?.name;
                      const openInMaps = () => {
                        const q = (place?.address || displayName);
                        if (!q) return;
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      };
                      const openPlaceDetail = () => {
                        if (place) {
                          setSelectedPlaceForDetail(place);
                        }
                      };
                      
                      return (
                        <li key={aIdx} className="text-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">🕐</span>
                                <span className="text-xs font-medium" style={{color: Colors.primary}}>
                                  {act.estimatedTime || 'Flexible timing'}
                                </span>
                              </div>
                              <p className="font-semibold mb-1" style={{color: Colors.text_primary}}>
                                {displayName ? `📍 ${displayName}` : '• Activity'}
                              </p>
                              <p className="text-xs mb-2" style={{color: Colors.text_secondary}}>
                                {act.activityDescription}
                              </p>
                              {place?.address && (
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-xs">📍</span>
                                  <span className="text-xs" style={{color: Colors.text_secondary}}>{place.address}</span>
                                </div>
                              )}
                              {place?.rating && (
                                <div className="flex items-center gap-1">
                                  <span style={{color: Colors.gold}}>{'★'.repeat(Math.round(place.rating))}</span>
                                  <span className="text-xs" style={{color: Colors.text_secondary}}>({place.rating.toFixed(1)})</span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {place && (
                                <button 
                                  onClick={openPlaceDetail} 
                                  className="text-xs px-2 py-1 rounded flex items-center gap-1" 
                                  style={{border: `1px solid ${Colors.primary}`, color: Colors.primary, backgroundColor: `${Colors.primary}10`}}
                                  title="View detailed information"
                                >
                                  <span>Details</span>
                                  <span>→</span>
                                </button>
                              )}
                              {displayName && (
                                <button onClick={openInMaps} className="text-xs px-2 py-1 rounded" style={{border: `1px solid ${Colors.cardBorder}`, color: Colors.primary}}>
                                  🗺️ Maps
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {generatedItinerary.travelTips && generatedItinerary.travelTips.length > 0 && (
                <div className="mt-3 p-3 rounded" style={{backgroundColor: Colors.inputBackground}}>
                  <h4 className="font-semibold mb-1" style={{color: Colors.primary}}>{t('itineraryModal.travelTips')}</h4>
                  <ul className="list-disc pl-5 text-sm" style={{color: Colors.text_secondary}}>
                    {generatedItinerary.travelTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              )}
              {generatedItinerary.conclusion && (
                <p className="mt-3" style={{color: Colors.text_secondary}}>{generatedItinerary.conclusion}</p>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => {
                    if (!generatedItinerary) return;
                    onSaveItinerary(generatedItinerary);
                  }}
                  disabled={!isPlanSavable || (generatedItinerary?.id ? savedOneDayItineraryIds.includes(generatedItinerary.id) : false)}
                  className="text-sm px-3 py-2 rounded font-semibold disabled:opacity-60"
                  style={{backgroundImage: `linear-gradient(135deg, ${Colors.accentSuccess}, ${Colors.secondary})`, color: 'white'}}
                >
                  {t('oneDayItineraryTab.saveOneDayItineraryButton')}
                </button>
                <button
                  onClick={() => {
                    const waypoints = selectedPlaces.map(sp => encodeURIComponent(sp.name || sp.address)).filter(Boolean).join('/');
                    if (waypoints) {
                      const url = `https://www.google.com/maps/dir/${waypoints}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="text-sm px-3 py-2 rounded font-semibold"
                  style={{backgroundColor: Colors.inputBackground, color: Colors.primary, border: `1px solid ${Colors.cardBorder}`}}
                >
                  {t('localAgencyPlanner.viewRouteOnMap')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{...cardStyle, marginTop: '2rem'}}>
        <h2 className="text-2xl font-bold mb-4" style={{color: Colors.text_primary, paddingBottom: '0.5rem', borderBottom: `1px solid ${Colors.cardBorder}`}}>
            {t('oneDayItineraryTab.mySavedOneDayItineraries')}
        </h2>
        {savedItineraries.length > 0 ? (
            <ul className="space-y-3">
                {savedItineraries.map(itinerary => (
                    <li key={itinerary.id} className="p-3 rounded-lg flex justify-between items-center" style={{backgroundColor: Colors.inputBackground}}>
                        <p className="font-semibold" style={{color: Colors.text}}>{itinerary.title}</p>
                        <div className="flex gap-2">
                            <button onClick={() => onViewSavedItinerary(itinerary)} className="text-xs px-3 py-1.5 rounded" style={{color:'white', backgroundColor: Colors.primary}}>{t('oneDayItineraryTab.viewOneDayItineraryButton')}</button>
                            <button onClick={() => itinerary.id && onDeleteSavedItinerary(itinerary.id)} className="text-xs px-3 py-1.5 rounded" style={{color: Colors.accentError, backgroundColor: `${Colors.accentError}20`}}>{t('oneDayItineraryTab.deleteOneDayItineraryButton')}</button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center py-4" style={{color: Colors.text_secondary}}>{t('oneDayItineraryTab.noSavedOneDayItineraries')}</p>
        )}
      </div>

      {/* Place Detail Modal */}
      {selectedPlaceForDetail && (
        <PlaceDetailView 
          place={selectedPlaceForDetail}
          onClose={() => setSelectedPlaceForDetail(null)}
        />
      )}
    </div>
  );
};

export default OneDayItineraryView;
