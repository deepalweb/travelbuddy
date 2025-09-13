// Optimized imports - Lazy load heavy components
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';

// Essential types and constants
import { 
  Place, Deal, TripPlanSuggestion, CurrentUser, ActiveTab, PortalView, 
  PlaceExplorerView as PlaceExplorerViewType, ItinerarySuggestion, UserReview, 
  Post, PlannerView, ExchangeRates
} from './types';
import { 
  Colors as lightColors, LOCAL_STORAGE_FAVORITE_PLACES_KEY, 
  LOCAL_STORAGE_CURRENT_USER_KEY, DEFAULT_LANGUAGE 
} from './constants';

// Essential services
import { fetchNearbyPlaces, generateItinerary as generateItineraryService } from './services/geminiService';
import { fetchExchangeRates } from './services/exchangeRateService';

// Essential components (loaded immediately)
import Header from './components/Header';
import ErrorDisplay from './components/ErrorDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { Footer } from './components/Footer';
import BottomNavigationBar from './components/BottomNavigationBar';
import ToastContainer from './components/ToastContainer';

// Lazy loaded components
import LazyWrapper from './components/LazyWrapper';
import LazyComponents, { preloadCriticalComponents, preloadOnUserIntent } from './components/LazyComponents';
import PerformanceOptimizer from './components/PerformanceOptimizer';

// Hooks and contexts
import { useToast } from './contexts/ToastContext';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { useDebounce } from './hooks/useDebounce';
import { useMemoryOptimization } from './hooks/useMemoryOptimization';
import { useResourcePreloader } from './utils/resourcePreloader';

// Performance utilities
import { getCurrentGeoLocation } from './utils/geolocation';

