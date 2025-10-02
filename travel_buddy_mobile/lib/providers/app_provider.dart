import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/user.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../models/weather.dart';
import '../models/weather_forecast.dart';
import '../models/travel_stats.dart';
import '../models/local_discovery.dart';
import '../models/personalized_suggestion.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/location_service.dart';
import '../services/permission_service.dart';
import '../services/local_discoveries_service.dart' as discoveries_service;
import '../services/weather_service.dart' as weather_service;
import '../services/places_service.dart';
import '../services/ai_service.dart';
import '../services/image_service.dart';
import '../services/settings_service.dart';
import '../services/notification_service.dart';
import '../services/error_handler_service.dart';
import '../services/usage_tracking_service.dart';
import '../services/recommendation_engine.dart';
import '../services/real_local_discoveries_service.dart';
import '../services/deals_service.dart';
import '../services/payment_service.dart';
import '../models/travel_style.dart';
import '../models/place_section.dart';




class AppProvider with ChangeNotifier, WidgetsBindingObserver {
  // Services
  final AuthService _authService = AuthService();
  final ApiService _apiService = ApiService();
  final AiService _aiService = AiService();
  final ImageService _imageService = ImageService();
  final NotificationService _notificationService = NotificationService();
  final StorageService _storageService = StorageService();
  final LocationService _locationService = LocationService();
  final PermissionService _permissionService = PermissionService();
  final weather_service.WeatherService _weatherService = weather_service.WeatherService();
  final discoveries_service.LocalDiscoveriesService _localDiscoveriesService = discoveries_service.LocalDiscoveriesService();
  final UsageTrackingService _usageTrackingService = UsageTrackingService();
  final RecommendationEngine _recommendationEngine = RecommendationEngine();
  final RealLocalDiscoveriesService _realLocalDiscoveriesService = RealLocalDiscoveriesService();

  
  // App lifecycle state
  bool _isAppActive = true;
  DateTime? _lastActiveTime;

  // User State
  CurrentUser? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;

  // Location State
  Position? _currentLocation;
  bool _isLocationLoading = false;
  String? _locationError;

  // Places State
  List<Place> _places = [];
  List<PlaceSection> _placeSections = [];
  bool _isSectionsLoading = false;

  // Trip State
  final List<TripPlan> _recentTrips = [];
  List<TripPlan> get recentTrips => _recentTrips;

  final List<Deal> _activeDeals = [];
  List<Deal> get activeDeals => _activeDeals;
  List<Place> _favoritePlaces = [];
  List<String> _favoriteIds = [];
  bool _isPlacesLoading = false;
  String? _placesError;
  String _selectedCategory = 'all';

  // UI State
  int _currentTabIndex = 0;
  bool _isDarkMode = false;
  bool _notificationsEnabled = true;
  bool _dealAlertsEnabled = true;

  // Places Settings
  int _selectedRadius = 20000;
  bool _hasMorePlaces = true;
  int _currentPage = 1;

  // Trips State
  List<TripPlan> _tripPlans = [];
  List<OneDayItinerary> _itineraries = [];
  bool _isTripsLoading = false;

  // Deals State
  List<Deal> _deals = [];
  bool _isDealsLoading = false;
  String? _dealsError;

  // Home Screen State
  List<PersonalizedSuggestion> _suggestions = [];
  LocalDiscovery? _localDiscoveries;
  WeatherInfo? _weatherInfo;
  WeatherForecast? _weatherForecast;
  List<String> _dailySuggestions = [];
  TravelStats? _travelStats;
  bool _isHomeLoading = false;





  // Getters
  CurrentUser? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  
  Position? get currentLocation => _currentLocation;
  bool get isLocationLoading => _isLocationLoading;
  String? get locationError => _locationError;
  
  List<Place> get places => _places;
  List<PlaceSection> get placeSections => _placeSections;
  bool get isSectionsLoading => _isSectionsLoading;
  List<Place> get favoritePlaces => _favoritePlaces;
  List<String> get favoriteIds => _favoriteIds;
  bool get isPlacesLoading => _isPlacesLoading;
  String? get placesError => _placesError;
  String get selectedCategory => _selectedCategory;
  int get selectedRadius => _selectedRadius;
  bool get hasMorePlaces => _hasMorePlaces;
  int get currentPage => _currentPage;
  
  List<TripPlan> get tripPlans => _tripPlans;
  List<OneDayItinerary> get itineraries => _itineraries;
  bool get isTripsLoading => _isTripsLoading;
  
  List<Deal> get deals => _deals;
  bool get isDealsLoading => _isDealsLoading;
  String? get dealsError => _dealsError;
  
  List<PersonalizedSuggestion> get suggestions => _suggestions;
  LocalDiscovery? get localDiscoveries => _localDiscoveries;
  WeatherInfo? get weatherInfo => _weatherInfo;
  WeatherForecast? get weatherForecast => _weatherForecast;
  List<String> get dailySuggestions => _dailySuggestions;
  TravelStats? get travelStats => _travelStats;
  bool get isHomeLoading => _isHomeLoading;
  

  

  
  int get currentTabIndex => _currentTabIndex;
  bool get isDarkMode => _isDarkMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get dealAlertsEnabled => _dealAlertsEnabled;
  
  AiService get aiService => _aiService;

