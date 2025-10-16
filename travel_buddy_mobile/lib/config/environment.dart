class Environment {
  // Backend configuration - LOCAL DEVELOPMENT
  static const String backendUrl = 'http://10.0.2.2:3001';
  static const String baseUrl = backendUrl; // Add baseUrl alias
  static const bool isProduction = false; // Sandbox mode for PayPal testing
  
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