const App: React.FC = () => {
  console.log('[App] App component mounted');
  
  // Performance optimization setup
  const { 
    setCache, getCache, clearCache, 
    startRenderMeasurement, endRenderMeasurement, 
    memoizeExpensiveComputation,
    memoryStatus
  } = useMemoryOptimization({
    maxCacheSize: 100,
    enableGarbageCollection: true,
    enablePerformanceMonitoring: process.env.NODE_ENV === 'development'
  });

  const { preloadOnHover, preloadCritical, trackUserInteraction } = useResourcePreloader();

  // Essential state
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<Place | null>(null);
  
  // Search state
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearchInput = useDebounce(searchInput, 300);
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // Contexts
  const { addToast } = useToast(); 
  const { language, t } = useLanguage(); 
  const { colors, theme } = useTheme();

  // Performance tracking refs
  const mainContentRef = useRef<HTMLElement>(null);
  const footerSentinelRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);

  // Memoized expensive calculations
  const memoizedPlaceFilter = useMemo(
    () => memoizeExpensiveComputation((places: Place[], searchTerm: string, selectedType: string) => {
      if (!searchTerm && selectedType === 'All') return places;
      
      return places.filter(place => {
        const matchesSearch = !searchTerm || 
          place.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          place.formatted_address?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = selectedType === 'All' || 
          place.types?.some(type => type.includes(selectedType.toLowerCase()));
        
        return matchesSearch && matchesType;
      });
    }, (places, searchTerm, selectedType) => `${places.length}-${searchTerm}-${selectedType}`),
    [memoizeExpensiveComputation]
  );

  // Optimized place loading with caching
  const loadPlaces = useCallback(async (latitude: number, longitude: number, force: boolean = false) => {
    const cacheKey = `places_${latitude}_${longitude}`;
    
    // Check cache first
    if (!force) {
      const cachedPlaces = getCache(cacheKey);
      if (cachedPlaces) {
        setAllPlaces(cachedPlaces);
        setIsLoading(false);
        return;
      }
    }

    startRenderMeasurement();
    setIsLoading(true);
    setError(null);

    try {
      const places = await fetchNearbyPlaces(latitude, longitude, ['restaurant', 'tourist_attraction', 'lodging']);
      
      // Cache the results
      setCache(cacheKey, places, 5 * 60 * 1000); // 5 minutes cache
      
      setAllPlaces(places);
      addToast({ message: `Found ${places.length} places nearby`, type: 'success' });
      
    } catch (err) {
      console.error('Error loading places:', err);
      setError(err instanceof Error ? err.message : 'Failed to load places');
      addToast({ message: 'Failed to load places', type: 'error' });
    } finally {
      setIsLoading(false);
      endRenderMeasurement('PlaceLoading');
    }
  }, [getCache, setCache, startRenderMeasurement, endRenderMeasurement, addToast]);

  // User location handling
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const loadUserLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const location = await getCurrentGeoLocation();
      setUserLocation(location);
      setLocationStatus('success');
      
      // Load places for user location
      await loadPlaces(location.lat, location.lng);
      
    } catch (error) {
      console.error('Location error:', error);
      setLocationStatus('error');
      
      // Fallback to default location (New York)
      const defaultLocation = { lat: 40.7128, lng: -74.0060 };
      setUserLocation(defaultLocation);
      await loadPlaces(defaultLocation.lat, defaultLocation.lng);
    }
  }, [loadPlaces]);

  // Tab navigation with preloading
  const handleTabChange = useCallback((tab: ActiveTab) => {
    trackUserInteraction(`tab-${tab}-click`);
    
    // Preload resources for the selected tab
    switch (tab) {
      case 'places':
        preloadOnHover('places');
        break;
      case 'community':
        preloadOnHover('community');
        break;
      case 'planner':
        preloadOnHover('ai-planner');
        break;
    }
    
    setActiveTab(tab);
  }, [trackUserInteraction, preloadOnHover]);

  // Place detail modal with lazy loading
  const handlePlaceClick = useCallback((place: Place) => {
    trackUserInteraction('place-detail-open');
    preloadOnUserIntent('PlaceDetailModal');
    setSelectedPlaceDetail(place);
  }, [trackUserInteraction]);

  const handleClosePlaceDetail = useCallback(() => {
    setSelectedPlaceDetail(null);
  }, []);

  // Initialize app
  useEffect(() => {
    console.log('[App] Initializing application...');
    
    // Track render performance
    renderCount.current++;
    startRenderMeasurement();

    // Preload critical resources
    preloadCritical();
    
    // Initialize location
    loadUserLocation();

    // Preload likely components based on patterns
    setTimeout(() => {
      preloadCriticalComponents();
    }, 2000);

    return () => {
      endRenderMeasurement(`App-Render-${renderCount.current}`);
    };
  }, [startRenderMeasurement, endRenderMeasurement, preloadCritical, loadUserLocation]);

  // Debounced search
  useEffect(() => {
    if (debouncedSearchInput && userLocation) {
      trackUserInteraction('search-performed');
      // Implement search logic here
    }
  }, [debouncedSearchInput, userLocation, trackUserInteraction]);

  // Filtered places with memoization
  const filteredPlaces = useMemo(() => {
    return memoizedPlaceFilter(allPlaces, debouncedSearchInput, 'All');
  }, [allPlaces, debouncedSearchInput, memoizedPlaceFilter]);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <LazyWrapper fallback={<LoadingSpinner />}>
            <div className="text-center py-20">
              <h1 className="text-4xl font-bold mb-4" style={{ color: colors.text }}>
                Welcome to Travel Buddy
              </h1>
              <p className="text-lg mb-8" style={{ color: colors.text_secondary }}>
                Discover amazing places around you with AI-powered recommendations
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => handleTabChange('places')}
                onMouseEnter={() => preloadOnHover('places')}
              >
                Start Exploring
              </button>
            </div>
          </LazyWrapper>
        );

      case 'places':
        return (
          <LazyWrapper fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
            ))}
          </div>}>
            <LazyComponents.PlaceExplorerView
              filteredPlaces={filteredPlaces}
              onPlaceClick={handlePlaceClick}
              isLoading={isLoading}
              error={error}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              selectedType="All"
              onTypeChange={() => {}}
              userLocation={userLocation}
            />
          </LazyWrapper>
        );

      case 'community':
        return (
          <LazyWrapper fallback={<LoadingSpinner />}>
            <LazyComponents.CommunityView />
          </LazyWrapper>
        );

      case 'planner':
        return (
          <LazyWrapper fallback={<LoadingSpinner />}>
            <LazyComponents.AITripPlannerView />
          </LazyWrapper>
        );

      case 'profile':
        return (
          <LazyWrapper fallback={<LoadingSpinner />}>
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                Profile (Coming Soon)
              </h2>
            </div>
          </LazyWrapper>
        );

      default:
        return <ErrorDisplay message="Page not found" />;
    }
  };

  // Early loading states
  if (locationStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner />
        <span className="ml-2">Detecting your location...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Header */}
      <Header
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onPlaceClick={handlePlaceClick}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMenuClick={() => trackUserInteraction('menu-open')}
      />

      {/* Main Content */}
      <main ref={mainContentRef} className="pt-24 px-4 sm:px-6 lg:px-8 pb-20 md:pb-8 flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          {renderTabContent()}
        </Suspense>
        <div ref={footerSentinelRef} style={{ height: '1px' }}></div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation */}
      <BottomNavigationBar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      {/* Lazy Loaded Modals */}
      {selectedPlaceDetail && (
        <LazyWrapper fallback={<LoadingSpinner />}>
          <LazyComponents.PlaceDetailModal
            place={selectedPlaceDetail}
            onClose={handleClosePlaceDetail}
          />
        </LazyWrapper>
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* Performance Optimizer (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceOptimizer />
      )}

      {/* Memory Status (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 text-xs p-2 bg-black bg-opacity-75 text-white rounded">
          Memory: {memoryStatus.memoryUsage?.used ? 
            `${Math.round(memoryStatus.memoryUsage.used / 1024 / 1024)}MB` : 'N/A'}
          <br />
          Cache: {memoryStatus.cacheSize} items
          <br />
          Renders: {renderCount.current}
        </div>
      )}
    </div>
  );
};

export default React.memo(App);
