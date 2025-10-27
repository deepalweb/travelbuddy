class Environment {
  // Backend configuration - LOCAL DEVELOPMENT (for testing sync with web app)
  static const String backendUrl = 'http://localhost:3001';
  static const String baseUrl = backendUrl; // Add baseUrl alias
  static const bool isProduction = false; // Development mode
  static const bool enableDebugLogging = true; // Enable debug logging in development
  
  // PayPal configuration (sandbox values)
  static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID';
  static const String paypalSecret = 'YOUR_SANDBOX_SECRET';
  static const String paypalEnvironment = 'sandbox';
  
  // Hybrid Places API Configuration
  static const String azureMapsApiKey = 'YOUR_AZURE_MAPS_KEY';
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_KEY'; // For premium features only
  
  // Cost Optimization Settings
  static const int cacheExpiryHours = 24; // Cache popular places
  static const int maxGoogleCallsPerDay = 1000; // Budget limit
  static const int maxAzureCallsPerDay = 5000; // Higher limit for cheaper API
  
  // Feature flags
  static const bool enablePayments = true;
  static const bool enableTrials = true;
  static const bool enableAnalytics = true;
  static const bool enableAIPlanner = true;
}