import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math' as math;
import 'dart:async';
import '../config/environment.dart';
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
import '../services/auth_api_service.dart';
import '../services/notification_service.dart';
import '../services/analytics_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/storage_service.dart';
import '../services/location_service.dart';
import '../services/permission_service.dart';
import '../services/local_discoveries_service.dart' as discoveries_service;
import '../services/weather_service.dart' as weather_service;
import '../services/places_service.dart';
import '../services/ai_service.dart';
import '../services/image_service.dart';
import '../services/settings_service.dart';
import '../services/error_handler_service.dart';
import '../services/usage_tracking_service.dart';
import '../services/recommendation_engine.dart';
import '../services/real_local_discoveries_service.dart';
import '../services/deals_service.dart';
import '../services/payment_service.dart';
import '../services/real_data_service.dart';
import '../services/trip_plans_api_service.dart';
import '../services/trip_analytics_service.dart';
import '../services/offline_manager.dart';
import '../services/token_refresh_service.dart';
import '../services/battery_optimization_service.dart';
import '../services/memory_profiler.dart';
import '../services/rate_limiter.dart';
import '../models/travel_style.dart';
import '../models/place_section.dart';
import '../utils/user_converter.dart';
import '../utils/debug_logger.dart';
import '../utils/place_ranker.dart';




class AppProvider with ChangeNotifier, WidgetsBindingObserver {
  // Services (AuthService is now static)
  final ApiService _apiService = ApiService();
  final AuthApiService _authApiService = AuthApiService();
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
  final TokenRefreshService _tokenRefreshService = TokenRefreshService();
  final BatteryOptimizationService _batteryService = BatteryOptimizationService();
  final MemoryProfiler _memoryProfiler = MemoryProfiler();
  final RateLimiter _rateLimiter = RateLimiter();

  
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
  int _selectedRadius = 5000; // Reduced from 20km to 5km for cost savings
  bool _hasMorePlaces = true;
  int _currentPage = 1;
  bool _showFavoritesOnly = false;
  bool _useRealPlaces = true; // true = Google Places, false = AI Places

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
  bool get showFavoritesOnly => _showFavoritesOnly;
  bool get useRealPlaces => _useRealPlaces;
  
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
        DebugLogger.log('📱 App resumed - API calls enabled');
        
        // Refresh data if app was inactive for more than 5 minutes
        if (wasInactive) {
          DebugLogger.log('🔄 App was inactive for >5min - refreshing data');
          _refreshDataAfterInactivity();
        }
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        _isAppActive = false;
        DebugLogger.log('📱 App inactive - API calls disabled');
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
      DebugLogger.info('🚀 Initializing Travel Buddy Mobile...');
      
      // Register app lifecycle observer
      WidgetsBinding.instance.addObserver(this);
      _isAppActive = true;
      _lastActiveTime = DateTime.now();
      
      // Initialize storage service FIRST
      await _storageService.initialize();
      DebugLogger.log('✅ Storage service initialized');
      
      // Start security services
      _tokenRefreshService.startAutoRefresh();
      DebugLogger.log('✅ Token refresh service started');
      
      // Start performance monitoring
      _memoryProfiler.startMonitoring();
      DebugLogger.log('✅ Memory profiler started');
      
      // Load cached data IMMEDIATELY - this makes data available offline
      await _loadCachedData();
      DebugLogger.log('✅ Cached data loaded EARLY');
      
      // Show cached data immediately
      notifyListeners();
      
      // Initialize other services
      _aiService.initialize();
      _imageService.initialize();
      await _notificationService.initialize();
      await SettingsService.initialize();
      await _usageTrackingService.initialize();
      
      // Load settings
      _loadSettings();
      DebugLogger.log('✅ Services initialized');

      // Load user data
      await _loadUserData();
      DebugLogger.log('✅ User data loaded');
      
      // Load location (only if app is active) with battery optimization
      if (_isAppActive) {
        await getCurrentLocation();
      }
      
