import { lazy } from 'react';

// Lazy load heavy components with preload hints
const LazyComponents = {
  // Admin components (only load when needed)
  AdminPortal: lazy(() => 
    import('../admin/AdminPortal.tsx').then(module => ({ default: module.default }))
  ),

  // AI-powered components (heavy)
  AITripPlannerView: lazy(() => 
    import('./AITripPlannerView.tsx')
  ),
  AIAssistantView: lazy(() => 
    import('./AIAssistantView.tsx')
  ),

  // Community features (image-heavy)
  CommunityView: lazy(() => 
    import('./CommunityView.tsx')
  ),
  CommunityPhotoGalleryView: lazy(() => 
    import('./CommunityPhotoGalleryView.tsx')
  ),
  CommunityInsights: lazy(() => 
    import('./CommunityInsights.tsx')
  ),

  // Map components (heavy leaflet dependency)
  MapView: lazy(() => 
    import('./MapView.tsx')
  ),
  
  // Google Maps component (lazy loaded with Google Maps API)
  GoogleMapView: lazy(() => 
    import('./GoogleMapView.tsx')
  ),

  // API Status Checker (diagnostic tool)
  APIStatusChecker: lazy(() => 
    import('./APIStatusChecker.tsx')
  ),

  // Modals (only load when opened)
  SOSModal: lazy(() => 
    import('./SOSModal.tsx').then(module => ({ default: module.SOSModal }))
  ),
  ItineraryModal: lazy(() => 
  import('./ItineraryModal.tsx').then(module => ({ default: module.ItineraryModal }))
  ),
  PlaceDetailModal: lazy(() => 
    import('./PlaceDetailModal.tsx').then(module => ({ default: module.PlaceDetailModal }))
  ),
  CurrencyConverterModal: lazy(() => 
    import('./CurrencyConverterModal.tsx').then(module => ({ default: module.CurrencyConverterModal }))
  ),
  LostAndFoundModal: lazy(() => 
    import('./LostAndFoundModal.tsx').then(module => ({ default: module.LostAndFoundModal }))
  ),
  FlightHelpModal: lazy(() => 
    import('./FlightHelpModal.tsx').then(module => ({ default: module.FlightHelpModal }))
  ),
  LandmarkRecognitionModal: lazy(() => 
    import('./LandmarkRecognitionModal.tsx')
  ),
  LocationSharingModal: lazy(() => 
    import('./LocationSharingModal.tsx')
  ),

  // Chat/Realtime (socket.io dependency)
  RealTimeChatView: lazy(() => 
    import('./RealTimeChatView.tsx')
  ),

  // Performance monitoring (dev tools)
  APIUsageMonitor: lazy(() => 
    import('./APIUsageMonitor.tsx')
  ),
  PlacesPerformanceMonitor: lazy(() => 
    import('./PlacesPerformanceMonitor.tsx')
  ),
  DatabaseConnectivityTest: lazy(() => 
    import('./DatabaseConnectivityTest.tsx')
  ),
};

// Preload critical components that user is likely to use
export const preloadCriticalComponents = () => {
  // Preload components that are commonly used
  setTimeout(() => {
    import('./PlaceDetailModal.tsx');
  }, 2000);
  
  // Preload based on user interaction patterns
  setTimeout(() => {
    import('./CommunityView.tsx');
    import('./MapView.tsx');
  }, 5000);
};

// Preload components based on user actions
export const preloadOnUserIntent = (component: keyof typeof LazyComponents) => {
  switch (component) {
    case 'AdminPortal':
      import('../admin/AdminPortal.tsx');
      break;
    case 'AITripPlannerView':
      import('./AITripPlannerView.tsx');
      break;
    case 'CommunityView':
      import('./CommunityView.tsx');
      import('./CommunityPhotoGalleryView.tsx'); // Often used together
      break;
    case 'MapView':
      // Preload leaflet - suppress TypeScript error with void operator
      void import('leaflet');
      import('./MapView.tsx');
      break;
    case 'RealTimeChatView':
      // Preload socket.io
      import('socket.io-client');
      import('./RealTimeChatView.tsx');
      break;
  }
};

export default LazyComponents;
