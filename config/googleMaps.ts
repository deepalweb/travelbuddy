// Google Maps API configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'directions', 'geocoding', 'geometry'] as const,
  version: 'weekly' as const,
  mapId: 'TRAVEL_BUDDY_MAP', // For Advanced Markers and styling
  language: 'en',
  region: 'US'
};

// Map styling options
export const MAP_STYLES: any[] = [
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'poi.attraction',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'transit.station',
    stylers: [{ visibility: 'simplified' }]
  }
];

// Default map options
export const DEFAULT_MAP_OPTIONS = {
  zoom: 13,
  center: { lat: 37.7749, lng: -122.4194 }, // San Francisco default
  mapTypeControl: true,
  streetViewControl: true,
  fullscreenControl: true,
  zoomControl: true,
  mapTypeId: 'roadmap',
  styles: MAP_STYLES,
  gestureHandling: 'auto',
  clickableIcons: true,
  disableDoubleClickZoom: false,
  keyboardShortcuts: true,
  scrollwheel: true,
};

// Place search configuration
export const PLACES_CONFIG = {
  radius: 5000, // 5km default search radius
  maxResults: 50,
  types: {
    restaurant: 'restaurant',
    tourist_attraction: 'tourist_attraction',
    lodging: 'lodging',
    shopping_mall: 'shopping_mall',
    hospital: 'hospital',
    police: 'police',
    embassy: 'embassy'
  }
};

// Marker clustering configuration
export const CLUSTER_CONFIG = {
  gridSize: 60,
  maxZoom: 15,
  minimumClusterSize: 3,
  averageCenter: true,
  zoomOnClick: true,
  imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
};

// Error messages
export const MAPS_ERROR_MESSAGES = {
  API_KEY_MISSING: 'Google Maps API key is not configured',
  LOAD_FAILED: 'Failed to load Google Maps',
  PLACES_SEARCH_FAILED: 'Places search failed',
  DIRECTIONS_FAILED: 'Directions request failed',
  GEOCODING_FAILED: 'Geocoding request failed'
};

// Performance settings
export const PERFORMANCE_CONFIG = {
  debounceMs: 500, // Debounce time for map events
  maxMarkersBeforeClustering: 20,
  preloadRadius: 10000, // 10km for predictive caching
  cacheExpiryMs: 30 * 60 * 1000, // 30 minutes
  maxCacheEntries: 100
};
