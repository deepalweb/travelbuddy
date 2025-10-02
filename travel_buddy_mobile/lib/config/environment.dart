class Environment {
  // Backend configuration - PRODUCTION
  static const String backendUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';
  static const bool isProduction = true;
  
  // PayPal configuration (production values)
  static const String paypalClientId = 'AQq4yCVTWy1j8WkcQ_c1Jr0bRdKuQcNGvkj2Q4zeMg5ti53lu5axuoG938MUL6SMIPf54koY8wzcU7LW';
  static const String paypalSecret = 'EPFfn37B81cgi41YbswVOIC05mPW3JQLiY-MbQ48-GU2neJBvw9m1Mr05SUBuzC2eTVH79Q1fRv4P8gG';
  
  // API Keys
  static const String googleMapsApiKey = 'AIzaSyA89E6gkU7-nUMYk9JPt6xxYHVV4Yevtio';
  
  // Feature flags
  static const bool enablePayments = true;
  static const bool enableTrials = true;
  static const bool enableAnalytics = true;
}