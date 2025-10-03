class AppConstants {
  // API Configuration
  static const String baseUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'; // Azure backend
  static const String geminiModelText = 'gemini-2.5-flash';
  
  // Default Values
  static const int defaultPlacesRadiusM = 20000; // 20 km
  static const String defaultLanguage = 'en';
  static const String defaultCurrency = 'USD';
  
  // Storage Keys
  static const String favoritePlacesKey = 'travelBuddyFavoritePlaceIds';
  static const String savedTripPlansKey = 'travelBuddySavedTripPlans';
  static const String savedOneDayItinerariesKey = 'travelBuddySavedOneDayItineraries';
  static const String currentUserKey = 'travelBuddyCurrentUser';
  static const String selectedRadiusKey = 'travelBuddySelectedRadiusM';
  
  // Subscription Tiers
  static const Map<String, Map<String, dynamic>> subscriptionTiers = {
    'free': {
      'name': 'Free',
      'price': 0,
      'features': [
        'Basic place discovery',
        'View reviews',
        'Emergency SOS',
      ],
    },
    'basic': {
      'name': 'Basic',
      'price': 1.99,
      'features': [
        'All Free features',
        'Full place discovery',
        'Favorites',
        'One-day itinerary generation',
        'Community viewing',
      ],
    },
    'premium': {
      'name': 'Premium',
      'price': 5.99,
      'features': [
        'All Basic features',
        'AI trip planner',
        'Premium deals',
        'AI assistant',
        'Community posting',
        'Write reviews',
      ],
    },
    'pro': {
      'name': 'Pro',
      'price': 9.99,
      'features': [
        'All Premium features',
        'Priority support',
        'Early access',
      ],
    },
  };
  
  // Supported Languages
  static const List<Map<String, String>> supportedLanguages = [
    {'code': 'en', 'name': 'English'},
    {'code': 'es', 'name': 'Español'},
  ];
  
  // Common Currencies
  static const List<Map<String, String>> commonCurrencies = [
    {'code': 'USD', 'name': 'United States Dollar'},
    {'code': 'EUR', 'name': 'Euro'},
    {'code': 'JPY', 'name': 'Japanese Yen'},
    {'code': 'GBP', 'name': 'British Pound Sterling'},
    {'code': 'AUD', 'name': 'Australian Dollar'},
    {'code': 'CAD', 'name': 'Canadian Dollar'},
    {'code': 'CHF', 'name': 'Swiss Franc'},
    {'code': 'CNY', 'name': 'Chinese Yuan'},
    {'code': 'INR', 'name': 'Indian Rupee'},
  ];
  
  // Place Categories
  static const List<Map<String, String>> placeCategories = [
    {'value': 'all', 'label': 'All'},
    {'value': 'food', 'label': 'Food & Drink'},
    {'value': 'landmarks', 'label': 'Landmarks & Attractions'},
    {'value': 'culture', 'label': 'Culture & Museums'},
    {'value': 'nature', 'label': 'Outdoor & Nature'},
    {'value': 'shopping', 'label': 'Shopping & Markets'},
  ];
  
  // App Theme Colors
  static const Map<String, int> colors = {
    'primary': 0xFF6366F1,
    'primaryDark': 0xFF4338CA,
    'accent': 0xFF8B5CF6,
    'success': 0xFF22C55E,
    'error': 0xFFEF4444,
    'warning': 0xFFF59E0B,
    'info': 0xFF3B82F6,
    'background': 0xFFF9FAFB,
    'surface': 0xFFFFFFFF,
    'text': 0xFF111827,
    'textSecondary': 0xFF6B7280,
  };
}