  bool get isAppActive => _isAppActive;
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    switch (state) {
      case AppLifecycleState.resumed:
        _isAppActive = true;
        final now = DateTime.now();
        final wasInactive = _lastActiveTime != null && 
            now.difference(_lastActiveTime!).inMinutes > 5; // 5 min threshold
        _lastActiveTime = now;
        print('📱 App resumed - API calls enabled');
        
        // Refresh data if app was inactive for more than 5 minutes
        if (wasInactive) {
          print('🔄 App was inactive for >5min - refreshing data');
          _refreshDataAfterInactivity();
        }
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        _isAppActive = false;
        print('📱 App inactive - API calls disabled');
        break;
      case AppLifecycleState.hidden:
        _isAppActive = false;
        break;
    }
  }



  // Initialize app
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      print('🚀 Initializing Travel Buddy Mobile...');
      
      // Register app lifecycle observer
      WidgetsBinding.instance.addObserver(this);
      _isAppActive = true;
      _lastActiveTime = DateTime.now();
      
      // Skip API connection test for now
      if (_isAppActive) {
        print('🌐 App is active - ready for API calls');
      }
      
      // Initialize services
      _aiService.initialize();
      _imageService.initialize();
      await _notificationService.initialize();
      await SettingsService.initialize();
      await _storageService.initialize();
      await _usageTrackingService.initialize();
      
      // Load settings
      _loadSettings();
      print('✅ Services initialized');

      // Load user data
      await _loadUserData();
      print('✅ User data loaded');
      
      // Load location (only if app is active)
      if (_isAppActive) {
        await getCurrentLocation();
      }
      
      // Load cached data
      await _loadCachedData();
      
      print('✅ App initialization complete');
      
    } catch (e) {
      print('❌ Error initializing app: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Settings Methods
  // Places Methods

  // UI Methods
  void setCurrentTabIndex(int index) {
    if (_currentTabIndex != index) {
      _currentTabIndex = index;
      notifyListeners();
    }
  }



  Future<void> checkLocationPermissions() async {
    final permissions = await _permissionService.checkAllPermissions();
    if (!permissions['location']! || !permissions['locationService']!) {
      _locationError = 'Location access required for full functionality';
      notifyListeners();
    }
  }

  Future<void> openAppSettings() async {
    await _permissionService.openAppSettings();
  }

  // Home Data Methods
  Future<void> loadHomeData() async {
    // Skip API calls if app is not active
    if (!_isAppActive) {
      print('🚫 Skipping home data API calls - app is inactive');
      return;
    }
    
    _isHomeLoading = true;
    notifyListeners();

    try {
      await Future.wait([
        _loadPersonalizedSuggestions(),
        _loadLocalDiscoveries(),
        _loadWeatherInfo(),
        _loadWeatherForecast(),
        _loadDailySuggestions(),
        _loadTravelStats(),
      ]);
    } catch (e) {
      print('Error loading home data: $e');
    } finally {
      _isHomeLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadPersonalizedSuggestions() async {
    try {
      if (_places.isNotEmpty) {
        // Generate real personalized suggestions using ML engine
        final suggestions = await _recommendationEngine.generateContextualSuggestions(
          nearbyPlaces: _places.take(10).toList(),
          userStyle: _currentUser?.travelStyle,
          weather: _weatherInfo?.condition,
          hour: DateTime.now().hour,
        );
        
        // Convert to PersonalizedSuggestion objects
        _suggestions = suggestions.map((text) => PersonalizedSuggestion(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: 'For You',
          description: text,
          category: 'personalized',
          rating: 0.0,
          imageUrl: '',
          details: {},
          relevanceScore: 1.0,
          tags: ['personalized'],
        )).toList();
        
        print('✅ Generated ${_suggestions.length} ML-based personalized suggestions');
      }
    } catch (e) {
      print('❌ Error generating personalized suggestions: $e');
    }
  }

  Future<void> _loadLocalDiscoveries() async {
    try {
      if (_currentLocation != null) {
        // Try real API first
        final realDiscoveryData = await _apiService.getLocalDiscoveries(
          lat: _currentLocation!.latitude,
          lng: _currentLocation!.longitude,
          userStyle: _currentUser?.travelStyle?.name,
        );
        
        if (realDiscoveryData != null) {
          _localDiscoveries = LocalDiscovery(
            title: realDiscoveryData['title'] ?? 'Local Discoveries',
            description: realDiscoveryData['description'] ?? 'Explore local gems',
            hiddenGem: realDiscoveryData['hiddenGems']?.first ?? {'name': 'Local spot'},
            localFoodCulture: {'highlights': realDiscoveryData['localTips']?.take(2)?.toList() ?? []},
            insiderTips: List<String>.from(realDiscoveryData['localTips'] ?? []),
            events: List<Map<String, dynamic>>.from(realDiscoveryData['events'] ?? []),
            traditions: [],
            seasonalHighlights: [],
          );
          print('✅ Loaded REAL local discoveries from API: ${realDiscoveryData['title']}');
          return;
        }
        
        // Fallback to generated discoveries
        final realDiscoveries = await _realLocalDiscoveriesService.generateRealDiscoveries(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          userStyle: _currentUser?.travelStyle,
          weather: _weatherInfo?.condition,
        );
        
        if (realDiscoveries.isNotEmpty) {
          final discovery = realDiscoveries.first;
          _localDiscoveries = LocalDiscovery(
            title: discovery.title,
            description: discovery.description,
            hiddenGem: {'name': discovery.items.isNotEmpty ? discovery.items.first : 'Local spot'},
            localFoodCulture: {'highlights': discovery.items.take(2).toList()},
            insiderTips: discovery.items,
            events: [],
            traditions: [],
            seasonalHighlights: [],
          );
          print('✅ Loaded fallback local discoveries: ${discovery.title}');
        }
      }
    } catch (e) {
      print('❌ Error loading local discoveries: $e');
      // Final fallback to mock service
      final discoveries = await _localDiscoveriesService.generateLocalDiscoveries('Current City');
      _localDiscoveries = discoveries.isNotEmpty ? discoveries.first.toModelLocalDiscovery() : null;
    }
  }

  Future<void> _loadWeatherInfo() async {
    if (_currentLocation != null) {
      final weather = await _weatherService.getCurrentWeather(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
      );
      _weatherInfo = weather.toModelWeatherInfo();
    }
  }

  Future<void> _loadWeatherForecast() async {
    try {
      if (_currentLocation != null) {
        // Get real weather forecast from weather service
        final realForecast = await _weatherService.getDetailedForecast(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
        );
        
        // Convert to app model format
        final hourlyForecasts = realForecast.hourly.take(3).map((hourly) {
          return HourlyForecast(
            time: '${hourly.time.hour}:00',
            temperature: hourly.temperature,
            condition: hourly.condition,
          );
        }).toList();
        
        _weatherForecast = WeatherForecast(
          condition: _weatherInfo?.condition ?? 'sunny',
          temperature: _weatherInfo?.temperature ?? 25.0,
          humidity: _weatherInfo?.humidity.toDouble() ?? 65.0,
          windSpeed: _weatherInfo?.windSpeed ?? 8.5,
          hourlyForecast: hourlyForecasts,
        );
        
        print('✅ Loaded REAL weather forecast with ${hourlyForecasts.length} hours');
        return;
      }
    } catch (e) {
      print('❌ Error loading real weather forecast: $e');
    }
    
    // Always provide fallback forecast
    final hourlyForecasts = List.generate(3, (index) {
      final time = DateTime.now().add(Duration(hours: index * 3));
      return HourlyForecast(
        time: '${time.hour}:00',
        temperature: (_weatherInfo?.temperature ?? 25.0) + (index * 2),
        condition: index == 0 ? 'sunny' : index == 1 ? 'cloudy' : 'partly_cloudy',
      );
    });
    
    _weatherForecast = WeatherForecast(
      condition: _weatherInfo?.condition ?? 'sunny',
      temperature: _weatherInfo?.temperature ?? 25.0,
      humidity: 65.0,
      windSpeed: 8.5,
      hourlyForecast: hourlyForecasts,
    );
    print('✅ Loaded fallback weather forecast');
  }

  Future<void> _loadDailySuggestions() async {
    try {
      if (_currentUser?.mongoId != null && _currentLocation != null) {
        // Try real API first
        final realSuggestions = await _apiService.getDailySuggestions(
          userId: _currentUser!.mongoId!,
          lat: _currentLocation!.latitude,
          lng: _currentLocation!.longitude,
          weather: _weatherInfo?.condition,
          timeOfDay: _getCurrentTimeOfDay(),
          userStyle: _currentUser?.travelStyle?.name,
        );
        
        if (realSuggestions.isNotEmpty) {
          _dailySuggestions = realSuggestions;
          print('✅ Loaded REAL daily suggestions from API: ${_dailySuggestions.length} items');
          return;
        }
      }
      
      // Always generate personalized suggestions
      _dailySuggestions = await _generatePersonalizedSuggestions();
      print('✅ Loaded personalized suggestions: ${_dailySuggestions.length} items');
    } catch (e) {
      print('❌ Error loading daily suggestions: $e');
      // Final fallback with smart suggestions
      _dailySuggestions = _getSmartFallbackSuggestions();
      print('✅ Loaded smart fallback suggestions: ${_dailySuggestions.length} items');
    }
  }
  
  List<String> _getSmartFallbackSuggestions() {
    final hour = DateTime.now().hour;
    final weather = _weatherInfo?.condition.toLowerCase() ?? 'clear';
    
    if (hour < 12) {
      if (weather.contains('rain')) {
        return ['Find cozy indoor cafes for breakfast', 'Visit museums and galleries today'];
      }
      return ['Explore morning markets and cafes', 'Perfect time for outdoor sightseeing'];
    } else if (hour >= 18) {
      if (weather.contains('rain')) {
        return ['Discover indoor dining experiences', 'Check out evening entertainment venues'];
      }
      return ['Find great dinner spots nearby', 'Explore evening attractions and nightlife'];
    } else {
      if (weather.contains('rain')) {
        return ['Visit indoor attractions and shopping', 'Try local restaurants for lunch'];
      }
      return ['Explore nearby attractions', 'Discover local restaurants and cafes'];
    }
  }
  
  Future<List<String>> _generatePersonalizedSuggestions() async {
    final hour = DateTime.now().hour;
    final isWeekend = DateTime.now().weekday >= 6;
    final weather = _weatherInfo?.condition.toLowerCase() ?? 'clear';
    final userStyle = _currentUser?.travelStyle;
    final userInsights = _usageTrackingService.getUserInsights();
    final topCategory = userInsights['topCategory'] as String?;
    
    List<String> suggestions = [];
    
    // Time-based personalized suggestions
    if (hour < 12) {
      if (userStyle == TravelStyle.foodie || topCategory == 'restaurants') {
        suggestions.add('Discover amazing breakfast spots and local coffee roasters');
      } else if (userStyle == TravelStyle.culture || topCategory == 'culture') {
        suggestions.add('Visit museums early - they\'re less crowded in the morning');
      } else if (userStyle == TravelStyle.nature || topCategory == 'nature') {
        suggestions.add('Perfect morning for parks and nature walks');
      } else {
        suggestions.add('Start your day exploring local morning markets');
      }
    } else if (hour < 18) {
      if (userStyle == TravelStyle.explorer || topCategory == 'attractions') {
        suggestions.add('Prime time for sightseeing and tourist attractions');
      } else if (userStyle == TravelStyle.foodie || topCategory == 'restaurants') {
        suggestions.add('Lunch time! Try highly-rated local restaurants');
      } else {
        suggestions.add('Great afternoon for exploring local neighborhoods');
      }
    } else {
      if (userStyle == TravelStyle.nightOwl || topCategory == 'nightlife') {
        suggestions.add('Evening is perfect for bars and nightlife experiences');
      } else if (userStyle == TravelStyle.foodie || topCategory == 'restaurants') {
        suggestions.add('Dinner time! Discover amazing evening dining spots');
      } else {
        suggestions.add('Enjoy evening entertainment and cultural events');
      }
    }
    
    // Weather-based personalized suggestions
    if (weather.contains('rain')) {
      if (userStyle == TravelStyle.culture) {
        suggestions.add('Rainy day is perfect for museums and galleries');
      } else if (userStyle == TravelStyle.foodie) {
        suggestions.add('Cozy indoor dining and food halls await you');
      } else {
        suggestions.add('Great weather for indoor shopping and cafes');
      }
    } else if (weather.contains('sunny')) {
      if (userStyle == TravelStyle.nature) {
        suggestions.add('Beautiful weather for parks and outdoor activities');
      } else if (userStyle == TravelStyle.foodie) {
        suggestions.add('Perfect for outdoor dining and food markets');
      } else {
        suggestions.add('Sunny weather is ideal for outdoor sightseeing');
      }
    }
    
    // Weekend-specific suggestions
    if (isWeekend && userStyle == TravelStyle.nightOwl) {
      suggestions.add('Weekend nightlife scene is buzzing - explore bars and clubs');
    } else if (isWeekend && userStyle == TravelStyle.relaxer) {
      suggestions.add('Perfect weekend for peaceful parks and quiet cafes');
    }
    
    // Add nearby place-specific suggestions
    if (_places.isNotEmpty) {
      final topPlace = _places.first;
      if (userStyle != null) {
        final styleMatch = _getPlaceStyleMatch(topPlace, userStyle);
        if (styleMatch) {
          suggestions.add('${topPlace.name} nearby matches your ${userStyle.displayName} style perfectly');
        }
      }
    }
    
    // Return top 2-3 most relevant suggestions
    return suggestions.take(3).toList();
  }
  
  bool _getPlaceStyleMatch(dynamic place, TravelStyle style) {
    final type = place.type.toLowerCase();
    switch (style) {
      case TravelStyle.foodie:
        return type.contains('restaurant') || type.contains('cafe');
      case TravelStyle.culture:
        return type.contains('museum') || type.contains('gallery');
      case TravelStyle.nature:
        return type.contains('park') || type.contains('nature');
      case TravelStyle.nightOwl:
        return type.contains('bar') || type.contains('nightlife');
      default:
        return false;
    }
  }

  Future<void> _loadTravelStats() async {
    try {
      if (_currentUser?.mongoId != null) {
        // Get real travel stats from backend
        final backendStats = await _apiService.getUserTravelStats(_currentUser!.mongoId!);
        if (backendStats != null) {
          _travelStats = backendStats;
          print('✅ Loaded REAL travel stats from backend: ${_travelStats!.totalPlacesVisited} places');
          return;
        }
      }
      
      // Fallback: Calculate from local data and sync to backend
      final userInsights = _usageTrackingService.getUserInsights();
      final favoritesCount = _favoriteIds.length;
      final recentPlaces = _places;
      
      _travelStats = TravelStats.fromUserData(
        userInsights: userInsights,
        favoritesCount: favoritesCount,
        recentPlaces: recentPlaces,
      );
      
      // Sync calculated stats to backend
      if (_currentUser?.mongoId != null) {
        await _apiService.updateUserTravelStats(_currentUser!.mongoId!, _travelStats!);
        print('✅ Synced travel stats to backend');
      }
      
      print('✅ Loaded travel stats: ${_travelStats!.totalPlacesVisited} interactions');
    } catch (e) {
      print('❌ Error loading travel stats: $e');
      _travelStats = TravelStats.mock();
    }
  }
  static const int _placesPerPage = 12;



  // Authentication Methods
  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Ensure storage is initialized first
      await _storageService.initialize();
      
      final user = await _authService.signInWithEmail(email, password);
      if (user != null) {
        _currentUser = user;
        _isAuthenticated = true;
        await _loadUserData();
        return true;
      }
      return false;
    } catch (e) {
      print('Sign in error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp(String email, String password, String username) async {
    return await register(email, password, username);
  }

  Future<bool> register(String email, String password, String username) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Ensure storage is initialized first
      await _storageService.initialize();
      
      final user = await _authService.registerWithEmail(email, password, username);
      if (user != null) {
        _currentUser = user;
        _isAuthenticated = true;
        return true;
      }
      return false;
    } catch (e) {
      print('Register error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    notifyListeners();

    try {
      final user = await _authService.signInWithGoogle();
      if (user != null) {
        _currentUser = user;
        _isAuthenticated = true;
        await _loadUserData();
        return true;
      }
      return false;
    } catch (e) {
      print('Google Sign in error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    _currentUser = null;
    _isAuthenticated = false;
    _places.clear();
    _favoritePlaces.clear();
    _favoriteIds.clear();
    _tripPlans.clear();
    _itineraries.clear();
    _deals.clear();
    notifyListeners();
  }

  Future<bool> updateUserProfile({
    String? username,
    String? email,
    String? profilePicture,
  }) async {
    try {
      final updatedUser = await _authService.updateUserProfile(
        username: username,
        email: email,
        profilePicture: profilePicture,
      );
      
      if (updatedUser != null) {
        _currentUser = updatedUser;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('Error updating user profile: $e');
      return false;
    }
  }

  Future<bool> deleteUserAccount(String userId) async {
    try {
      return await _apiService.deleteUser(userId);
    } catch (e) {
      print('Error deleting user account: $e');
      return false;
    }
  }
  
  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    try {
      final paymentService = PaymentService();
      return await paymentService.getSubscriptionStatus();
    } catch (e) {
      print('Error getting subscription status: $e');
      return {'active': false, 'tier': 'free'};
    }
  }
  
  Future<bool> cancelSubscription() async {
    try {
      final paymentService = PaymentService();
      return await paymentService.cancelSubscription();
    } catch (e) {
      print('Error cancelling subscription: $e');
      return false;
    }
  }

  Future<bool> updateSubscription(SubscriptionTier tier, {bool isFreeTrial = true}) async {
    if (_currentUser == null) return false;
    
    try {
      final now = DateTime.now();
      final trialEnd = now.add(const Duration(days: 7));
      
      // Update backend first
      final backendSuccess = await _syncSubscriptionWithBackend(tier, isFreeTrial);
      if (!backendSuccess) {
        print('⚠️ Backend sync failed, updating locally only');
      }
      
      final updatedUser = _currentUser!.copyWith(
        tier: tier,
        subscriptionStatus: isFreeTrial ? SubscriptionStatus.trial : SubscriptionStatus.active,
        trialEndDate: isFreeTrial ? trialEnd.toIso8601String() : null,
        subscriptionEndDate: isFreeTrial ? null : now.add(const Duration(days: 30)).toIso8601String(),
      );
      
      await _storageService.saveUser(updatedUser);
      _currentUser = updatedUser;
      notifyListeners();
      
      final message = isFreeTrial 
          ? '7-day free trial started for ${tier.toString().split('.').last.toUpperCase()}'
          : 'Welcome to ${tier.toString().split('.').last.toUpperCase()} plan';
      
      await _notificationService.showLocalNotification(
        'Subscription Updated!',
        message,
      );
      
      return true;
    } catch (e) {
      print('Error updating subscription: $e');
      return false;
    }
  }
  
  Future<bool> _syncSubscriptionWithBackend(SubscriptionTier tier, bool isFreeTrial) async {
    try {
      if (_currentUser?.mongoId == null) return false;
      
      final response = await _apiService.updateUserSubscription(
        _currentUser!.mongoId!,
        {
          'tier': tier.name,
          'status': isFreeTrial ? 'trial' : 'active',
          'trialEndDate': isFreeTrial ? DateTime.now().add(const Duration(days: 7)).toIso8601String() : null,
          'subscriptionEndDate': !isFreeTrial ? DateTime.now().add(const Duration(days: 30)).toIso8601String() : null,
        },
      );
      
      return response != null;
    } catch (e) {
      print('❌ Backend subscription sync failed: $e');
      return false;
    }
  }
  
  bool get isTrialExpired {
    if (_currentUser?.subscriptionStatus != SubscriptionStatus.trial) return false;
    if (_currentUser?.trialEndDate == null) return false;
    
    final trialEnd = DateTime.tryParse(_currentUser!.trialEndDate!);
    return trialEnd != null && DateTime.now().isAfter(trialEnd);
  }
  
  bool get hasActiveSubscription {
    if (_currentUser == null) return false;
    
    final status = _currentUser!.subscriptionStatus;
    if (status == SubscriptionStatus.active) return true;
    if (status == SubscriptionStatus.trial && !isTrialExpired) return true;
    
    return false;
  }
  
  bool canAccessFeature(String feature) {
    if (_currentUser == null) return false;
    
    final tier = _currentUser!.tier;
    final hasActive = hasActiveSubscription;
    
    switch (feature) {
      case 'unlimited_favorites':
        return hasActive && tier != SubscriptionTier.free;
      case 'ai_recommendations':
        return hasActive && (tier == SubscriptionTier.premium || tier == SubscriptionTier.pro);
      case 'offline_maps':
        return hasActive && (tier == SubscriptionTier.premium || tier == SubscriptionTier.pro);
      case 'advanced_trip_planning':
        return hasActive && tier != SubscriptionTier.free;
      case 'business_features':
        return hasActive && tier == SubscriptionTier.pro;
      default:
        return true; // Basic features available to all
    }
  }
  
  int get maxFavorites {
    if (!hasActiveSubscription) return 10; // Free tier limit
    
    switch (_currentUser!.tier) {
      case SubscriptionTier.basic:
        return 50;
      case SubscriptionTier.premium:
      case SubscriptionTier.pro:
        return -1; // Unlimited
      default:
        return 10;
    }
  }

  // Location Methods
  Future<void> getCurrentLocation() async {
    if (_isLocationLoading) return;
    _isLocationLoading = true;
    _locationError = null;
    notifyListeners();

    try {
      // Check and request permissions first
      final hasPermission = await _permissionService.requestLocationPermission();
      if (!hasPermission) {
        _locationError = 'Location permission denied. Please enable location access in settings.';
        _isLocationLoading = false;
        notifyListeners();
        return;
      }

      // Check if location service is enabled
      final serviceEnabled = await _permissionService.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _locationError = 'Location service is disabled. Please enable location services.';
        _isLocationLoading = false;
        notifyListeners();
        return;
      }

      final position = await _locationService.getCurrentLocation();
      if (position != null) {
        _currentLocation = position;
        _locationError = null;
        print('📍 Location obtained');
      } else {
        // Use fallback location for testing
        print('🔄 Using fallback location for testing');
        _currentLocation = Position(
          latitude: 37.7749,
          longitude: -122.4194,
          timestamp: DateTime.now(),
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: 0,
          heading: 0,
          headingAccuracy: 0,
          speed: 0,
          speedAccuracy: 0,
        );
        _locationError = 'Using fallback location (San Francisco) for testing';
      }
    } catch (e) {
      _locationError = e.toString();
      print('Error getting location: $e');
    } finally {
      _isLocationLoading = false;
      notifyListeners();
    }

  }

  Future<void> openLocationSettings() async {
    await _permissionService.openLocationSettings();
  }

  // Places Methods
  Future<void> loadNearbyPlaces({String searchQuery = '', bool loadMore = false}) async {
    // Skip API calls if app is not active
    if (!_isAppActive) {
      print('🚫 Skipping places API call - app is inactive');
      return;
    }
    
    if (_currentLocation == null) {
      _placesError = 'Location not available. Please enable location services.';
      notifyListeners();
      return;
    }

    // Check if location changed significantly - force refresh if moved >1km
    final locationChanged = await _hasLocationChangedSignificantly();
    
    // Check if we have valid cached data for current location (only if location hasn't changed much)
    if (!loadMore && searchQuery.isEmpty && !locationChanged) {
      final cachedData = await _storageService.getCachedPlacesForLocation(
        _currentLocation!.latitude,
        _currentLocation!.longitude,
        _selectedCategory,
        maxAgeHours: 0.5, // Shorter cache time - 30 minutes
        maxDistanceKm: 1.0, // Tighter distance threshold - 1km
      );
      
      if (cachedData.isNotEmpty) {
        print('💾 Using cached places (${cachedData.length}) - within distance/time threshold');
        _places = cachedData;
        _placesError = null;
        notifyListeners();
        return; // Skip API call - use cache
      }
    }
    
    if (locationChanged) {
      print('📍 Location changed significantly - forcing fresh places load');
    }
    
    _isPlacesLoading = true;
    _placesError = null;
    
    if (!loadMore) {
      _places.clear();
      _currentPage = 1;
      _hasMorePlaces = true;
    }
    
    notifyListeners();

    try {
      final placesService = PlacesService();
      List<Place> places;
      
      // Determine query based on search or category
      String query = searchQuery;
      if (query.isEmpty) {
        query = _getCategoryQuery(_selectedCategory);
      }
      
      if (searchQuery.isNotEmpty) {
        // Search query takes priority
        places = await placesService.fetchPlacesPipeline(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          query: query,
          radius: _selectedRadius,
          topN: 12,
          offset: loadMore ? _places.length : 0,
        );
        print('🔍 Search results for: $query');
      } else if (_selectedCategory != 'all') {
        // Single category search
        places = await placesService.fetchPlacesPipeline(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          query: query,
          radius: _selectedRadius,
          topN: 12,
          offset: loadMore ? _places.length : 0,
        );
        print('📂 Category results for: $_selectedCategory');
      } else {
        // Load diverse, high-quality places with smart distribution
        final now = DateTime.now();
        final hour = now.hour;
        final isEvening = hour >= 18;
        final isMorning = hour < 12;
        final isWeekend = now.weekday >= 6; // Saturday = 6, Sunday = 7
        final dayContext = _getDayContext(isWeekend, hour);
        
        List<Place> allPlaces = [];
        
        if (isEvening) {
          // Evening: dining + nightlife + attractions (adjusted for day of week)
          final restaurantCount = isWeekend ? 7 : 6; // More restaurants on weekends
          final nightlifeCount = isWeekend ? 4 : 2; // More nightlife on weekends
          final attractionCount = isWeekend ? 2 : 4; // Fewer attractions on weekend evenings
          
          final restaurants = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['restaurants']),
            topN: restaurantCount,
          );
          
          final bars = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['bars', 'nightlife']),
            topN: nightlifeCount,
          );
          
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: attractionCount,
          );
          
          allPlaces = [...restaurants, ...bars, ...attractions];
        } else if (isMorning) {
          // Morning: cafes + attractions + culture + nature (adjusted for day of week)
          final cafeCount = isWeekend ? 3 : 5; // Fewer cafes on weekends (people sleep in)
          final attractionCount = isWeekend ? 5 : 3; // More attractions on weekends
          final cultureCount = isWeekend ? 3 : 2; // More culture on weekends
          final natureCount = isWeekend ? 1 : 2; // Slightly less nature focus on weekends
          
          final cafes = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['cafes']),
            topN: cafeCount,
          );
          
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: attractionCount,
          );
          
          final culture = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['culture']),
            topN: cultureCount,
          );
          
          final nature = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['nature']),
            topN: natureCount,
          );
          
          allPlaces = [...cafes, ...attractions, ...culture, ...nature];
        } else {
          // Afternoon: balanced mix of everything (adjusted for day of week)
          final attractionCount = isWeekend ? 5 : 4; // More attractions on weekends
          final restaurantCount = isWeekend ? 3 : 3; // Same restaurants
          final cultureCount = isWeekend ? 2 : 2; // Same culture
          final natureCount = isWeekend ? 1 : 2; // Less nature on weekends
          final shoppingCount = isWeekend ? 1 : 1; // Same shopping
          
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: attractionCount,
          );
          
          final restaurants = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['restaurants']),
            topN: restaurantCount,
          );
          
          final culture = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['culture']),
            topN: cultureCount,
          );
          
          final nature = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['nature']),
            topN: natureCount,
          );
          
          final shopping = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['shopping']),
            topN: shoppingCount,
          );
          
          allPlaces = [...attractions, ...restaurants, ...culture, ...nature, ...shopping];
        }
        
        // Deduplicate and filter by rating
        final seen = <String>{};
        places = allPlaces
            .where((place) {
              final key = place.id.isNotEmpty ? place.id : place.name;
              if (seen.contains(key)) return false;
              seen.add(key);
              return place.rating >= 3.5; // Only show well-rated places
            })
            .toList();
            
        // Apply ML-based personalized ranking
        if (_currentUser?.travelStyle != null && places.isNotEmpty) {
          places = await _recommendationEngine.getPersonalizedRecommendations(
            availablePlaces: places,
            userStyle: _currentUser!.travelStyle,
            currentWeather: _weatherInfo?.condition,
            hour: DateTime.now().hour,
          );
          print('✅ Applied ML-based personalized ranking to ${places.length} places');
        } else {
          // Fallback to rating-based sorting
          places.sort((a, b) => b.rating.compareTo(a.rating));
        }
      }

      // AI Enrichment and distance calculation
      places = await _enrichPlacesWithAI(places);
      
      // Add distance info to places
      for (int i = 0; i < places.length; i++) {
        final place = places[i];
        final distance = Geolocator.distanceBetween(
          _currentLocation!.latitude,
          _currentLocation!.longitude,
          place.latitude ?? 0.0,
          place.longitude ?? 0.0,
        );
        final distanceKm = (distance / 1000).toStringAsFixed(1);
        
        // Update description with distance
        places[i] = Place(
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          rating: place.rating,
          type: place.type,
          photoUrl: place.photoUrl,
          description: '${place.description} • ${distanceKm}km away',
          localTip: place.localTip,
          handyPhrase: place.handyPhrase,
          phoneNumber: place.phoneNumber,
          website: place.website,
        );
      }
      
      print('✅ Fetched ${places.length} places for category: $_selectedCategory');
      print('📍 Query: $query');
      
      // Log context info
      final now = DateTime.now();
      final isWeekend = now.weekday >= 6;
      final timeOfDay = now.hour < 12 ? 'morning' : (now.hour < 18 ? 'afternoon' : 'evening');
      final weather = _weatherInfo?.condition.toLowerCase() ?? 'clear';
      print('🌤️ Context: ${isWeekend ? 'weekend' : 'weekday'} $timeOfDay, weather: $weather');
      
      if (places.isNotEmpty) {
        print('🏛️ Top places: ${places.take(3).map((p) => '${p.name} (${p.rating}⭐)').join(", ")}');
        
        // Check if data is real or mock
        final hasRealIds = places.any((p) => p.id.isNotEmpty && !p.id.startsWith('mock_'));
        final hasGooglePhotos = places.any((p) => p.photoUrl.contains('googleapis') || p.photoUrl.contains('googleusercontent'));
        final hasRealAddresses = places.any((p) => p.address.isNotEmpty && p.address != 'Near your location');
        
        if (hasRealIds && hasRealAddresses) {
          print('✅ REAL DATA: Places have Google Place IDs and real addresses');
        } else {
          print('🎭 MOCK DATA: Places appear to be generated mock data');
        }
        
        // Log context-aware distribution
        if (_selectedCategory == 'all') {
          final distribution = _analyzeDistribution(places);
          print('📊 Distribution: ${distribution.entries.map((e) => '${e.key}: ${e.value}').join(', ')}');
        }
      }
      if (loadMore) {
        final existingIds = _places.map((p) => p.id).toSet();
        final newPlaces = places.where((p) => !existingIds.contains(p.id)).toList();
        _places.addAll(newPlaces);
        _currentPage++;
        _hasMorePlaces = newPlaces.length >= 6; // If we got 6+ new places, likely more available
      } else {
        _places = places;
        _currentPage = 1;
        _hasMorePlaces = places.length >= _placesPerPage;
      }
      _placesError = null;
      
      // Smart location-based caching
      if (places.isNotEmpty) {
        await _storageService.cachePlacesWithLocation(
          places, 
          _currentLocation!.latitude, 
          _currentLocation!.longitude,
          _selectedCategory
        );
        print('💾 Cached ${places.length} places for location ${_currentLocation!.latitude.toStringAsFixed(3)}, ${_currentLocation!.longitude.toStringAsFixed(3)}');
      }
      await _updateFavoritePlaces();
      
    } catch (e) {
      print('❌ Error loading places: $e');
      _placesError = 'Failed to load places: ${e.toString()}';
      
      // Show relevant cached places only if network fails
      if (_placesError?.contains('network') == true || _placesError?.contains('offline') == true) {
        try {
          final cachedPlaces = await _storageService.getCachedPlacesForLocation(
            _currentLocation!.latitude,
            _currentLocation!.longitude,
            _selectedCategory,
            maxAgeHours: 24, // More lenient for offline mode
            maxDistanceKm: 10.0, // Wider radius for offline
          );
          
          if (cachedPlaces.isNotEmpty) {
            _places = cachedPlaces;
            _placesError = 'No internet connection. Showing nearby cached places.';
            print('📱 Network error: Loaded ${cachedPlaces.length} relevant cached places');
          } else {
            print('🚫 No relevant cached places for current location');
          }
        } catch (cacheError) {
          print('❌ Cache error: $cacheError');
        }
      } else {
        print('🚫 API error but not network issue - not showing cache');
      }
    } finally {
      _isPlacesLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleFavorite(String placeId) async {
    final place = _places.firstWhere((p) => p.id == placeId, orElse: () => Place(id: '', name: '', address: '', latitude: 0, longitude: 0, rating: 0, type: '', photoUrl: '', description: '', localTip: '', handyPhrase: ''));
    
    if (_favoriteIds.contains(placeId)) {
      _favoriteIds.remove(placeId);
      await _storageService.removeFavorite(placeId);
      
      if (_currentUser?.mongoId != null) {
        await _apiService.removeFavorite(_currentUser!.mongoId!, placeId);
      }
    } else {
      // Check favorites limit
      final maxFavs = maxFavorites;
      if (maxFavs > 0 && _favoriteIds.length >= maxFavs) {
        await _notificationService.showLocalNotification(
          'Favorites Limit Reached',
          'Upgrade to add more favorites (${_favoriteIds.length}/$maxFavs)',
        );
        return false;
      }
      
      _favoriteIds.add(placeId);
      await _storageService.addFavorite(placeId);
      
      if (_currentUser?.mongoId != null) {
        await _apiService.addFavorite(_currentUser!.mongoId!, placeId);
      }
      
      if (place.name.isNotEmpty) {
        await _notificationService.showLocalNotification(
          'Added to Favorites',
          '${place.name} has been saved to your favorites',
        );
      }
    }
    
    await _updateFavoritePlaces();
    notifyListeners();
    return true;
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    _currentPage = 1;
    _hasMorePlaces = true;
    notifyListeners();
    loadNearbyPlaces();
  }
  
  Future<void> loadMorePlaces() async {
    if (!_hasMorePlaces || _isPlacesLoading) return;
    await loadNearbyPlaces(loadMore: true);
  }
  
  String _getCategoryQuery(String category) {
    final hour = DateTime.now().hour;
    final isEvening = hour >= 18;
    
    switch (category) {
      case 'food':
        return isEvening ? _expandKeywords(['restaurants', 'bars']) : _expandKeywords(['restaurants', 'cafes']);
      case 'landmarks':
        return _expandKeywords(['landmarks', 'attractions']);
      case 'culture':
        return _expandKeywords(['museums', 'galleries']);
      case 'nature':
        return _expandKeywords(['parks', 'nature']);
      case 'shopping':
        return _expandKeywords(['shopping', 'markets']);
      case 'all':
      default:
        return _expandKeywords(['attractions']);
    }
  }
  
  String _expandKeywords(List<String> keywords) {
    final expanded = <String>{};
    
    // Apply weather-aware filtering
    final weatherAdjustedKeywords = _applyWeatherContext(keywords);
    
    for (final keyword in weatherAdjustedKeywords) {
      switch (keyword.toLowerCase()) {
        case 'restaurants':
        case 'restaurant':
        case 'food':
          expanded.addAll(['restaurant', 'cafe', 'coffee shop', 'eatery']);
          break;
        case 'hotels':
        case 'lodging':
        case 'hotel':
          expanded.addAll(['hotel', 'hostel', 'guest house', 'resort']);
          break;
        case 'landmarks':
        case 'attractions':
          expanded.addAll(['landmark', 'attraction', 'tourist attraction', 'monument']);
          break;
        case 'culture':
          expanded.addAll(['museum', 'art gallery', 'temple', 'church', 'historic site']);
          break;
        case 'nature':
          expanded.addAll(['park', 'garden', 'beach', 'nature reserve', 'scenic viewpoint']);
          break;
        case 'entertainment':
          expanded.addAll(['cinema', 'theater', 'entertainment venue']);
          break;
        case 'bars':
        case 'nightlife':
          expanded.addAll(['bar', 'pub', 'nightclub', 'lounge']);
          break;
        case 'shopping':
          expanded.addAll(['shopping mall', 'market', 'boutique', 'store']);
          break;
        case 'cafes':
          expanded.addAll(['cafe', 'coffee shop', 'bakery']);
          break;
        case 'fine dining':
          expanded.addAll(['fine dining', 'upscale restaurant', 'gourmet']);
          break;
        default:
          expanded.add(keyword);
      }
    }
    
    return expanded.join(' ');
  }
  
  // Weather-aware keyword adjustment
  List<String> _applyWeatherContext(List<String> keywords) {
    final weather = _weatherInfo?.condition.toLowerCase() ?? 'clear';
    final isRainy = weather.contains('rain') || weather.contains('storm') || weather.contains('drizzle');
    final isSunny = weather.contains('sunny') || weather.contains('clear');
    
    final adjustedKeywords = <String>[];
    
    for (final keyword in keywords) {
      if (isRainy) {
        // Prioritize indoor places when raining
        switch (keyword.toLowerCase()) {
          case 'attractions':
            adjustedKeywords.addAll(['museum', 'shopping mall', 'indoor attraction']);
            break;
          case 'nature':
            adjustedKeywords.addAll(['indoor garden', 'conservatory', 'aquarium']);
            break;
          case 'entertainment':
            adjustedKeywords.addAll(['cinema', 'theater', 'indoor entertainment']);
            break;
          default:
            adjustedKeywords.add(keyword);
        }
      } else if (isSunny) {
        // Prioritize outdoor places when sunny
        switch (keyword.toLowerCase()) {
          case 'attractions':
            adjustedKeywords.addAll(['outdoor attraction', 'viewpoint', 'landmark']);
            break;
          case 'nature':
            adjustedKeywords.addAll(['park', 'garden', 'beach', 'outdoor space']);
            break;
          case 'cafes':
            adjustedKeywords.addAll(['outdoor cafe', 'terrace', 'rooftop']);
            break;
          default:
            adjustedKeywords.add(keyword);
        }
      } else {
        adjustedKeywords.add(keyword);
      }
    }
    
    return adjustedKeywords.isEmpty ? keywords : adjustedKeywords;
  }
  
  // Get day and time context for place distribution
  Map<String, dynamic> _getDayContext(bool isWeekend, int hour) {
    return {
      'isWeekend': isWeekend,
      'timeOfDay': hour < 12 ? 'morning' : (hour < 18 ? 'afternoon' : 'evening'),
      'dayType': isWeekend ? 'weekend' : 'weekday',
      'weather': _weatherInfo?.condition.toLowerCase() ?? 'clear',
    };
  }
  
  // Analyze place distribution for logging
  Map<String, int> _analyzeDistribution(List<Place> places) {
    final distribution = <String, int>{};
    for (final place in places) {
      final type = place.type.toLowerCase();
      if (type.contains('restaurant') || type.contains('food')) {
        distribution['restaurants'] = (distribution['restaurants'] ?? 0) + 1;
      } else if (type.contains('museum') || type.contains('gallery')) {
        distribution['culture'] = (distribution['culture'] ?? 0) + 1;
      } else if (type.contains('park') || type.contains('nature')) {
        distribution['nature'] = (distribution['nature'] ?? 0) + 1;
      } else if (type.contains('bar') || type.contains('nightlife')) {
        distribution['nightlife'] = (distribution['nightlife'] ?? 0) + 1;
      } else if (type.contains('cafe') || type.contains('coffee')) {
        distribution['cafes'] = (distribution['cafes'] ?? 0) + 1;
      } else {
        distribution['attractions'] = (distribution['attractions'] ?? 0) + 1;
      }
    }
    return distribution;
  }
  
  // Travel Style Methods
  Future<bool> updateTravelStyle(TravelStyle style) async {
    if (_currentUser == null) return false;
    
    try {
      final updatedUser = _currentUser!.copyWith(travelStyle: style);
      await _storageService.saveUser(updatedUser);
      _currentUser = updatedUser;
      
      // Track the style selection
      await _usageTrackingService.trackCategorySelected('travel_style_${style.name}');
      
      print('✅ Travel style updated to: ${style.displayName}');
      notifyListeners();
      return true;
    } catch (e) {
      print('❌ Error updating travel style: $e');
      return false;
    }
  }
  
  TravelStyle? get userTravelStyle => _currentUser?.travelStyle;

  // Load places in sections
  Future<void> loadPlaceSections() async {
    if (!_isAppActive || _currentLocation == null) {
      print('🚫 Skipping sections load - app inactive or no location');
      return;
    }
    
    _isSectionsLoading = true;
    notifyListeners();
    
    try {
      final sections = await Future.wait([
        _loadFoodAndDrink(),
        _loadLandmarksAndAttractions(),
        _loadCultureAndMuseums(),
        _loadOutdoorAndNature(),
        _loadShoppingAndMarkets(),
      ]);
      
      _placeSections = sections.where((s) => s.places.isNotEmpty).toList();
      print('✅ Loaded ${_placeSections.length} place sections');
    } catch (e) {
      print('❌ Error loading place sections: $e');
    } finally {
      _isSectionsLoading = false;
      notifyListeners();
    }
  }
  
  Future<PlaceSection> _loadFoodAndDrink() async {
    final places = await _fetchPlacesForSection('restaurants cafes bars coffee shops', 5);
    return PlaceSection(
      id: 'food',
      title: 'Food & Drink',
      subtitle: 'Restaurants, cafes, bars, coffee shops',
      emoji: '🍽️',
      places: places,
      category: 'food',
      query: 'restaurants cafes bars coffee shops',
    );
  }
  
  Future<PlaceSection> _loadLandmarksAndAttractions() async {
    final places = await _fetchPlacesForSection('tourist attractions monuments historical sites landmarks', 5);
    return PlaceSection(
      id: 'landmarks',
      title: 'Landmarks & Attractions',
      subtitle: 'Tourist attractions, monuments, historical sites',
      emoji: '🏛️',
      places: places,
      category: 'landmarks',
      query: 'tourist attractions monuments historical sites landmarks',
    );
  }
  
  Future<PlaceSection> _loadCultureAndMuseums() async {
    final places = await _fetchPlacesForSection('museums art galleries cultural centers theaters', 5);
    return PlaceSection(
      id: 'culture',
      title: 'Culture & Museums',
      subtitle: 'Museums, art galleries, cultural centers',
      emoji: '🎨',
      places: places,
      category: 'culture',
      query: 'museums art galleries cultural centers theaters',
    );
  }
  
  Future<PlaceSection> _loadOutdoorAndNature() async {
    final places = await _fetchPlacesForSection('parks gardens hiking trails nature spots', 5);
    return PlaceSection(
      id: 'nature',
      title: 'Outdoor & Nature',
      subtitle: 'Parks, gardens, hiking trails, nature spots',
      emoji: '🌳',
      places: places,
      category: 'nature',
      query: 'parks gardens hiking trails nature spots',
    );
  }
  
  Future<PlaceSection> _loadShoppingAndMarkets() async {
    final places = await _fetchPlacesForSection('shopping malls local markets bazaars shops', 5);
    return PlaceSection(
      id: 'shopping',
      title: 'Shopping & Markets',
      subtitle: 'Shopping malls, local markets, bazaars',
      emoji: '🛍️',
      places: places,
      category: 'shopping',
      query: 'shopping malls local markets bazaars shops',
    );
  }
  
  Future<List<Place>> _fetchPlacesForSection(String query, int count) async {
    try {
      final placesService = PlacesService();
      final places = await placesService.fetchPlacesPipeline(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        query: query,
        radius: _selectedRadius,
        topN: count,
      );
      
      // Filter by rating and add distance
      final filteredPlaces = places.where((p) => p.rating >= 3.5).toList();
      
      // Add distance info
      for (int i = 0; i < filteredPlaces.length; i++) {
        final place = filteredPlaces[i];
        final distance = Geolocator.distanceBetween(
          _currentLocation!.latitude,
          _currentLocation!.longitude,
          place.latitude ?? 0.0,
          place.longitude ?? 0.0,
        );
        final distanceKm = (distance / 1000).toStringAsFixed(1);
        
        filteredPlaces[i] = Place(
          id: place.id,
          name: place.name,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          rating: place.rating,
          type: place.type,
          photoUrl: place.photoUrl,
          description: '${place.description} • ${distanceKm}km away',
          localTip: place.localTip,
          handyPhrase: place.handyPhrase,
          phoneNumber: place.phoneNumber,
          website: place.website,
        );
      }
      
      return filteredPlaces.take(count).toList();
    } catch (e) {
      print('❌ Error fetching places for section: $e');
      return [];
    }
  }
  
  // Load more places for a specific section
  Future<List<Place>> loadMoreForSection(String sectionId, int page) async {
    final section = _placeSections.firstWhere((s) => s.id == sectionId);
    final places = await _fetchPlacesForSection(section.query, 10);
    return places;
  }

  Future<void> searchPlaces(String query) async {
    print('🔍 searchPlaces called with: "$query"');
    
    if (query.isEmpty) {
      // Empty search - reload sections
      await loadPlaceSections();
      return;
    }
    
    if (query.length < 2) {
      print('⚠️ Search query too short: $query');
      return;
    }
    
    // Enhance search with keyword expansion and location context
    String enhancedQuery = _expandKeywords([query]);
    if (!enhancedQuery.toLowerCase().contains('near') && !enhancedQuery.toLowerCase().contains('in')) {
      enhancedQuery = '$enhancedQuery near me';
    }
    
    print('🔍 Enhanced query: "$enhancedQuery"');
    await loadNearbyPlaces(searchQuery: enhancedQuery);
  }

  Future<void> performInstantSearch(String query) async {
    print('🔍 performInstantSearch called with: "$query"');
    await searchPlaces(query);
  }

  Future<void> clearSearchAndShowSections() async {
    print('🔄 clearSearchAndShowSections called');
    await loadPlaceSections();
  }

  void setSelectedRadius(int radius) {
    _selectedRadius = radius;
    SettingsService.setSearchRadius(radius);
    _storageService.setSelectedRadius(radius);
    notifyListeners();
    loadNearbyPlaces();
  }

  // Trip Methods
  Future<void> loadTripPlans() async {
    _isTripsLoading = true;
    notifyListeners();

    try {
      // Always load from cache first
      final cachedPlans = await _storageService.getTripPlans();
      final cachedItineraries = await _storageService.getItineraries();
      
      _tripPlans = cachedPlans;
      _itineraries = cachedItineraries ?? [];
      
      print('💾 Loaded ${cachedPlans.length} trip plans from cache');
      print('💾 Loaded ${_itineraries.length} itineraries from cache');
      
      // Try to sync with backend if user is logged in (but don't overwrite cache on failure)
      if (_currentUser?.mongoId != null) {
        try {
          final backendPlans = await _apiService.getUserTripPlans(_currentUser!.mongoId!);
          if (backendPlans.isNotEmpty) {
            // Merge backend and local plans (keep all unique plans)
            final allPlans = <TripPlan>[];
            final seenIds = <String>{};
            
            // Add backend plans first
            for (final plan in backendPlans) {
              if (!seenIds.contains(plan.id)) {
                allPlans.add(plan);
                seenIds.add(plan.id);
              }
            }
            
            // Add local plans that aren't in backend
            for (final plan in cachedPlans) {
              if (!seenIds.contains(plan.id)) {
                allPlans.add(plan);
                seenIds.add(plan.id);
              }
            }
            
            _tripPlans = allPlans;
            print('🌍 Merged: ${backendPlans.length} backend + ${cachedPlans.length} local = ${allPlans.length} total plans');
          } else {
            print('🌍 Backend returned 0 plans, keeping ${cachedPlans.length} cached plans');
          }
        } catch (e) {
          print('⚠️ Backend sync failed, using ${cachedPlans.length} cached plans: $e');
        }
      }
    } catch (e) {
      print('❌ Error loading trip plans: $e');
    } finally {
      _isTripsLoading = false;
      notifyListeners();
    }
  }

  Future<void> saveTripPlan(TripPlan tripPlan) async {
    print('🔍 DEBUG: Saving trip plan: ${tripPlan.tripTitle}');
    await _storageService.saveTripPlan(tripPlan);
    
    if (_currentUser?.mongoId != null) {
      await _apiService.saveTripPlan(_currentUser!.mongoId!, tripPlan);
    }
    
    _tripPlans.add(tripPlan);
    print('🔍 DEBUG: Trip plan added to list. Total plans: ${_tripPlans.length}');
    notifyListeners();
  }

  Future<void> deleteTripPlan(String tripPlanId) async {
    await _storageService.deleteTripPlan(tripPlanId);
    await _apiService.deleteTripPlan(tripPlanId);
    
    _tripPlans.removeWhere((trip) => trip.id == tripPlanId);
    notifyListeners();
  }

  // Home Screen Methods
  Future<void> _loadWeatherData() async {
    if (_currentLocation != null) {
      final weather = await _weatherService.getCurrentWeather(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude
      );
      _weatherInfo = weather.toModelWeatherInfo();
      notifyListeners();
    }
  }

  Future<void> loadHomeScreenData() async {
    try {
      _isHomeLoading = true;
      notifyListeners();

      await _loadWeatherData();

      if (_currentLocation != null) {
        final discoveries = await _localDiscoveriesService.discover(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude
        );
        _localDiscoveries = discoveries.isEmpty ? null : discoveries[0].toModelLocalDiscovery();
      }

      // Load personalized suggestions
      if (_currentUser != null && _currentLocation != null) {
        final suggestions = await _apiService.getPersonalizedSuggestions(
          userId: _currentUser!.uid!,
          interests: _currentUser!.selectedInterests?.map((i) => i.toString().split('.').last).toList() ?? [],
          location: _currentLocation!
        );
        _suggestions = suggestions.map((s) => PersonalizedSuggestion.fromJson(s)).toList();
      }

      debugPrint('✅ Loaded home screen data');
    } catch (e) {
      debugPrint('❌ Error loading home data: $e');
    } finally {
      _isHomeLoading = false;
      notifyListeners();
    }
  }

  String _getCurrentTimeOfDay() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  // Deals Methods
  Future<void> loadDeals() async {
    _isDealsLoading = true;
    _dealsError = null;
    notifyListeners();

    try {
      List<Deal> deals = [];
      
      // Skip real API for now - endpoint not available
      print('⚠️ Skipping real deals API - endpoint not implemented');
      
      // Skip fallback deals service too - not needed for places-based deals page
      print('⚠️ Skipping fallback deals service - using places data instead');
      _deals = [];
      
    } catch (e) {
      print('❌ Error loading deals: $e');
      _dealsError = 'Failed to load deals: ${e.toString()}';
      // Final fallback to inline mock deals
      _deals = [
        Deal(
          id: 'mock_deal_1',
          title: '50% Off Local Restaurant',
          description: 'Great dining experience with local cuisine',
          discount: '50% OFF',
          placeName: 'Local Bistro',
          businessType: 'restaurant',
          businessName: 'Local Bistro',
          images: ['https://via.placeholder.com/300x200'],
          validUntil: DateTime.now().add(const Duration(days: 7)),
          views: 150,
          claims: 12,
          price: PriceInfo(amount: 25.0, currencyCode: 'USD'),
        ),
      ];
      print('🎭 Loaded final fallback mock deals');
    } finally {
      _isDealsLoading = false;
      notifyListeners();
    }
  }
  
  Future<List<Deal>> getMyDeals() async {
    if (_currentUser?.mongoId == null) return [];
    
    try {
      return await _apiService.getMyDeals(_currentUser!.mongoId!);
    } catch (e) {
      print('❌ Error loading my deals: $e');
      return [];
    }
  }
  
  Future<bool> claimDeal(String dealId) async {
    try {
      // Try real API first
      bool success = false;
      if (_currentUser?.mongoId != null) {
        success = await _apiService.claimDealReal(dealId, _currentUser!.mongoId!);
        if (success) {
          print('✅ Deal claimed via real API');
        }
      }
      
      // Fallback to existing service
      if (!success) {
        success = await DealsService.claimDeal(dealId);
      }
      
      if (success) {
        // Update local deal claims count
        final dealIndex = _deals.indexWhere((d) => d.id == dealId);
        if (dealIndex != -1) {
          final updatedDeal = Deal(
            id: _deals[dealIndex].id,
            title: _deals[dealIndex].title,
            description: _deals[dealIndex].description,
            discount: _deals[dealIndex].discount,
            placeName: _deals[dealIndex].placeName,
            businessType: _deals[dealIndex].businessType,
            businessName: _deals[dealIndex].businessName,
            images: _deals[dealIndex].images,
            validUntil: _deals[dealIndex].validUntil,
            isActive: _deals[dealIndex].isActive,
            views: _deals[dealIndex].views,
            claims: _deals[dealIndex].claims + 1,
            merchantId: _deals[dealIndex].merchantId,
            price: _deals[dealIndex].price,
            isPremium: _deals[dealIndex].isPremium,
          );
          _deals[dealIndex] = updatedDeal;
          notifyListeners();
        }
        
        await _notificationService.showLocalNotification(
          'Deal Claimed!',
          'You have successfully claimed this deal',
        );
      }
      return success;
    } catch (e) {
      print('❌ Error claiming deal: $e');
      return false;
    }
  }

  // Trip Plan Generation
  Future<TripPlan?> generateTripPlan({
    required String destination,
    required String duration,
    required String interests,
    String pace = 'Moderate',
    List<String> travelStyles = const [],
    String budget = 'Mid-Range',
  }) async {
    _isTripsLoading = true;
    notifyListeners();

    try {
      final tripPlan = await _aiService.generateSmartTripPlan(
        destination: destination,
        duration: duration,
        interests: interests,
        pace: pace,
        travelStyles: travelStyles,
        budget: budget,
      );
      
      if (tripPlan != null) {
        await saveTripPlan(tripPlan);
        await _notificationService.showLocalNotification(
          'Trip Plan Ready!',
          'Your ${tripPlan.tripTitle} has been generated successfully',
        );
        print('✅ Generated and saved trip plan: ${tripPlan.tripTitle}');
        return tripPlan;
      }
      return null;
    } catch (e) {
      print('❌ Error generating trip plan: $e');
      return null;
    } finally {
      _isTripsLoading = false;
      notifyListeners();
    }
  }

  Future<OneDayItinerary?> generateDayItinerary({
    required String location,
    required String interests,
  }) async {
    _isTripsLoading = true;
    notifyListeners();

    try {
      final itinerary = await _aiService.generateDayItinerary(
        location: location,
        interests: interests,
        nearbyPlaces: _places,
      );
      
      if (itinerary != null) {
        _itineraries.add(itinerary);
        await _storageService.saveItinerary(itinerary);
        print('✅ Generated day itinerary for $location');
        notifyListeners();
        return itinerary;
      }
      return null;
    } catch (e) {
      print('❌ Error generating day itinerary: $e');
      return null;
    } finally {
      _isTripsLoading = false;
      notifyListeners();
    }
  }

  Future<String> getPlaceDescription(Place place) async {
    try {
      return await _aiService.generatePlaceDescription(place);
    } catch (e) {
      print('❌ Error getting place description: $e');
      return 'This location offers a unique experience for visitors to explore and enjoy.';
    }
  }

  // Settings Methods
  void toggleDarkMode() {
    _isDarkMode = !_isDarkMode;
    SettingsService.setDarkMode(_isDarkMode);
    notifyListeners();
  }

  void setNotifications(bool enabled) async {
    _notificationsEnabled = enabled;
    SettingsService.setNotifications(enabled);
    if (enabled) {
      await _notificationService.requestPermission();
    }
    notifyListeners();
  }

  void setDealAlerts(bool enabled) {
    _dealAlertsEnabled = enabled;
    SettingsService.setDealAlerts(enabled);
    notifyListeners();
  }

  // Cache Methods
  Future<void> clearCache() async {
    await _storageService.clearCache();
    _places.clear();
    _favoritePlaces.clear();
    _tripPlans.clear();
    _deals.clear();
    debugPrint('🧹 Cache cleared - will fetch fresh places');
    notifyListeners();
  }

  Future<void> forceRefreshPlaces() async {
    debugPrint('🔄 Force refresh places - bypassing cache and updating location');
    
    // Clear current places
    _places.clear();
    _currentPage = 1;
    _hasMorePlaces = true;
    
    // Force location update first
    await getCurrentLocation();
    
    // Reset last known location to force fresh load
    _lastKnownLocation = null;
    
    // Load fresh places
    await loadNearbyPlaces();
  }

  // Private Methods
  void _loadSettings() {
    _isDarkMode = SettingsService.isDarkMode;
    _notificationsEnabled = SettingsService.notificationsEnabled;
    _dealAlertsEnabled = SettingsService.dealAlertsEnabled;
    _selectedRadius = SettingsService.searchRadius;
    notifyListeners();
  }

  Future<void> _loadUserData() async {
    final user = await _authService.getCurrentUser();
    if (user != null) {
      _currentUser = user;
      _isAuthenticated = true;
      
      // Load user-specific data
      try {
        final favorites = await _storageService.getFavorites();
        _favoriteIds = ErrorHandlerService.safeListCast<String>(favorites, 'loadUserData - favorites');
        await _updateFavoritePlaces();
        await loadTripPlans();
      } catch (e) {
        ErrorHandlerService.handleError('loadUserData', e, null);
        _favoriteIds = [];
      }
    }
  }

  Future<void> _loadCachedData() async {
    try {
      // Load trip plans and itineraries
      await loadTripPlans();
      final loadedItineraries = await _storageService.getItineraries();
      _itineraries = loadedItineraries ?? [];
      
      print('📱 Loaded ${_tripPlans.length} trip plans and ${_itineraries.length} itineraries');
      print('🔍 DEBUG: Trip plans: ${_tripPlans.map((t) => t.tripTitle).join(", ")}');
      print('🔍 DEBUG: Itineraries: ${_itineraries.map((i) => i.title).join(", ")}');
    } catch (e) {
      print('Error loading cached data: $e');
      _tripPlans = [];
      _itineraries = [];
    }
    notifyListeners();
  }

  Future<void> _updateFavoritePlaces() async {
    _favoritePlaces = _places.where((place) => _favoriteIds.contains(place.id)).toList();
  }
  
  // AI Enrichment with caching
  Future<List<Place>> _enrichPlacesWithAI(List<Place> places) async {
    if (places.isEmpty) return places;
    
    try {
      // Check cache first
      final cachedPlaces = await _checkEnrichmentCache(places);
      final uncachedPlaces = places.where((p) => !cachedPlaces.containsKey(p.id)).toList();
      
      // Batch enrich uncached places
      if (uncachedPlaces.isNotEmpty) {
        final enrichedPlaces = await _batchEnrichPlaces(uncachedPlaces);
        
        // Cache newly enriched places
        for (final enriched in enrichedPlaces) {
          await _storageService.cacheEnrichedPlace(enriched);
        }
        
        // Merge cached and newly enriched
        final allEnriched = <String, Place>{};
        allEnriched.addAll(cachedPlaces);
        for (final enriched in enrichedPlaces) {
          allEnriched[enriched.id] = enriched;
        }
        
        return places.map((p) => allEnriched[p.id] ?? p).toList();
      }
      
      return places.map((p) => cachedPlaces[p.id] ?? p).toList();
    } catch (e) {
      print('❌ AI enrichment failed: $e');
      return places;
    }
  }
  
  Future<Map<String, Place>> _checkEnrichmentCache(List<Place> places) async {
    final cached = <String, Place>{};
    for (final place in places) {
      final cachedPlace = await _storageService.getCachedEnrichedPlace(place.id);
      if (cachedPlace != null) {
        cached[place.id] = cachedPlace;
      }
    }
    return cached;
  }
  
  Future<List<Place>> _batchEnrichPlaces(List<Place> places) async {
    // Batch process up to 5 places at once for performance
    final batchSize = 5;
    final enriched = <Place>[];
    
    for (int i = 0; i < places.length; i += batchSize) {
      final batch = places.skip(i).take(batchSize).toList();
      final batchEnriched = await Future.wait(
        batch.map((place) => _enrichSinglePlace(place))
      );
      enriched.addAll(batchEnriched);
    }
    
    return enriched;
  }
  
  Future<Place> _enrichSinglePlace(Place place) async {
    try {
      // Check if AI content exists in backend cache
      final cachedContent = await _apiService.getPlaceAIContent(place.id);
      
      String description = place.description;
      String localTip = 'Check opening hours before visiting.';
      String handyPhrase = _generateHandyPhrase(place.type);
      
      if (cachedContent != null) {
        // Use cached AI content from backend
        description = cachedContent['description']?.isNotEmpty == true 
            ? cachedContent['description']! : description;
        localTip = cachedContent['localTip']?.isNotEmpty == true 
            ? cachedContent['localTip']! : localTip;
        handyPhrase = cachedContent['handyPhrase']?.isNotEmpty == true 
            ? cachedContent['handyPhrase']! : handyPhrase;
        print('✅ Used cached AI content for ${place.name}');
      } else {
        // Generate new AI content and cache it
        final aiDescription = await _aiService.generatePlaceDescription(place);
        final aiLocalTip = await _aiService.generateLocalTip(place);
        
        if (aiDescription.isNotEmpty) description = aiDescription;
        if (aiLocalTip.isNotEmpty) localTip = aiLocalTip;
        
        // Cache the generated content in backend
        await _apiService.cacheAIContent(
          place.id,
          description: aiDescription,
          localTip: aiLocalTip,
          handyPhrase: handyPhrase,
        );
        print('✅ Generated and cached AI content for ${place.name}');
      }
      
      return Place(
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        type: place.type,
        photoUrl: place.photoUrl,
        description: description,
        localTip: localTip,
        handyPhrase: handyPhrase,
        phoneNumber: place.phoneNumber,
        website: place.website,
      );
    } catch (e) {
      print('❌ Failed to enrich place ${place.name}: $e');
      return place;
    }
  }
  
  String _generateHandyPhrase(String placeType) {
    final phrases = {
      'restaurant': 'Table for two, please',
      'museum': 'What time do you close?',
      'hotel': 'Do you have availability?',
      'attraction': 'How much is admission?',
      'shop': 'Do you accept credit cards?',
    };
    
    for (final key in phrases.keys) {
      if (placeType.toLowerCase().contains(key)) {
        return phrases[key]!;
      }
    }
    
    return 'Hello, thank you!';
  }






  
  // Refresh data after app was inactive
  Future<void> _refreshDataAfterInactivity() async {
    try {
      // Only refresh if we have location and app is active
      if (_currentLocation != null && _isAppActive) {
        // Check if we need fresh data (cache expired)
        final needsRefresh = await _checkIfDataNeedsRefresh();
        if (needsRefresh) {
          print('🔄 Refreshing stale data after inactivity');
          await Future.wait([
            loadNearbyPlaces(),
          ]);
        } else {
          print('💾 Data still fresh - using cache');
        }
      }
    } catch (e) {
      print('❌ Error refreshing data after inactivity: $e');
    }
  }
  
  // Check if cached data is stale and needs refresh
  Future<bool> _checkIfDataNeedsRefresh() async {
    if (_currentLocation == null) return false;
    
    // Check if we have valid cached data
    final cachedData = await _storageService.getCachedPlacesForLocation(
      _currentLocation!.latitude,
      _currentLocation!.longitude,
      _selectedCategory,
      maxAgeHours: 2, // More lenient for background refresh
      maxDistanceKm: 5.0,
    );
    
    return cachedData.isEmpty; // Refresh if no valid cache
  }
  
  // Track last location for change detection
  Position? _lastKnownLocation;
  
  // Check if user has moved significantly since last places load
  Future<bool> _hasLocationChangedSignificantly() async {
    if (_currentLocation == null || _lastKnownLocation == null) {
      _lastKnownLocation = _currentLocation;
      return false;
    }
    
    final distance = Geolocator.distanceBetween(
      _lastKnownLocation!.latitude,
      _lastKnownLocation!.longitude,
      _currentLocation!.latitude,
      _currentLocation!.longitude,
    );
    
    // Consider significant if moved >1km
    final hasChanged = distance > 1000;
    
    if (hasChanged) {
      print('📍 Location changed: ${(distance/1000).toStringAsFixed(1)}km from last position');
      _lastKnownLocation = _currentLocation; // Update last known position
    }
    
    return hasChanged;
  }
}