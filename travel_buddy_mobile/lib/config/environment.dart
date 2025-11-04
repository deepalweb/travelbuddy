class Environment {
  // Backend configuration
  static const String backendUrl = String.fromEnvironment('BACKEND_URL', defaultValue: 'http://localhost:3001');
  static const String baseUrl = backendUrl;
  static const bool isProduction = bool.fromEnvironment('IS_PRODUCTION', defaultValue: false);
  static const bool enableDebugLogging = !isProduction;
  
  // PayPal configuration (sandbox values)
  static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID';
  static const String paypalSecret = 'YOUR_SANDBOX_SECRET';
  static const String paypalEnvironment = 'sandbox';
  
  // API keys should be fetched from backend, not stored in mobile app
  
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