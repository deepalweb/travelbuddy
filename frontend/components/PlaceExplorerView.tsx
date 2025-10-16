
import React, { useState, useMemo } from 'react';
import { Place, ExchangeRates } from '../types.ts';
import { Colors } from '../constants.ts';
import PlaceCard from './PlaceCard.tsx';
import DealCard from './DealCard.tsx';
import ErrorDisplay from './ErrorDisplay.tsx';
import GoogleMapView from './GoogleMapView.tsx';
import TypeFilter from './TypeFilter.tsx';
import PlaceCardSkeleton from './PlaceCardSkeleton.tsx';
import SectionLoadingAnimation from './SectionLoadingAnimation.tsx';
import { MapView } from './MapView.tsx'; 
import LockIcon from './LockIcon.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import SmartSearchBar from './SmartSearchBar.tsx';
import { smartSearchService } from '../services/smartSearchService';


interface PlaceExplorerViewProps {
  uniqueTypes: string[];
  selectedType: string;
  onSelectType: (type: string) => void;
  filteredPlaces: Place[];
  isLoading: boolean;
  isTransitioning?: boolean;
  error: string | null;
  onRetryLoadPlaces: () => void;
  onSelectPlaceDetail: (place: Place) => void;
  selectedPlaceIdsForItinerary: string[];
  onToggleSelectForItinerary: (placeId: string) => void;
  favoritePlaceIds: string[];
  onToggleFavoritePlace: (placeId: string) => void;
  showFavoritesOnly: boolean;
  onToggleShowFavorites: () => void;
  showOpenOnly: boolean;
  onToggleShowOpenOnly: () => void;
  onSurpriseMeClick: () => void;
  isLoadingSurprise: boolean;
  userLocation: { latitude: number; longitude: number } | null;
  placeExplorerView: 'grid' | 'map';
  onTogglePlaceExplorerView: () => void;
  placesWithDeals: Place[];
  onSelectPlaceByNameOrId: (identifier: string, isId?: boolean) => void;
  currentUserHomeCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  hasAccessToBasic: boolean;
  hasAccessToPremium: boolean;
  onNavigateToPlace?: (place: Place) => void;
  hasMorePlaces?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  // Smart search props
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAISearch: (query: string) => void;
  weather?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

const PlaceExplorerView: React.FC<PlaceExplorerViewProps> = ({
  uniqueTypes,
  selectedType,
  onSelectType,
  filteredPlaces,
  isLoading,
  isTransitioning,
  error,
  onRetryLoadPlaces,
  onSelectPlaceDetail,
  selectedPlaceIdsForItinerary,
  onToggleSelectForItinerary,
  favoritePlaceIds,
  onToggleFavoritePlace,
  showFavoritesOnly,
  onToggleShowFavorites,
  showOpenOnly,
  onToggleShowOpenOnly,
  onSurpriseMeClick,
  isLoadingSurprise,
  userLocation,
  placeExplorerView,
  onTogglePlaceExplorerView,
  placesWithDeals,
  onSelectPlaceByNameOrId,
  currentUserHomeCurrency,
  exchangeRates,
  hasAccessToBasic,
  hasAccessToPremium,
  onNavigateToPlace,
  hasMorePlaces,
  isLoadingMore,
  onLoadMore,
  searchInput,
  onSearchInputChange,
  onAISearch,
  weather = 'sunny',
  timeOfDay = 'afternoon',
}) => {
  const { t } = useLanguage();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSortOption, setActiveSortOption] = useState<string>('closest');
  




  // Apply smart filters and sorting
  const smartFilteredPlaces = useMemo(() => {
    let places = [...filteredPlaces];
    
    // Apply active filters
    const smartFilters = smartSearchService.getSmartFilters();
    const contextualFilters = smartSearchService.getContextualSuggestions(weather, timeOfDay);
    const allFilters = [...smartFilters, ...contextualFilters];
    
    activeFilters.forEach(filterId => {
      const filter = allFilters.find(f => f.id === filterId);
      if (filter) {
        places = places.filter(filter.filter);
      }
    });
    
    // Apply sorting
    const sortOptions = smartSearchService.getSortOptions();
    const sortOption = sortOptions.find(s => s.id === activeSortOption);
    if (sortOption) {
      places.sort(sortOption.sort);
    }
    
    return places;
  }, [filteredPlaces, activeFilters, activeSortOption, weather, timeOfDay]);
  
  const allPlaces = smartFilteredPlaces;

  const renderSkeletons = () => (
    <SectionLoadingAnimation 
      type="cards" 
      count={8} 
      message="Discovering amazing places for you..."
    />
  );