      DebugLogger.log('✅ App initialization complete');
      
    } catch (e) {
      DebugLogger.error('Error initializing app: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tokenRefreshService.dispose();
    _batteryService.dispose();
    _memoryProfiler.dispose();
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
      // No fallback - set to null if all services fail
      _localDiscoveries = null;
    }
  }

  Future<void> _loadWeatherInfo() async {
    if (_currentLocation != null) {
      try {
        final response = await http.get(
          Uri.parse('${Environment.backendUrl}/api/weather/current?lat=${_currentLocation!.latitude}&lng=${_currentLocation!.longitude}'),
        );
        
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          _weatherInfo = WeatherInfo(
            displayText: '${(data['temperature'] as num).round()}°C',
            temperature: (data['temperature'] as num).toDouble(),
            condition: data['condition'] ?? 'sunny',
            humidity: (data['humidity'] as num?)?.toDouble() ?? 65.0,
            windSpeed: (data['windSpeed'] as num?)?.toDouble() ?? 12.0,
            description: data['condition'] ?? 'sunny',
          );
          print('✅ Loaded REAL weather from Google API');
        }
      } catch (e) {
        print('❌ Weather API error: $e');
        final weather = await _weatherService.getCurrentWeather(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
        );
        _weatherInfo = weather.toModelWeatherInfo();
      }
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
      // No fallback - leave empty
      _dailySuggestions = [];
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
      // Get real travel stats from backend
      final backendStats = await _apiService.getUserTravelStats();
      if (backendStats != null) {
        _travelStats = backendStats;
        print('✅ Loaded REAL travel stats from backend: ${_travelStats!.totalPlacesVisited} places');
        return;
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
      await _apiService.updateUserTravelStats(_travelStats!);
      print('✅ Synced travel stats to backend');
      
      print('✅ Loaded travel stats: ${_travelStats!.totalPlacesVisited} interactions');
    } catch (e) {
      print('❌ Error loading travel stats: $e');
      _travelStats = null;
    }
  }
  static const int _placesPerPage = 30; // Further increased to show more places per page



  // Authentication Methods
  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      // Ensure storage is initialized first
      await _storageService.initialize();
      
      final userCredential = await AuthService.signInWithEmail(email, password);
      final user = userCredential.user;
      if (user != null) {
        _currentUser = UserConverter.fromFirebaseUser(user);
        _isAuthenticated = true;
        
        // Sync with backend using Firebase token
        await _syncFirebaseUserWithBackend(user);
        await _loadUserData();
        
        // Send FCM token to backend
        await _sendFCMTokenToBackend();
        
        // Track login
        AnalyticsService.logLogin('email');
        AnalyticsService.setUserId(user.uid);
        
        return true;
      }
      return false;
    } catch (e) {
      print('Sign in error: $e');
      AnalyticsService.logError('Sign in failed', error: e);
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
      await _storageService.initialize();
      
      final userCredential = await AuthService.signInWithGoogle();
      if (userCredential == null) return false;
      
      final user = userCredential.user;
      if (user != null) {
        _currentUser = UserConverter.fromFirebaseUser(user);
        _isAuthenticated = true;
        
        await _syncFirebaseUserWithBackend(user);
        await _loadUserData();
        await _sendFCMTokenToBackend();
        
        AnalyticsService.logLogin('google');
        AnalyticsService.setUserId(user.uid);
        
        return true;
      }
      return false;
    } catch (e) {
      print('Google Sign in error: $e');
      AnalyticsService.logError('Google Sign in failed', error: e);
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
      
      final userCredential = await AuthService.registerWithEmail(email, password, username);
      final user = userCredential.user;
      if (user != null) {
        _currentUser = UserConverter.fromFirebaseUser(user);
        _isAuthenticated = true;
        
        // Sync with backend using Firebase token
        await _syncFirebaseUserWithBackend(user);
        
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



  Future<void> signOut() async {
    await AuthService.signOut();
    _currentUser = null;
    _isAuthenticated = false;
    _places.clear();
    _favoritePlaces.clear();
    _favoriteIds.clear();
    _tripPlans.clear();
    _itineraries.clear();
    _deals.clear();
    
    // Clear all caches on logout
    final placesService = PlacesService();
    await placesService.clearOfflineStorage();
    placesService.clearCache();
    placesService.resetApiCounter();
    
    // Clear trip plans, deals, and user cache
    await OfflineManager.clearCache();
    
    print('✅ Cleared all caches and reset API counter on logout');
    
    notifyListeners();
  }

  Future<bool> updateUserProfile({
    String? username,
    String? fullName,
    String? phone,
    String? email,
    String? bio,
    String? website,
    String? location,
    String? homeCity,
    String? birthday,
    List<String>? languages,
    List<String>? interests,
    List<String>? budgetPreferences,
    bool? showBirthdayToOthers,
    bool? showLocationToOthers,
    String? profilePicture,
    String? status,
  }) async {
    try {
      if (_currentUser == null) {
        print('❌ No current user to update');
        return false;
      }
      
      print('🔄 Updating profile with:');
      print('  - username: $username');
      print('  - bio: $bio');
      print('  - website: $website');
      print('  - location: $location');
      print('  - birthday: $birthday');
      print('  - languages: $languages');
      print('  - interests: $interests');
      print('  - budgetPreferences: $budgetPreferences');
      print('  - showBirthdayToOthers: $showBirthdayToOthers');
      print('  - showLocationToOthers: $showLocationToOthers');
      print('  - status: $status');

      // Update current user locally first
      _currentUser = _currentUser!.copyWith(
        username: username ?? _currentUser?.username,
        fullName: fullName ?? _currentUser?.fullName,
        phone: phone ?? _currentUser?.phone,
        email: email ?? _currentUser?.email,
        bio: bio ?? _currentUser?.bio,
        website: website ?? _currentUser?.website,
        location: location ?? _currentUser?.location,
        homeCity: homeCity ?? _currentUser?.homeCity,
        birthday: birthday ?? _currentUser?.birthday,
        languages: languages ?? _currentUser?.languages,
        interests: interests ?? _currentUser?.interests,
        budgetPreferences: budgetPreferences ?? _currentUser?.budgetPreferences,
        showBirthdayToOthers: showBirthdayToOthers ?? _currentUser?.showBirthdayToOthers,
        showLocationToOthers: showLocationToOthers ?? _currentUser?.showLocationToOthers,
        profilePicture: profilePicture ?? _currentUser?.profilePicture,
        status: status ?? _currentUser?.status,
      );
      
      // Save to local storage
      await _storageService.saveUser(_currentUser!);
      
      // Try to update Firebase profile
      try {
        await AuthService.updateUserProfile(
          displayName: username,
          photoURL: profilePicture,
        );
        print('✅ Firebase profile updated');
      print('✅ Local user updated: ${_currentUser!.username}');
      print('🔍 VERIFICATION: Current user fields after update:');
      print('  - username: ${_currentUser!.username}');
      print('  - bio: ${_currentUser!.bio}');
      print('  - website: ${_currentUser!.website}');
      print('  - location: ${_currentUser!.location}');
      print('  - birthday: ${_currentUser!.birthday}');
      print('  - languages: ${_currentUser!.languages}');
      print('  - interests: ${_currentUser!.interests}');
      print('  - budgetPreferences: ${_currentUser!.budgetPreferences}');
      print('  - showBirthdayToOthers: ${_currentUser!.showBirthdayToOthers}');
      print('  - showLocationToOthers: ${_currentUser!.showLocationToOthers}');
      print('  - status: ${_currentUser!.status}');
      } catch (e) {
        print('⚠️ Firebase update failed: $e');
        // Continue - local update succeeded
      }
      
      // Sync all profile data to backend
      await _syncProfileToBackend({
        'username': username,
        'fullName': fullName,
        'phone': phone,
        'email': email,
        'bio': bio,
        'website': website,
        'location': location,
        'homeCity': homeCity,
        'birthday': birthday,
        'languages': languages,
        'interests': interests,
        'budgetPreferences': budgetPreferences,
        'showBirthdayToOthers': showBirthdayToOthers,
        'showLocationToOthers': showLocationToOthers,
        'profilePicture': profilePicture,
        'status': status,
      });
      
      notifyListeners();
      return true;
    } catch (e) {
      print('❌ Error updating user profile: $e');
      return false;
    }
  }

  Future<void> _syncProfileToBackend(Map<String, dynamic> profileData) async {
    try {
      final cleanData = <String, dynamic>{};
      profileData.forEach((key, value) {
        if (value != null) cleanData[key] = value;
      });
      
      if (cleanData.isEmpty) return;
      
      print('🔄 Syncing to backend: ${cleanData.keys.join(", ")}');
      
      try {
        await _apiService.updateUserProfile(cleanData);
        print('✅ Profile synced to backend successfully');
      } catch (e) {
        print('❌ Backend sync error: $e');
      }
    } catch (e) {
      print('❌ Backend sync failed: $e');
    }
  }

  Future<bool> deleteUserAccount() async {
    try {
      return await _apiService.deleteUser();
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
      
      await _notificationService.showNotification(
        title: 'Subscription Updated!',
        body: message,
      );
      
      return true;
    } catch (e) {
      print('Error updating subscription: $e');
      return false;
    }
  }
  
  Future<bool> _syncSubscriptionWithBackend(SubscriptionTier tier, bool isFreeTrial) async {
    try {
      final response = await _apiService.updateUserSubscription({
        'tier': tier.name,
        'status': isFreeTrial ? 'trial' : 'active',
        'trialEndDate': isFreeTrial ? DateTime.now().add(const Duration(days: 7)).toIso8601String() : null,
        'subscriptionEndDate': !isFreeTrial ? DateTime.now().add(const Duration(days: 30)).toIso8601String() : null,
      });
      
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

      // Use battery-efficient location service
      final position = await _batteryService.getLocationEfficient();
      if (position != null) {
        _currentLocation = position;
        _locationError = null;
        print('📍 Location obtained (battery-efficient)');
      } else {
        _locationError = 'Unable to get current location. Please check location permissions and GPS.';
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
    
    // Cache disabled - always fetch fresh data
    // if (!loadMore && searchQuery.isEmpty && !locationChanged) {
    //   final cachedData = await _storageService.getCachedPlacesForLocation(
    //     _currentLocation!.latitude,
    //     _currentLocation!.longitude,
    //     _selectedCategory,
    //     maxAgeHours: 0.5,
    //     maxDistanceKm: 1.0,
    //   );
    //   
    //   if (cachedData.isNotEmpty) {
    //     print('💾 Using cached places (${cachedData.length}) - within distance/time threshold');
    //     _places = cachedData;
    //     _placesError = null;
    //     notifyListeners();
    //     return;
    //   }
    // }
    
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
      
      print('🔍 DEBUG: About to call places service with:');
      print('  - Lat: ${_currentLocation!.latitude}');
      print('  - Lng: ${_currentLocation!.longitude}');
      print('  - Query: $query');
      print('  - Radius: $_selectedRadius');
      print('  - Backend URL: ${Environment.backendUrl}');
      
      // Test network connectivity with detailed logging
      try {
        print('🌐 Testing backend connectivity...');
        final testResponse = await http.get(
          Uri.parse('${Environment.backendUrl}/health'),
          headers: {'Content-Type': 'application/json'},
        ).timeout(const Duration(seconds: 10));
        
        print('🌐 Backend connectivity test:');
        print('   Status: ${testResponse.statusCode}');
        print('   Headers: ${testResponse.headers}');
        print('   Body: ${testResponse.body.substring(0, math.min(200, testResponse.body.length))}');
        
        if (testResponse.statusCode == 200) {
          print('✅ Backend is responding correctly');
        } else {
          print('⚠️ Backend returned non-200 status: ${testResponse.statusCode}');
        }
      } catch (e) {
        print('❌ Network test failed: $e');
        print('❌ Cannot reach backend at ${Environment.backendUrl}');
        print('❌ This will likely cause places API to fail');
      }
      
      // Get user preferences for AI
      final userType = _getUserType();
      final vibe = _getUserVibe();
      final language = _getUserLanguage();
      
      // Check if using AI places or Real places
      if (!_useRealPlaces) {
        // AI Places Mode - fetch from AI endpoint
        print('🤖 Fetching AI-generated places...');
        try {
          final response = await http.get(
            Uri.parse('${Environment.backendUrl}/api/ai-places/nearby?lat=${_currentLocation!.latitude}&lng=${_currentLocation!.longitude}&radius=${_selectedRadius}&limit=10'),
            headers: {'Content-Type': 'application/json'},
          ).timeout(const Duration(seconds: 15));
          
          if (response.statusCode == 200) {
            final data = json.decode(response.body);
            final aiPlacesData = data['results'] ?? data['places'] ?? [];
            final aiPlaces = (aiPlacesData as List).map((p) => Place(
              id: p['id'] ?? 'ai_${DateTime.now().millisecondsSinceEpoch}',
              name: p['name'] ?? 'Unknown Place',
              address: p['address'] ?? 'Near your location',
              latitude: (p['latitude'] as num?)?.toDouble() ?? _currentLocation!.latitude,
              longitude: (p['longitude'] as num?)?.toDouble() ?? _currentLocation!.longitude,
              rating: (p['rating'] as num?)?.toDouble() ?? 4.0,
              type: p['type'] ?? 'restaurant',
              photoUrl: p['photoUrl'] ?? '',
              description: p['description'] ?? '',
              localTip: p['localTip'] ?? '',
              handyPhrase: p['handyPhrase'] ?? '',
            )).toList();
            
            places = aiPlaces;
            print('✅ Loaded ${places.length} AI-generated places');
          } else {
            print('❌ AI places API error: ${response.statusCode}');
            places = [];
          }
        } catch (e) {
          print('❌ AI places fetch failed: $e');
          places = [];
        }
      } else {
        // Real Places Mode - use Google Places API
        print('🌍 Fetching real places from Google...');
      
      if (searchQuery.isNotEmpty) {
        // Search query takes priority
        places = await placesService.fetchPlacesPipeline(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          query: query,
          radius: _selectedRadius,
          topN: 5,
          offset: loadMore ? _places.length : 0,
          userType: userType,
          vibe: vibe,
          language: language,
        );
        print('🔍 Search results for: $query');
      } else if (_selectedCategory != 'all') {
        // Single category search
        places = await placesService.fetchPlacesPipeline(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          query: query,
          radius: _selectedRadius,
          topN: 5,
          offset: loadMore ? _places.length : 0,
          userType: userType,
          vibe: vibe,
          language: language,
        );
        print('📂 Category results for: $_selectedCategory');
      } else {
        // Load diverse, high-quality places with smart distribution
        final now = DateTime.now();
        final hour = now.hour;
        final isEvening = hour >= 18;
        final isMorning = hour < 12;
        final isWeekend = now.weekday >= 6; // Saturday = 6, Sunday = 7
        
        // Use BATCH API for efficiency - single call instead of 5 separate calls
        print('🚀 Using batch API for efficient loading');
        
        final categories = <String, String>{};
        
        if (isEvening) {
          categories['food'] = 'restaurants cafes bars';
          categories['nightlife'] = 'bars nightclubs pubs';
          categories['attractions'] = 'tourist attractions landmarks';
        } else if (isMorning) {
          categories['food'] = 'cafes coffee shops bakeries';
          categories['attractions'] = 'tourist attractions landmarks';
          categories['culture'] = 'museums galleries';
          categories['nature'] = 'parks gardens';
        } else {
          categories['attractions'] = 'tourist attractions landmarks';
          categories['food'] = 'restaurants cafes';
          categories['culture'] = 'museums galleries';
          categories['nature'] = 'parks gardens';
          categories['shopping'] = 'shopping malls markets';
        }
        
        // Single batch API call instead of multiple calls
        final batchResults = await placesService.fetchPlacesBatch(
          latitude: _currentLocation!.latitude,
          longitude: _currentLocation!.longitude,
          categories: categories,
          radius: _selectedRadius,
        );
        
        // Combine all results
        List<Place> allPlaces = [];
        batchResults.forEach((category, categoryPlaces) {
          allPlaces.addAll(categoryPlaces);
        });
        
        print('✅ Batch API returned ${allPlaces.length} places from ${categories.length} categories');
        
        // Deduplicate and filter by rating
        final seen = <String>{};
        places = allPlaces
            .where((place) {
              final key = place.id.isNotEmpty ? place.id : '${place.name}_${place.latitude}_${place.longitude}';
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
          // AI ranking with rating, reviews, distance, weather, opening hours
          places = PlaceRanker.rankPlaces(
            places,
            _currentLocation!.latitude,
            _currentLocation!.longitude,
            weather: _weatherInfo?.condition,
            considerOpeningHours: true,
          );
          print('✅ Applied AI ranking to ${places.length} places');
        }
      }
      } // End Real Places Mode

      // Filter by search relevance if this is a search query
      if (searchQuery.isNotEmpty) {
        final originalQuery = searchQuery.toLowerCase().trim();
        places = places.where((place) {
          final name = place.name.toLowerCase();
          final type = place.type.toLowerCase();
          final description = place.description.toLowerCase();
          
          // Check if place matches the search query
          return name.contains(originalQuery) || 
                 type.contains(originalQuery) ||
                 description.contains(originalQuery);
        }).toList();
        print('🎯 Filtered to ${places.length} relevant results for "$searchQuery"');
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
        
        // Analyze data quality in detail
        final hasRealIds = places.any((p) => p.id.isNotEmpty && !p.id.startsWith('mock_'));
        final hasGooglePhotos = places.any((p) => p.photoUrl.contains('googleapis') || p.photoUrl.contains('googleusercontent'));
        final hasRealAddresses = places.any((p) => p.address.isNotEmpty && p.address != 'Near your location');
        final hasVariedNames = places.map((p) => p.name).toSet().length > places.length * 0.8;
        
        print('🔍 Data Quality Analysis:');
        print('   Real IDs: $hasRealIds (${places.where((p) => p.id.isNotEmpty && !p.id.startsWith('mock_')).length}/${places.length})');
        print('   Google Photos: $hasGooglePhotos');
        print('   Real Addresses: $hasRealAddresses (${places.where((p) => p.address.isNotEmpty && p.address != 'Near your location').length}/${places.length})');
        print('   Name Variety: $hasVariedNames');
        
        if (hasRealIds && hasRealAddresses) {
          print('✅ CONFIRMED REAL DATA: Places have Google Place IDs and real addresses');
        } else {
          print('🎭 SUSPECTED MOCK DATA: Places appear to be generated mock data');
          // Log first few places for inspection
          for (int i = 0; i < math.min(3, places.length); i++) {
            final p = places[i];
            print('   Place $i: ${p.name} (ID: ${p.id}, Address: ${p.address})');
          }
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

      }
      await _updateFavoritePlaces();
      
    } catch (e) {
      print('❌ Error loading places: $e');
      print('❌ Error type: ${e.runtimeType}');
      print('❌ Stack trace: ${StackTrace.current}');
      _placesError = 'Failed to load places: ${e.toString()}';
      
      // Detailed error analysis
      final errorString = e.toString().toLowerCase();
      final isNetworkError = errorString.contains('network') || 
                           errorString.contains('socket') || 
                           errorString.contains('timeout') || 
                           errorString.contains('connection');
      
      print('🔍 Error Analysis:');
      print('   Is Network Error: $isNetworkError');
      print('   Error contains "network": ${errorString.contains('network')}');
      print('   Error contains "socket": ${errorString.contains('socket')}');
      print('   Error contains "timeout": ${errorString.contains('timeout')}');
      
      // Show relevant cached places only if network fails
      if (isNetworkError) {
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
    print('❤️ Toggle favorite called for: $placeId');
    final place = _places.firstWhere((p) => p.id == placeId, orElse: () => Place(id: '', name: '', address: '', latitude: 0, longitude: 0, rating: 0, type: '', photoUrl: '', description: '', localTip: '', handyPhrase: ''));
    
    if (_favoriteIds.contains(placeId)) {
      print('💔 Removing from favorites: ${place.name}');
      _favoriteIds.remove(placeId);
      await _storageService.removeFavorite(placeId);
      print('✅ Removed from local storage');
      
      try {
        await _apiService.removeFavorite(placeId);
        print('✅ Removed from backend');
      } catch (e) {
        print('❌ Backend remove failed: $e');
      }
    } else {
      // Check favorites limit
      final maxFavs = maxFavorites;
      if (maxFavs > 0 && _favoriteIds.length >= maxFavs) {
        print('⚠️ Favorites limit reached: ${_favoriteIds.length}/$maxFavs');
        await _notificationService.showNotification(
          title: 'Favorites Limit Reached',
          body: 'Upgrade to add more favorites (${_favoriteIds.length}/$maxFavs)',
        );
        return false;
      }
      
      print('❤️ Adding to favorites: ${place.name}');
      _favoriteIds.add(placeId);
      await _storageService.addFavorite(placeId);
      print('✅ Added to local storage');
      
      try {
        await _apiService.addFavorite(placeId);
        print('✅ Added to backend');
      } catch (e) {
        print('❌ Backend add failed: $e');
      }
      
      if (place.name.isNotEmpty) {
        await _notificationService.showNotification(
          title: 'Added to Favorites',
          body: '${place.name} has been saved to your favorites',
        );
      }
    }
    
    await _updateFavoritePlaces();
    print('📊 Total favorites: ${_favoriteIds.length}');
    print('📊 Favorite places: ${_favoritePlaces.length}');
    notifyListeners();
    return true;
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    _currentPage = 1;
    _hasMorePlaces = true;
    notifyListeners();
    
    // Load places with the selected category filter
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
      case 'entertainment':
        return isEvening ? _expandKeywords(['nightclub', 'bar', 'live music']) : _expandKeywords(['cinema', 'theater', 'entertainment']);
      case 'photography':
        return _expandKeywords(['viewpoint', 'landmark']);
      case 'spa':
        return _expandKeywords(['spa', 'wellness']);
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
          expanded.addAll(['museum', 'art gallery', 'cultural center']);
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
        case 'spa':
        case 'wellness':
          expanded.addAll(['spa', 'wellness center', 'massage', 'beauty salon']);
          break;
        case 'entertainment':
          expanded.addAll(['cinema', 'theater', 'entertainment venue', 'concert hall']);
          break;
        case 'nightclub':
        case 'live music':
          expanded.addAll(['nightclub', 'bar', 'pub', 'live music', 'concert venue', 'lounge']);
          break;
        case 'viewpoint':
        case 'scenic spot':
          expanded.addAll(['viewpoint', 'observation deck']);
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
      // Update locally first
      final updatedUser = _currentUser!.copyWith(travelStyle: style);
      await _storageService.saveUser(updatedUser);
      _currentUser = updatedUser;
      
      // Sync with backend
      try {
        final backendSuccess = await _apiService.updateUserTravelStyle(style.name);
        if (backendSuccess) {
          print('✅ Travel style synced with backend: ${style.displayName}');
        } else {
          print('⚠️ Backend sync failed, but local update succeeded');
        }
      } catch (e) {
        print('⚠️ Backend sync error: $e');
      }
      
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
  
  // Debug method to check current user state
  void debugCurrentUser() {
    print('🔍 DEBUG: Current User State:');
    print('  - Username: ${_currentUser?.username ?? "None"}');
    print('  - Email: ${_currentUser?.email ?? "None"}');
    print('  - MongoDB ID: ${_currentUser?.mongoId ?? "None"}');
    print('  - Firebase UID: ${_currentUser?.uid ?? "None"}');
    print('  - Travel Style: ${_currentUser?.travelStyle?.displayName ?? "None"}');
    print('  - Is Authenticated: $_isAuthenticated');
  }
  
  // Debug method to reload user from storage and verify travel style persistence
  Future<void> debugReloadUserFromStorage() async {
    try {
      final storedUser = await _storageService.getUser();
      print('🔍 DEBUG: Stored User:');
      print('  - Username: ${storedUser?.username ?? "None"}');
      print('  - Travel Style: ${storedUser?.travelStyle?.displayName ?? "None"}');
      
      if (storedUser != null && storedUser.travelStyle != _currentUser?.travelStyle) {
        print('⚠️ WARNING: Travel style mismatch between memory and storage!');
        print('  - Memory: ${_currentUser?.travelStyle?.displayName ?? "None"}');
        print('  - Storage: ${storedUser.travelStyle?.displayName ?? "None"}');
      } else {
        print('✅ Travel style matches between memory and storage');
      }
    } catch (e) {
      print('❌ Error reloading user from storage: $e');
    }
  }

  // Load places in sections using batch API for better performance
  Future<void> loadPlaceSections() async {
    if (!_isAppActive || _currentLocation == null) {
      print('🚫 Skipping sections load - app inactive or no location');
      return;
    }
    
    _isSectionsLoading = true;
    notifyListeners();
    
    try {
      // Load only 2 essential sections initially for faster load
      print('🚀 Lazy loading: Loading first 2 sections only');
      
      final sections = <PlaceSection>[];
      
      // Add dynamic "Nearby Now" section
      final nearbyNowPlaces = await _getNearbyNowPlaces();
      if (nearbyNowPlaces.isNotEmpty) {
        sections.add(PlaceSection(
          id: 'nearby_now',
          title: 'Open Now & Popular 🔥',
          subtitle: 'Currently open and trending nearby',
          emoji: '🔥',
          places: nearbyNowPlaces,
          category: 'nearby_now',
          query: 'open now popular',
        ));
      }
      
      // Add dynamic "For You" section
      final forYouPlaces = await _getPersonalizedPlaces();
      if (forYouPlaces.isNotEmpty) {
        sections.add(PlaceSection(
          id: 'for_you',
          title: 'For You ⭐',
          subtitle: 'Based on your preferences',
          emoji: '⭐',
          places: forYouPlaces,
          category: 'personalized',
          query: 'personalized',
        ));
      }
      
      // Load only Food & Landmarks initially (most popular)
      final initialCategories = {
        'food': 'restaurants cafes bars coffee shops',
        'landmarks': 'tourist attractions monuments historical sites landmarks',
      };
      
      final batchResults = await PlacesService().fetchPlacesBatch(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        categories: initialCategories,
        radius: _selectedRadius,
      );
      
      if (batchResults['food']?.isNotEmpty == true) {
        sections.add(PlaceSection(
          id: 'food',
          title: 'Food & Drink',
          subtitle: 'Restaurants, cafes, bars, coffee shops',
          emoji: '🍽️',
          places: batchResults['food']!,
          category: 'food',
          query: initialCategories['food']!,
        ));
      }
      
      if (batchResults['landmarks']?.isNotEmpty == true) {
        sections.add(PlaceSection(
          id: 'landmarks',
          title: 'Landmarks & Attractions',
          subtitle: 'Tourist attractions, monuments, historical sites',
          emoji: '🏛️',
          places: batchResults['landmarks']!,
          category: 'landmarks',
          query: initialCategories['landmarks']!,
        ));
      }
      
      _placeSections = sections;
      print('✅ Loaded ${_placeSections.length} sections (lazy load - 1 API call)');
      print('📌 Remaining sections will load on scroll');
      
    } catch (e) {
      print('❌ Error loading place sections: $e');
    } finally {
      _isSectionsLoading = false;
      notifyListeners();
    }
  }
  
  // Fallback method for individual section loading
  Future<void> _loadSectionsIndividually() async {
    try {
      final sections = await Future.wait([
        _loadFoodAndDrink(),
        _loadLandmarksAndAttractions(),
        _loadCultureAndMuseums(),
        _loadOutdoorAndNature(),
        _loadShoppingAndMarkets(),
        _loadSpaAndWellness(),
      ]);
      
      _placeSections = sections.where((s) => s.places.isNotEmpty).toList();
      print('✅ Loaded ${_placeSections.length} place sections individually');
    } catch (e) {
      print('❌ Error in individual section loading: $e');
    }
  }
  
  // Load remaining sections on demand (called when user scrolls)
  Future<void> loadRemainingPlaceSections() async {
    if (_currentLocation == null) return;
    
    print('📜 Loading remaining sections on demand...');
    
    try {
      final remainingCategories = {
        'culture': 'museums art galleries cultural centers theaters',
        'nature': 'parks gardens hiking trails nature spots',
        'shopping': 'shopping malls local markets bazaars shops',
      };
      
      final batchResults = await PlacesService().fetchPlacesBatch(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        categories: remainingCategories,
        radius: _selectedRadius,
      );
      
      final newSections = <PlaceSection>[];
      
      if (batchResults['culture']?.isNotEmpty == true) {
        newSections.add(PlaceSection(
          id: 'culture',
          title: 'Culture & Museums',
          subtitle: 'Museums, art galleries, cultural centers',
          emoji: '🎨',
          places: batchResults['culture']!,
          category: 'culture',
          query: remainingCategories['culture']!,
        ));
      }
      
      if (batchResults['nature']?.isNotEmpty == true) {
        newSections.add(PlaceSection(
          id: 'nature',
          title: 'Outdoor & Nature',
          subtitle: 'Parks, gardens, hiking trails, nature spots',
          emoji: '🌳',
          places: batchResults['nature']!,
          category: 'nature',
          query: remainingCategories['nature']!,
        ));
      }
      
      if (batchResults['shopping']?.isNotEmpty == true) {
        newSections.add(PlaceSection(
          id: 'shopping',
          title: 'Shopping & Markets',
          subtitle: 'Shopping malls, local markets, bazaars',
          emoji: '🛍️',
          places: batchResults['shopping']!,
          category: 'shopping',
          query: remainingCategories['shopping']!,
        ));
      }
      
      _placeSections.addAll(newSections);
      print('✅ Loaded ${newSections.length} additional sections (1 API call)');
      notifyListeners();
      
    } catch (e) {
      print('❌ Error loading remaining sections: $e');
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
  
  Future<PlaceSection> _loadSpaAndWellness() async {
    final places = await _fetchPlacesForSection('spa wellness massage therapy beauty salon', 5);
    return PlaceSection(
      id: 'spa',
      title: 'SPA & Wellness',
      subtitle: 'Spas, wellness centers, massage therapy',
      emoji: '🧘‍♀️',
      places: places,
      category: 'spa',
      query: 'spa wellness massage therapy beauty salon',
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
    
    // Use proper pagination with offset
    final placesService = PlacesService();
    final offset = (page - 1) * 10; // Calculate offset based on page
    
    final places = await placesService.fetchPlacesPipeline(
      latitude: _currentLocation!.latitude,
      longitude: _currentLocation!.longitude,
      query: section.query,
      radius: _selectedRadius,
      topN: 10,
      offset: offset,
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
    
    return filteredPlaces;
  }
  
  // Get "Nearby Now" places (open, popular, close)
  Future<List<Place>> _getNearbyNowPlaces() async {
    if (_places.isEmpty) return [];
    
    final isRainy = _weatherInfo?.condition.toLowerCase().contains('rain') ?? false;
    
    final filtered = _places.where((place) {
      // Open now
      if (place.isOpenNow != true) return false;
      
      // High rating
      if (place.rating < 4.0) return false;
      
      // Weather suitable
      if (isRainy) {
        final type = place.type.toLowerCase();
        if (!type.contains('museum') && !type.contains('mall') && !type.contains('cinema')) return false;
      }
      
      // Close distance (< 2km)
      final distance = Geolocator.distanceBetween(
        _currentLocation!.latitude,
        _currentLocation!.longitude,
        place.latitude ?? 0,
        place.longitude ?? 0,
      ) / 1000;
      if (distance > 2.0) return false;
      
      return true;
    }).toList();
    
    // Rank by score
    return PlaceRanker.rankPlaces(
      filtered,
      _currentLocation!.latitude,
      _currentLocation!.longitude,
      weather: _weatherInfo?.condition,
    ).take(10).toList();
  }
  
  // Get "For You" personalized places
  Future<List<Place>> _getPersonalizedPlaces() async {
    if (_places.isEmpty) return [];
    
    final userInsights = _usageTrackingService.getUserInsights();
    final topCategory = userInsights['topCategory'] as String?;
    final favoriteTypes = <String>[];
    
    // Map travel style to types
    if (_currentUser?.travelStyle != null) {
      switch (_currentUser!.travelStyle!.name) {
        case 'foodie':
          favoriteTypes.addAll(['restaurant', 'cafe', 'food']);
          break;
        case 'culture':
          favoriteTypes.addAll(['museum', 'gallery', 'temple']);
          break;
        case 'nature':
          favoriteTypes.addAll(['park', 'garden', 'beach']);
          break;
        case 'nightOwl':
          favoriteTypes.addAll(['bar', 'nightclub', 'pub']);
          break;
      }
    }
    
    // Filter by preferences
    final filtered = _places.where((place) {
      final type = place.type.toLowerCase();
      
      // Match travel style
      if (favoriteTypes.any((t) => type.contains(t))) return true;
      
      // Match top category
      if (topCategory != null && type.contains(topCategory.toLowerCase())) return true;
      
      // High rated
      if (place.rating >= 4.5) return true;
      
      return false;
    }).toList();
    
    // Rank by score
    return PlaceRanker.rankPlaces(
      filtered,
      _currentLocation!.latitude,
      _currentLocation!.longitude,
      weather: _weatherInfo?.condition,
    ).take(10).toList();
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
    
    // Use query directly - lat/lng already provides location context
    // Don't add "near me" as it confuses Google Places API
    print('🔍 Search query: "$query"');
    await loadNearbyPlaces(searchQuery: query);
  }

  Future<void> performInstantSearch(String query) async {
    print('🔍 performInstantSearch called with: "$query"');
    if (query.isNotEmpty) {
      _selectedCategory = 'all'; // Reset category when searching
      notifyListeners();
    }
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

  void setShowFavoritesOnly() {
    _showFavoritesOnly = true;
    notifyListeners();
  }

  void clearFavoritesFilter() {
    _showFavoritesOnly = false;
    notifyListeners();
  }

  void setPlacesSource(bool useReal) {
    _useRealPlaces = useReal;
    _places.clear();
    _currentPage = 1;
    _hasMorePlaces = true;
    notifyListeners();
    loadNearbyPlaces();
  }

  List<Place> get filteredPlaces {
    if (_showFavoritesOnly) {
      return _places.where((place) => _favoriteIds.contains(place.id)).toList();
    }
    return _places;
  }

  // Trip Methods with Backend Sync
  Future<void> loadTripPlans() async {
    _isTripsLoading = true;
    notifyListeners();

    try {
      print('📦 Loading trip plans...');
      
      // Load from cache first for instant display
      final cached = await OfflineManager.getCachedTripPlans();
      if (cached.isNotEmpty) {
        _tripPlans = cached;
        print('📦 Loaded ${cached.length} trip plans from cache');
        notifyListeners(); // Show cached data immediately
      }
      
      // Try to fetch from backend
      if (_currentUser?.mongoId != null) {
        try {
          final backendPlans = await TripPlansApiService.getUserTripPlans();
          if (backendPlans.isNotEmpty) {
            _tripPlans = backendPlans;
            // Cache for offline use
            await OfflineManager.cacheTripPlans(backendPlans);
            print('☁️ Loaded ${backendPlans.length} trip plans from database');
          } else {
            print('⚠️ Backend returned empty list - keeping cached data');
            // Keep cached data if backend returns empty
          }
        } catch (e) {
          print('❌ Error loading from backend: $e');
          // Keep cached data on error
          if (_tripPlans.isEmpty && cached.isNotEmpty) {
            _tripPlans = cached;
            print('📦 Using cached trip plans due to network error');
          }
        }
      }
      
      _itineraries = await _storageService.getItineraries();
      print('✅ Loaded ${_tripPlans.length} trip plans and ${_itineraries.length} itineraries');
    } catch (e) {
      print('❌ Error loading trip plans: $e');
      // Fallback to cache
      final cached = await OfflineManager.getCachedTripPlans();
      _tripPlans = cached;
      _itineraries = [];
      print('📦 Using ${cached.length} cached trip plans due to error');
    } finally {
       _isTripsLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> _syncTripPlansWithBackend() async {
    try {
      final userId = _currentUser!.mongoId!;
      
      // Get backend plans
      final backendPlans = await TripPlansApiService.getUserTripPlans();
      
      if (backendPlans.isNotEmpty) {
        // Merge backend and local plans
        final allPlans = <TripPlan>[];
        final seenIds = <String>{};
        
        // Add backend plans first
        for (final plan in backendPlans) {
          if (!seenIds.contains(plan.id)) {
            allPlans.add(plan);
            seenIds.add(plan.id);
          }
        }
        
        // Add local plans that aren't in backend and sync them
        for (final plan in _tripPlans) {
          if (!seenIds.contains(plan.id)) {
            // Upload local plan to backend
            final savedPlan = await TripPlansApiService.saveTripPlan(plan);
            if (savedPlan != null) {
              allPlans.add(savedPlan);
              seenIds.add(savedPlan.id);
            }
          }
        }
        
        _tripPlans = allPlans;
        
        // Update local storage with merged plans
        for (final plan in allPlans) {
          await _storageService.saveTripPlan(plan);
        }
        
        print('🔄 Synced: ${backendPlans.length} backend + ${_tripPlans.length - backendPlans.length} local = ${allPlans.length} total');
      } else {
        // No backend plans, upload all local plans
        await _uploadLocalPlansToBackend();
      }
    } catch (e) {
      print('⚠️ Backend sync failed: $e');
    }
  }
  
  Future<void> _uploadLocalPlansToBackend() async {
    if (_currentUser?.mongoId == null || _tripPlans.isEmpty) return;
    
    try {
      final userId = _currentUser!.mongoId!;
      
      for (final plan in _tripPlans) {
        await TripPlansApiService.saveTripPlan(plan);
      }
      
      print('⬆️ Uploaded ${_tripPlans.length} local plans to backend');
    } catch (e) {
      print('❌ Error uploading local plans: $e');
    }
  }

  Future<void> saveTripPlan(TripPlan tripPlan) async {
    print('💾 Saving trip plan: ${tripPlan.tripTitle}');
    print('🔍 DEBUG: currentUser = ${_currentUser?.username}');
    print('🔍 DEBUG: mongoId = ${_currentUser?.mongoId}');
    print('🔍 DEBUG: uid = ${_currentUser?.uid}');
    print('🔍 DEBUG: isAuthenticated = $_isAuthenticated');
    
    try {
      // Check if user is authenticated
      if (_currentUser == null || !_isAuthenticated) {
        print('❌ User not authenticated');
        throw Exception('Please sign in to save trip plans');
      }
      
      // If mongoId is null, sync with backend first
      if (_currentUser!.mongoId == null) {
        print('⚠️ mongoId is null, syncing with backend...');
        final user = await AuthService.getCurrentUser();
        if (user != null) {
          await _syncFirebaseUserWithBackend(user);
          await _loadUserData();
          notifyListeners();
          print('✅ User synced, mongoId = ${_currentUser?.mongoId}');
        }
      }
      
      // ALWAYS save to local storage first
      await _storageService.saveTripPlan(tripPlan);
      print('✅ Trip plan saved to local storage');
      
      // Save to backend database
      if (_currentUser?.mongoId != null) {
        print('✅ User has mongoId, saving to backend...');
        final savedPlan = await TripPlansApiService.saveTripPlan(tripPlan);
        if (savedPlan != null) {
          final existingIndex = _tripPlans.indexWhere((p) => p.id == tripPlan.id);
          if (existingIndex == -1) {
            _tripPlans.add(savedPlan);
          } else {
            _tripPlans[existingIndex] = savedPlan;
          }
          
          // Cache for offline use
          await OfflineManager.cacheTripPlans(_tripPlans);
          
          print('✅ Trip plan saved to database. Total plans: ${_tripPlans.length}');
          notifyListeners();
        } else {
          print('⚠️ Backend save returned null, but local save succeeded');
          // Add to local list even if backend fails
          final existingIndex = _tripPlans.indexWhere((p) => p.id == tripPlan.id);
          if (existingIndex == -1) {
            _tripPlans.add(tripPlan);
          } else {
            _tripPlans[existingIndex] = tripPlan;
          }
          notifyListeners();
        }
      } else {
        print('⚠️ mongoId still null, but local save succeeded');
        // Add to local list even if backend fails
        final existingIndex = _tripPlans.indexWhere((p) => p.id == tripPlan.id);
        if (existingIndex == -1) {
          _tripPlans.add(tripPlan);
        } else {
          _tripPlans[existingIndex] = tripPlan;
        }
        notifyListeners();
      }
    } catch (e) {
      print('❌ Error saving trip plan: $e');
      // Try to save locally even if backend fails
      try {
        await _storageService.saveTripPlan(tripPlan);
        final existingIndex = _tripPlans.indexWhere((p) => p.id == tripPlan.id);
        if (existingIndex == -1) {
          _tripPlans.add(tripPlan);
        } else {
          _tripPlans[existingIndex] = tripPlan;
        }
        print('✅ Saved to local storage despite backend error');
        notifyListeners();
      } catch (localError) {
        print('❌ Local save also failed: $localError');
        rethrow;
      }
    }
  }

  Future<void> deleteTripPlan(String tripPlanId) async {
    print('🗑️ Starting delete for trip plan: $tripPlanId');
    
    // STEP 1: Delete from local storage FIRST
    await _storageService.deleteTripPlan(tripPlanId);
    print('✅ STEP 1: Deleted from local storage');
    
    // STEP 2: Remove from memory
    final beforeCount = _tripPlans.length;
    _tripPlans.removeWhere((trip) => trip.id == tripPlanId);
    final afterCount = _tripPlans.length;
    print('✅ STEP 2: Removed from memory: $beforeCount → $afterCount plans');
    
    // STEP 3: Update cache immediately with remaining plans
    await OfflineManager.cacheTripPlans(_tripPlans);
    print('✅ STEP 3: Cache updated with ${_tripPlans.length} remaining plans');
    
    // STEP 4: Update UI immediately
    notifyListeners();
    print('✅ STEP 4: UI updated');
    
    // STEP 5: Delete from backend (async, don't wait)
    if (_currentUser?.mongoId != null) {
      TripPlansApiService.deleteTripPlan(tripPlanId).then((success) {
        if (success) {
          print('✅ STEP 5: Backend delete successful');
        } else {
          print('⚠️ STEP 5: Backend delete failed, but local delete succeeded');
        }
      }).catchError((e) {
        print('❌ STEP 5: Backend delete error: $e');
      });
    }
  }

  // Update activity visited status
  Future<void> updateActivityVisitedStatus(String tripPlanId, int dayIndex, int activityIndex, bool isVisited) async {
    final tripIndex = _tripPlans.indexWhere((trip) => trip.id == tripPlanId);
    if (tripIndex == -1) {
      print('❌ Trip plan not found: $tripPlanId');
      return;
    }
    
    final trip = _tripPlans[tripIndex];
    if (dayIndex >= trip.dailyPlans.length || activityIndex >= trip.dailyPlans[dayIndex].activities.length) {
      print('❌ Invalid indices: day $dayIndex, activity $activityIndex');
      return;
    }
    
    // Create a completely new trip plan with updated activity
    final activity = trip.dailyPlans[dayIndex].activities[activityIndex];
    
    // Create new activity with updated status
    final updatedActivity = ActivityDetail(
      timeOfDay: activity.timeOfDay,
      activityTitle: activity.activityTitle,
      description: activity.description,
      estimatedDuration: activity.estimatedDuration,
      location: activity.location,
      notes: activity.notes,
      icon: activity.icon,
      category: activity.category,
      startTime: activity.startTime,
      endTime: activity.endTime,
      duration: activity.duration,
      place: activity.place,
      type: activity.type,
      estimatedCost: activity.estimatedCost,
      costBreakdown: activity.costBreakdown,
      transportFromPrev: activity.transportFromPrev,
      tips: activity.tips,
      weatherBackup: activity.weatherBackup,
      crowdLevel: activity.crowdLevel,
      imageURL: activity.imageURL,
      bookingLinks: activity.bookingLinks,
      googlePlaceId: activity.googlePlaceId,
      highlight: activity.highlight,
      socialProof: activity.socialProof,
      rating: activity.rating,
      userRatingsTotal: activity.userRatingsTotal,
      practicalTip: activity.practicalTip,
      travelMode: activity.travelMode,
      travelTimeMin: activity.travelTimeMin,
      estimatedVisitDurationMin: activity.estimatedVisitDurationMin,
      photoThumbnail: activity.photoThumbnail,
      fullAddress: activity.fullAddress,
      openingHours: activity.openingHours,
      isOpenNow: activity.isOpenNow,
      weatherNote: activity.weatherNote,
      tags: activity.tags,
      bookingLink: activity.bookingLink,
      isVisited: isVisited,
      visitedDate: isVisited ? DateTime.now().toIso8601String() : activity.visitedDate,
    );
    
    // Create new activities list with updated activity
    final updatedActivities = List<ActivityDetail>.from(trip.dailyPlans[dayIndex].activities);
    updatedActivities[activityIndex] = updatedActivity;
    
    // Create new daily plan with updated activities
    final updatedDailyPlan = DailyTripPlan(
      day: trip.dailyPlans[dayIndex].day,
      title: trip.dailyPlans[dayIndex].title,
      theme: trip.dailyPlans[dayIndex].theme,
      activities: updatedActivities,
      photoUrl: trip.dailyPlans[dayIndex].photoUrl,
    );
    
    // Create new daily plans list with updated day
    final updatedDailyPlans = List<DailyTripPlan>.from(trip.dailyPlans);
    updatedDailyPlans[dayIndex] = updatedDailyPlan;
    
    // Create new trip plan with updated daily plans
    final updatedTrip = TripPlan(
      id: trip.id,
      tripTitle: trip.tripTitle,
      destination: trip.destination,
      duration: trip.duration,
      introduction: trip.introduction,
      dailyPlans: updatedDailyPlans,
      conclusion: trip.conclusion,
      accommodationSuggestions: trip.accommodationSuggestions,
      transportationTips: trip.transportationTips,
      budgetConsiderations: trip.budgetConsiderations,
    );
    
    // Replace the trip in the list
    _tripPlans[tripIndex] = updatedTrip;
    
    print('💾 STEP A: Saving updated trip plan to local storage...');
    await _storageService.saveTripPlan(updatedTrip);
    print('✅ STEP B: Trip plan saved to local storage');
    
    // Sync to backend if user is logged in
    if (_currentUser?.mongoId != null) {
      try {
        print('💾 STEP C: Syncing to backend...');
        await TripPlansApiService.updateTripPlan(updatedTrip);
        print('✅ STEP D: Trip plan synced to backend successfully');
      } catch (e) {
        print('❌ STEP D: Backend sync failed: $e');
      }
    } else {
      print('⚠️ STEP C: No user logged in - skipping backend sync');
    }
    
    print('✅ FINAL: Activity "${activity.activityTitle}" marked as ${isVisited ? "visited" : "pending"}');
    notifyListeners();
  }

  // Update itinerary activity visited status
  Future<void> updateItineraryActivityVisitedStatus(String itineraryId, int activityIndex, bool isVisited) async {
    final itineraryIndex = _itineraries.indexWhere((itinerary) => itinerary.id == itineraryId);
    if (itineraryIndex == -1) {
      print('❌ Itinerary not found: $itineraryId');
      return;
    }
    
    if (activityIndex >= _itineraries[itineraryIndex].dailyPlan.length) {
      print('❌ Invalid activity index: $activityIndex');
      return;
    }
    
    final itinerary = _itineraries[itineraryIndex];
    final activity = itinerary.dailyPlan[activityIndex];
    
    // Create new activity with all fields preserved
    final updatedActivity = ActivityDetail(
      timeOfDay: activity.timeOfDay,
      activityTitle: activity.activityTitle,
      description: activity.description,
      estimatedDuration: activity.estimatedDuration,
      location: activity.location,
      notes: activity.notes,
      icon: activity.icon,
      category: activity.category,
      startTime: activity.startTime,
      endTime: activity.endTime,
      duration: activity.duration,
      place: activity.place,
      type: activity.type,
      estimatedCost: activity.estimatedCost,
      costBreakdown: activity.costBreakdown,
      transportFromPrev: activity.transportFromPrev,
      tips: activity.tips,
      weatherBackup: activity.weatherBackup,
      crowdLevel: activity.crowdLevel,
      imageURL: activity.imageURL,
      bookingLinks: activity.bookingLinks,
      googlePlaceId: activity.googlePlaceId,
      highlight: activity.highlight,
      socialProof: activity.socialProof,
      rating: activity.rating,
      userRatingsTotal: activity.userRatingsTotal,
      practicalTip: activity.practicalTip,
      travelMode: activity.travelMode,
      travelTimeMin: activity.travelTimeMin,
      estimatedVisitDurationMin: activity.estimatedVisitDurationMin,
      photoThumbnail: activity.photoThumbnail,
      fullAddress: activity.fullAddress,
      openingHours: activity.openingHours,
      isOpenNow: activity.isOpenNow,
      weatherNote: activity.weatherNote,
      tags: activity.tags,
      bookingLink: activity.bookingLink,
      isVisited: isVisited,
      visitedDate: isVisited ? DateTime.now().toIso8601String() : activity.visitedDate,
    );
    
    // Create new daily plan with updated activity
    final updatedDailyPlan = List<ActivityDetail>.from(itinerary.dailyPlan);
    updatedDailyPlan[activityIndex] = updatedActivity;
    
    // Create new itinerary with updated daily plan
    final updatedItinerary = OneDayItinerary(
      id: itinerary.id,
      title: itinerary.title,
      introduction: itinerary.introduction,
      dailyPlan: updatedDailyPlan,
      conclusion: itinerary.conclusion,
      travelTips: itinerary.travelTips,
    );
    
    // Replace in the list
    _itineraries[itineraryIndex] = updatedItinerary;
    
    print('💾 STEP A: Saving updated itinerary to local storage...');
    await _storageService.saveItinerary(updatedItinerary);
    print('✅ STEP B: Itinerary saved to local storage');
    
    // Verify the save worked
    final verifyItinerary = await _storageService.getItineraries();
    final savedItinerary = verifyItinerary.firstWhere((i) => i.id == updatedItinerary.id);
    final savedActivity = savedItinerary.dailyPlan[activityIndex];
    print('🔍 STEP C: Verification - saved activity isVisited: ${savedActivity.isVisited}');
    
    // Sync to backend if user is logged in
    if (_currentUser?.mongoId != null) {
      try {
        print('💾 STEP D: Syncing to backend...');
        // Convert itinerary to trip plan format for backend
        final tripPlanForBackend = TripPlan(
          id: updatedItinerary.id,
          tripTitle: updatedItinerary.title,
          destination: 'Day Trip',
          duration: '1 Day',
          introduction: updatedItinerary.introduction,
          dailyPlans: [
            DailyTripPlan(
              day: 1,
              title: updatedItinerary.title,
              activities: updatedItinerary.dailyPlan,
            ),
          ],
          conclusion: updatedItinerary.conclusion,
        );
        await TripPlansApiService.updateTripPlan(tripPlanForBackend);
        print('✅ STEP E: Itinerary synced to backend successfully');
      } catch (e) {
        print('❌ STEP E: Backend sync failed: $e');
      }
    } else {
      print('⚠️ STEP D: No user logged in - skipping backend sync');
    }
    
    print('✅ FINAL: Itinerary activity "${activity.activityTitle}" marked as ${isVisited ? "visited" : "pending"}');
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
      // Load from cache first for instant display
      final cached = await OfflineManager.getCachedDeals();
      if (cached.isNotEmpty) {
        _deals = cached;
        print('📦 Loaded ${cached.length} deals from cache');
        notifyListeners(); // Show cached data immediately
      }
      
      // Try real deals API
      try {
        final realDeals = await DealsService.getActiveDeals();
        if (realDeals.isNotEmpty) {
          _deals = realDeals;
          // Cache for offline
          await OfflineManager.cacheDeals(realDeals);
          print('✅ Loaded ${realDeals.length} REAL deals from backend');
        }
      } catch (e) {
        print('❌ Error loading deals from backend: $e');
        // Keep cached data on error
        if (_deals.isEmpty && cached.isNotEmpty) {
          _deals = cached;
          print('📦 Using cached deals due to network error');
        }
        _dealsError = 'Showing cached deals. Check your connection.';
      }
      
    } catch (e) {
      print('❌ Error loading deals: $e');
      _dealsError = 'Failed to load deals: ${e.toString()}';
      // Fallback to cache
      final cached = await OfflineManager.getCachedDeals();
      _deals = cached;
      print('📦 Using ${cached.length} cached deals due to error');
    } finally {
      _isDealsLoading = false;
      notifyListeners();
    }
  }
  
  Future<List<Deal>> getMyDeals() async {
    try {
      return await _apiService.getMyDeals();
    } catch (e) {
      print('❌ Error loading my deals: $e');
      return [];
    }
  }
  
  Future<bool> claimDeal(String dealId) async {
    try {
      // Try real API first
      bool success = await _apiService.claimDealReal(dealId);
      if (success) {
        print('✅ Deal claimed via real API');
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
        
        await _notificationService.showNotification(
          title: 'Deal Claimed!',
          body: 'You have successfully claimed this deal',
        );
      }
      return success;
    } catch (e) {
      print('❌ Error claiming deal: $e');
      return false;
    }
  }

  // Trip Plan Generation with Analytics
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
      // Use RealDataService for structured trip plans
      final tripPlan = await RealDataService.generateRealisticTripPlan(
        destination: destination,
        duration: duration,
        interests: interests,
      );
      
      await saveTripPlan(tripPlan);
      
      // Track trip creation analytics
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final activitiesCount = tripPlan.dailyPlans
            .fold(0, (sum, day) => sum + day.activities.length);
        
        await TripAnalyticsService.trackTripCreated(
          userId: user.uid,
          tripPlanId: tripPlan.id,
          destination: destination,
          duration: duration,
          interests: interests.split(',').map((e) => e.trim()).toList(),
          activitiesCount: activitiesCount,
        );
      }
      
      await _notificationService.showNotification(
        title: 'Trip Plan Ready!',
        body: 'Your ${tripPlan.tripTitle} has been generated successfully',
      );
      print('✅ Generated and saved trip plan: ${tripPlan.tripTitle}');
      return tripPlan;
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
    
    // Clear ALL caches first
    await clearCache();
    
    // Clear current places
    _places.clear();
    _placeSections.clear();
    _currentPage = 1;
    _hasMorePlaces = true;
    
    // Force location update first
    await getCurrentLocation();
    
    // Reset last known location to force fresh load
    _lastKnownLocation = null;
    
    // Load fresh places
    await loadNearbyPlaces();
    
    print('✅ Force refresh complete - all caches cleared');
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
    final user = await AuthService.getCurrentUser();
    if (user != null) {
      // ALWAYS fetch from backend first to get latest data
      try {
        final userByUid = await _apiService.getUserByFirebaseUid(user.uid);
        if (userByUid != null) {
          print('🔍 Backend response keys: ${userByUid.keys.toList()}');
          print('🔍 Backend _id field: ${userByUid['_id']}');
          print('🔍 Backend id field: ${userByUid['id']}');
          
          _currentUser = CurrentUser.fromJson(userByUid);
          await _storageService.saveUser(_currentUser!);
          
          print('✅ Loaded user from backend');
          print('   - Full Name: ${_currentUser!.fullName ?? "none"}');
          print('   - Profile Picture: ${_currentUser!.profilePicture != null ? "${_currentUser!.profilePicture!.substring(0, math.min(50, _currentUser!.profilePicture!.length))}..." : "none"}');
          print('   - Phone: ${_currentUser!.phone ?? "none"}');
          print('   - MongoDB ID: ${_currentUser!.mongoId ?? "none"}');
        } else {
          // Fallback to local storage
          final storedUser = await _storageService.getUser();
          if (storedUser != null && storedUser.uid == user.uid) {
            _currentUser = storedUser;
            print('⚠️ Backend fetch failed, using local storage');
          } else {
            _currentUser = UserConverter.fromFirebaseUser(user);
            print('⚠️ No stored user, using Firebase data');
          }
        }
      } catch (e) {
        print('❌ Backend fetch error: $e');
        // Fallback to local storage
        final storedUser = await _storageService.getUser();
        if (storedUser != null && storedUser.uid == user.uid) {
          _currentUser = storedUser;
          print('⚠️ Using local storage due to error');
        } else {
          _currentUser = UserConverter.fromFirebaseUser(user);
          print('⚠️ Using Firebase data due to error');
        }
      }
      _isAuthenticated = true;
      
      // Load user-specific data
      try {
        
        // DON'T reload trip plans here - already loaded in _loadCachedData
        print('⚠️ SKIPPING trip plans reload to preserve data');
        
        // NEW: Sync route tracking data from backend
        await _syncRouteTrackingDataFromBackend();
        
        // Sync favorites from backend
        try {
          final backendFavorites = await _apiService.getUserFavorites();
          if (backendFavorites.isNotEmpty) {
            _favoriteIds = backendFavorites;
            // Save to local storage
            for (final favoriteId in backendFavorites) {
              await _storageService.addFavorite(favoriteId);
            }
            print('✅ Synced ${backendFavorites.length} favorites from backend');
          } else {
            // Fallback to local favorites
            final favorites = await _storageService.getFavorites();
            _favoriteIds = ErrorHandlerService.safeListCast<String>(favorites, 'loadUserData - favorites');
          }
        } catch (e) {
          print('⚠️ Failed to sync favorites from backend: $e');
          final favorites = await _storageService.getFavorites();
          _favoriteIds = ErrorHandlerService.safeListCast<String>(favorites, 'loadUserData - favorites');
        }
        await _updateFavoritePlaces();
        
        // Sync travel style from backend if available
        try {
          final backendTravelStyle = await _apiService.getUserTravelStyle();
          if (backendTravelStyle != null && _currentUser!.travelStyle?.name != backendTravelStyle) {
            final travelStyle = TravelStyle.values.firstWhere(
              (style) => style.name == backendTravelStyle,
              orElse: () => TravelStyle.explorer,
            );
            final updatedUser = _currentUser!.copyWith(travelStyle: travelStyle);
            await _storageService.saveUser(updatedUser);
            _currentUser = updatedUser;
            print('✅ Synced travel style from backend: ${travelStyle.displayName}');
          }
        } catch (e) {
          print('⚠️ Failed to sync travel style from backend: $e');
        }
      } catch (e) {
        ErrorHandlerService.handleError('loadUserData', e, null);
        _favoriteIds = [];
      }
    }
  }

  /// Sync route tracking data from backend (NEW)
  Future<void> _syncRouteTrackingDataFromBackend() async {
    try {
      // Load all active route tracking sessions for user
      // TODO: Implement getUserRouteTrackingData in ApiService
      final routeData = <Map<String, dynamic>>[];
      
      if (routeData.isNotEmpty) {
        print('🔄 Found ${routeData.length} route tracking sessions to sync');
        
        // Update trip plans with route tracking data
        for (final route in routeData) {
          final tripPlanId = route['tripPlanId'] as String?;
          final visitedPlaces = route['visitedPlaces'] as List<String>? ?? [];
          
          if (tripPlanId != null && visitedPlaces.isNotEmpty) {
            await _syncRouteDataToTripPlan(tripPlanId, visitedPlaces);
          }
        }
        
        print('✅ Synced route tracking data from backend');
      }
    } catch (e) {
      print('⚠️ Failed to sync route tracking data: $e');
    }
  }

  /// Sync route data to trip plan
  Future<void> _syncRouteDataToTripPlan(String tripPlanId, List<String> visitedPlaceIds) async {
    try {
      // Find matching trip plan
      final tripPlanIndex = _tripPlans.indexWhere((tp) => tp.id == tripPlanId);
      if (tripPlanIndex == -1) return;
      
      final tripPlan = _tripPlans[tripPlanIndex];
      bool hasUpdates = false;
      
      // Update activities based on visited places
      for (int dayIndex = 0; dayIndex < tripPlan.dailyPlans.length; dayIndex++) {
        for (int activityIndex = 0; activityIndex < tripPlan.dailyPlans[dayIndex].activities.length; activityIndex++) {
          final activity = tripPlan.dailyPlans[dayIndex].activities[activityIndex];
          
          // Check if this activity matches any visited place
          final shouldBeVisited = visitedPlaceIds.any((placeId) => 
            activity.googlePlaceId == placeId ||
            activity.activityTitle.toLowerCase().contains(placeId.toLowerCase())
          );
          
          if (shouldBeVisited && !activity.isVisited) {
            await updateActivityVisitedStatus(tripPlanId, dayIndex, activityIndex, true);
            hasUpdates = true;
            print('🔄 Synced visit status: ${activity.activityTitle}');
          }
        }
      }
      
      if (hasUpdates) {
        print('✅ Updated trip plan with route tracking data: $tripPlanId');
      }
    } catch (e) {
      print('❌ Failed to sync route data to trip plan: $e');
    }
  }

  Future<void> _loadCachedData() async {
    print('📦 Loading cached data for offline support...');
    
    // Load cached trip plans
    final cachedTrips = await OfflineManager.getCachedTripPlans();
    if (cachedTrips.isNotEmpty) {
      _tripPlans = cachedTrips;
      print('✅ Loaded ${cachedTrips.length} cached trip plans');
    }
    
    // Load cached itineraries
    _itineraries = await _storageService.getItineraries();
    print('✅ Loaded ${_itineraries.length} cached itineraries');
    
    // Load cached places for offline support
    try {
      final cachedPlaces = await OfflineManager.getCachedPlaces();
      if (cachedPlaces.isNotEmpty) {
        _places = cachedPlaces;
        print('✅ Loaded ${cachedPlaces.length} cached places');
      }
    } catch (e) {
      print('❌ Error loading cached places: $e');
    }
    
    // Load cached deals
    try {
      final cachedDeals = await OfflineManager.getCachedDeals();
      if (cachedDeals.isNotEmpty) {
        _deals = cachedDeals;
        print('✅ Loaded ${cachedDeals.length} cached deals');
      }
    } catch (e) {
      print('❌ Error loading cached deals: $e');
    }
    
    // Load cached user
    final cachedUser = await OfflineManager.getCachedUser();
    if (cachedUser != null) {
      _currentUser = cachedUser;
      _isAuthenticated = true;
      print('✅ Loaded cached user: ${cachedUser.username}');
    }
    
    print('✅ Cached data loaded successfully');
    notifyListeners();
  }

  Future<void> _updateFavoritePlaces() async {
    try {
      // Get favorite places from storage
      final storedFavorites = await _storageService.getFavoritePlaces();
      _favoritePlaces = storedFavorites;
      print('✅ Updated favorite places: ${_favoritePlaces.length} from storage');
    } catch (e) {
      print('❌ Error loading favorite places from storage: $e');
      // Fallback to filtering current places
      _favoritePlaces = _places.where((place) => _favoriteIds.contains(place.id)).toList();
      print('⚠️ Fallback: ${_favoritePlaces.length} favorites from current places');
    }
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
  
  // Helper methods for AI preferences
  String _getUserType() {
    if (_currentUser?.travelStyle == TravelStyle.explorer) return 'Solo traveler';
    if (_currentUser?.travelStyle == TravelStyle.foodie) return 'Foodie';
    if (_currentUser?.travelStyle == TravelStyle.culture) return 'Culture enthusiast';
    if (_currentUser?.travelStyle == TravelStyle.nature) return 'Nature lover';
    return 'Solo traveler';
  }
  
  String _getUserVibe() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Relaxing';
    if (hour < 18) return 'Cultural';
    return 'Adventurous';
  }
  
  String _getUserLanguage() {
    return _currentUser?.language ?? 'English';
  }
  
  // Sync Firebase user with backend using token
  Future<void> _syncFirebaseUserWithBackend(User firebaseUser) async {
    try {
      final token = await firebaseUser.getIdToken();
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/auth/firebase-login'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ User synced with backend: ${data['user']?['username']}');
        
        // Update current user with backend data
        if (_currentUser != null && data['user'] != null) {
          final backendUser = data['user'];
          final updatedUser = _currentUser!.copyWith(
            mongoId: backendUser['_id'],
            username: backendUser['username'] ?? _currentUser!.username,
          );
          await _storageService.saveUser(updatedUser);
          _currentUser = updatedUser;
        }
      } else {
        print('⚠️ Backend sync failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error syncing user with backend: $e');
    }
  }
  
  // Create user profile in backend database
  Future<void> _createUserProfileInBackend(User firebaseUser, String username) async {
    try {
      final userData = {
        'firebaseUid': firebaseUser.uid,
        'username': username,
        'email': firebaseUser.email ?? '',
        'profilePicture': firebaseUser.photoURL,
        'tier': 'free',
        'subscriptionStatus': 'none',
        'homeCurrency': 'USD',
        'language': 'en',
        'hasCompletedWizard': false,
        'isAdmin': false,
        'selectedInterests': [],
        'favoritePlaces': [],
      };
      
      final response = await _apiService.createUser(userData);
      if (response != null) {
        print('✅ User profile created in backend database');
        
        // Update current user with backend data
        if (_currentUser != null) {
          final updatedUser = _currentUser!.copyWith(
            mongoId: response['_id'],
          );
          await _storageService.saveUser(updatedUser);
          _currentUser = updatedUser;
        }
      } else {
        print('⚠️ Failed to create user profile in backend');
      }
    } catch (e) {
      print('❌ Error creating user profile in backend: $e');
    }
  }
  
  // Ensure user profile exists in backend (for existing users)
  Future<void> _ensureUserProfileInBackend(User firebaseUser) async {
    try {
      // Check if user already exists in backend
      final existingUser = await _apiService.getUserByFirebaseUid(firebaseUser.uid);
      
      if (existingUser == null) {
        // User doesn't exist in backend, create profile
        print('🔄 Creating missing user profile in backend');
        await _createUserProfileInBackend(
          firebaseUser, 
          firebaseUser.displayName ?? firebaseUser.email?.split('@').first ?? 'User'
        );
      } else {
        print('✅ User profile already exists in backend');
        
        // Update current user with backend data
        if (_currentUser != null) {
          final updatedUser = _currentUser!.copyWith(
            mongoId: existingUser['_id'],
          );
          await _storageService.saveUser(updatedUser);
          _currentUser = updatedUser;
        }
      }
    } catch (e) {
      print('❌ Error ensuring user profile in backend: $e');
    }
  }
  
  Future<void> _sendFCMTokenToBackend() async {
    try {
      final fcmToken = NotificationService().fcmToken;
      if (fcmToken != null && _currentUser?.mongoId != null) {
        await _apiService.updateUser({
          'fcmToken': fcmToken,
        });
        print('✅ FCM token sent to backend');
      }
    } catch (e) {
      print('⚠️ Failed to send FCM token: $e');
    }
  }
}














