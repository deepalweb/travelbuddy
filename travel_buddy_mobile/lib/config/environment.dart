class Environment {
  // Backend Configuration
  static const bool useLocalBackend = false; // Set to true for local development
  static const String backendUrl = useLocalBackend 
    ? 'http://192.168.1.163:3001' // Local backend - use computer's IP
    : 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'; // Azure backend
  
  // API Keys - Load from environment or use placeholders
  static const String googleMapsApiKey = String.fromEnvironment('GOOGLE_MAPS_API_KEY', defaultValue: 'REPLACE_WITH_YOUR_MAPS_KEY');
  static const String weatherApiKey = String.fromEnvironment('WEATHER_API_KEY', defaultValue: 'REPLACE_WITH_YOUR_WEATHER_KEY');
  
  // API Endpoints (matching your web app)
  static const String apiUsers = '/api/users';
  static const String apiPlaces = '/api/places';
  static const String apiTrips = '/api/trips';
  static const String apiItineraries = '/api/itineraries';
  static const String apiFavorites = '/favorites';
  static const String apiDeals = '/api/deals';
  static const String apiPosts = '/api/posts';
  static const String apiReviews = '/api/reviews';
  static const String apiAuth = '/api/auth';
  
  // Development flags
  static const bool useMockAuth = false; // Set to true to use mock auth
  static const bool enableLogging = true;
}