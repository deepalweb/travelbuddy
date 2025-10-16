class Environment {
  // Backend configuration - AZURE PRODUCTION
  static const String backendUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';
  static const String baseUrl = backendUrl; // Add baseUrl alias
  static const bool isProduction = true; // Production mode
  
  // PayPal configuration (sandbox values)
  static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID'; // Replace with your sandbox client ID
  static const String paypalSecret = 'YOUR_SANDBOX_SECRET'; // Replace with your sandbox secret
  static const String paypalEnvironment = 'sandbox'; // Sandbox environment
  
  // API Keys
  static const String googleMapsApiKey = 'AIzaSyA89E6gkU7-nUMYk9JPt6xxYHVV4Yevtio';
  
  // Feature flags
  static const bool enablePayments = true;
  static const bool enableTrials = true;
  static const bool enableAnalytics = true;
}