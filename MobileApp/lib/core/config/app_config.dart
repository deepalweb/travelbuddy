class AppConfig {
  static const String baseUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api';
  static const String appName = 'TravelBuddy';
  static const String version = '1.0.0';
  
  // API endpoints
  static const String placesEndpoint = '/places/nearby';
  static const String usersEndpoint = '/users';
  static const String postsEndpoint = '/posts';
  static const String tripsEndpoint = '/trips';
  static const String reviewsEndpoint = '/reviews';
  static const String dealsEndpoint = '/deals';
  static const String eventsEndpoint = '/events';
  
  // App settings
  static const int requestTimeout = 30000; // 30 seconds
  static const int maxRetries = 3;
}