  const commonViewToggleButtonStyles = "px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 active:scale-95 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-opacity-50 flex items-center gap-2";

  return (
    <>
      {/* Smart Search Bar */}
      <div className="mb-6">
        <SmartSearchBar
          searchInput={searchInput}
          onSearchInputChange={onSearchInputChange}
          onAISearch={onAISearch}
          weather={weather}
          timeOfDay={timeOfDay}
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          activeSortOption={activeSortOption}
          onSortChange={setActiveSortOption}
        />
      </div>

      <div className="mb-6 text-center">
        <button
          onClick={onSurpriseMeClick}
          disabled={isLoadingSurprise || !hasAccessToPremium}
          className="px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-opacity-70 disabled:opacity-70 flex items-center justify-center mx-auto relative"
          style={{ 
            color: 'white', 
            backgroundImage: `linear-gradient(145deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`, 
            boxShadow: Colors.boxShadowButton,
            borderColor: Colors.primary,
          }}
        >
          {!hasAccessToPremium && <LockIcon className="w-5 h-5 mr-2" />}
          {isLoadingSurprise ? t('placeExplorer.surpriseMeLoading') : t('placeExplorer.surpriseMe')}
        </button>
      </div>

      {placesWithDeals.length > 0 && !isLoading && !error && placeExplorerView === 'grid' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{color: Colors.text}}>{t('placeExplorer.hotNearbyDeals')}</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide" 
               style={{WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
            {placesWithDeals.map(place => place.deal && (
              <div key={`deal-${place.id}`} className="min-w-[280px] sm:min-w-[300px] lg:min-w-[320px] flex-shrink-0">
                <DealCard 
                  deal={place.deal} 
                  onSelectPlace={() => onSelectPlaceByNameOrId(place.deal!.placeName, false)}
                  isTripDeal={selectedPlaceIdsForItinerary.includes(place.id)}
                  homeCurrency={currentUserHomeCurrency}
                  exchangeRates={exchangeRates}
                  placePhotoUrl={place.photoUrl}
                  hasAccessToPremiumDeals={hasAccessToPremium}
                />
              </div>
            ))}
          </div>
        </div>
      )}

  {error && <ErrorDisplay error={error} onRetry={onRetryLoadPlaces} />}
      {!error && isLoading && (placeExplorerView === 'grid' ? renderSkeletons() : <SectionLoadingAnimation type="skeleton" message={t('placeExplorer.loadingMapData')} />)}
      
      {!error && !isLoading && (
        placeExplorerView === 'map' ? (
          <div className="h-[60vh] md:h-[70vh] w-full mb-6">
            {/* Try Google Maps first, fallback to Leaflet if API key is missing */}
            {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
              <GoogleMapView 
                places={allPlaces} 
                onSelectPlaceDetail={onSelectPlaceDetail} 
                userLocation={userLocation ? {latitude: userLocation.latitude, longitude: userLocation.longitude} : null} 
              />
            ) : (
              <MapView places={allPlaces} onSelectPlaceDetail={onSelectPlaceDetail} userLocation={userLocation} />
            )}
          </div>
        ) : (
          filteredPlaces.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-2xl" style={{backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow}}>
              <svg className="mx-auto h-16 w-16 mb-4" style={{color: Colors.text_secondary}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xl font-semibold mb-2" style={{color: Colors.text}}>{t('placeExplorer.aiFetchingPlaces')}</p>
              <p className="text-md" style={{color: Colors.text_secondary}}>{t('placeExplorer.tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8">
              {filteredPlaces.map((place, index) => (
                <PlaceCard 
                  key={place.id} 
                  place={place} 
                  onSelectPlaceDetail={onSelectPlaceDetail} 
                  style={{ 
                    animationDelay: `${index * 80}ms`,
                    opacity: isTransitioning ? 0.7 : 1,
                    transition: 'opacity 300ms ease'
                  }} 
                  isSelectedForItinerary={selectedPlaceIdsForItinerary.includes(place.id)} 
                  onToggleSelectForItinerary={onToggleSelectForItinerary} 
                  isFavorite={favoritePlaceIds.includes(place.id)} 
                  onToggleFavorite={onToggleFavoritePlace} 
                  hasAccessToBasic={hasAccessToBasic}
                />
              ))}
              
              {/* Load More Button */}
              {hasMorePlaces && onLoadMore && (
                <div className="col-span-full flex justify-center mt-8">
                  <button
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: Colors.primary,
                      color: 'white',
                      boxShadow: Colors.boxShadowButton
                    }}
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {t('placeExplorer.loadingMore')}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {t('placeExplorer.loadMore')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )
        )
      )}


    </>
  );
};

export default PlaceExplorerView;
