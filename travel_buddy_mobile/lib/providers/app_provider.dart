import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/user.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../models/weather.dart';
import '../models/local_discovery.dart';
import '../models/personalized_suggestion.dart';
import '../models/deal.dart' as deal_model;
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import '../services/location_service.dart';
import '../services/permission_service.dart';
import '../services/debug_service.dart';
import '../services/mock_location_service.dart';
import '../services/personalized_suggestions_service.dart' as suggestions_service;
import '../services/local_discoveries_service.dart' as discoveries_service;
import '../services/weather_service.dart' as weather_service;
import '../services/places_service.dart';
import '../services/ai_service.dart';
import '../services/image_service.dart';
import '../services/settings_service.dart';
import '../services/notification_service.dart';
import '../services/error_handler_service.dart';
import '../services/safety_service.dart';
import '../models/emergency_service.dart';
import '../models/dish.dart';

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
  final SafetyService _safetyService = SafetyService();
  
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

  // Trip State
  List<TripPlan> _recentTrips = [];
  List<TripPlan> get recentTrips => _recentTrips;

  List<Deal> _activeDeals = [];
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
  bool _isHomeLoading = false;

  // Safety State
  List<EmergencyService> _nearbyPoliceStations = [];
  List<EmergencyService> _nearbyHospitals = [];
  bool _isSafetyLoading = false;
  String? _safetyError;

  // Local Dishes State
  List<Dish> _localDishes = [];
  bool _isDishesLoading = false;
  String? _dishesError;

  // Getters
  CurrentUser? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  
  Position? get currentLocation => _currentLocation;
  bool get isLocationLoading => _isLocationLoading;
  String? get locationError => _locationError;
  
  List<Place> get places => _places;
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
  bool get isHomeLoading => _isHomeLoading;
  
  List<EmergencyService> get nearbyPoliceStations => _nearbyPoliceStations;
  List<EmergencyService> get nearbyHospitals => _nearbyHospitals;
  bool get isSafetyLoading => _isSafetyLoading;
  String? get safetyError => _safetyError;
  
  List<Dish> get localDishes => _localDishes;
  bool get isDishesLoading => _isDishesLoading;
  String? get dishesError => _dishesError;
  
  int get currentTabIndex => _currentTabIndex;
  bool get isDarkMode => _isDarkMode;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get dealAlertsEnabled => _dealAlertsEnabled;
  
  AiService get aiService => _aiService;
  SafetyService get safetyService => _safetyService;
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
      
      // Test API connection first (only if app is active)
      if (_isAppActive) {
        await DebugService.testApiConnection();
      }
      
      // Initialize services
      _aiService.initialize();
      _imageService.initialize();
      await _notificationService.initialize();
      await SettingsService.initialize();
      await _storageService.initialize();
      
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
        loadEmergencyServices(),
        loadLocalDishes(),
      ]);
    } catch (e) {
      print('Error loading home data: $e');
    } finally {
      _isHomeLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadPersonalizedSuggestions() async {
    // Suggestions are now handled by API service
  }

  Future<void> _loadLocalDiscoveries() async {
    final discoveries = await _localDiscoveriesService.generateLocalDiscoveries('Current City');
    _localDiscoveries = discoveries.isNotEmpty ? discoveries.first.toModelLocalDiscovery() : null;
  }

  Future<void> _loadWeatherInfo() async {
    if (_currentLocation != null) {
      final weather = await _weatherService.getCurrentWeather(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
      );
      _weatherInfo = weather?.toModelWeatherInfo();
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
      // Ensure storage is initialized first
      await _storageService.initialize();
      
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

  Future<bool> updateSubscription(SubscriptionTier tier, {bool isFreeTrial = true}) async {
    if (_currentUser == null) return false;
    
    try {
      final now = DateTime.now();
      final trialEnd = now.add(const Duration(days: 7));
      
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
        // Use mock location as fallback for testing
        print('🔄 Using mock location for testing');
        _currentLocation = MockLocationService.getMockPosition();
        _locationError = 'Using mock location (San Francisco) for testing';
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

    // Check if we have valid cached data for current location
    if (!loadMore && searchQuery.isEmpty) {
      final cachedData = await _storageService.getCachedPlacesForLocation(
        _currentLocation!.latitude,
        _currentLocation!.longitude,
        _selectedCategory,
        maxAgeHours: 1, // Cache valid for 1 hour
        maxDistanceKm: 2.0, // Cache valid within 2km
      );
      
      if (cachedData.isNotEmpty) {
        print('💾 Using cached places (${cachedData.length}) - within distance/time threshold');
        _places = cachedData;
        _placesError = null;
        notifyListeners();
        return; // Skip API call - use cache
      }
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
        );
        print('📂 Category results for: $_selectedCategory');
      } else {
        // Load diverse, high-quality places with smart distribution
        final hour = DateTime.now().hour;
        final isEvening = hour >= 18;
        final isMorning = hour < 12;
        
        List<Place> allPlaces = [];
        
        if (isEvening) {
          // Evening: dining + nightlife + attractions
          final restaurants = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['restaurants']),
            topN: 6,
          );
          
          final bars = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['bars', 'nightlife']),
            topN: 3,
          );
          
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: 3,
          );
          
          allPlaces = [...restaurants, ...bars, ...attractions];
        } else if (isMorning) {
          // Morning: cafes + attractions + culture + nature
          final cafes = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['cafes']),
            topN: 4,
          );
          
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: 4,
          );
          
          final culture = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['culture']),
            topN: 2,
          );
          
          final nature = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['nature']),
            topN: 2,
          );
          
          allPlaces = [...cafes, ...attractions, ...culture, ...nature];
        } else {
          // Afternoon: balanced mix of everything
          final attractions = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['attractions']),
            topN: 4,
          );
          
          final restaurants = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['restaurants']),
            topN: 3,
          );
          
          final culture = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['culture']),
            topN: 2,
          );
          
          final nature = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['nature']),
            topN: 2,
          );
          
          final shopping = await placesService.fetchPlacesPipeline(
            latitude: _currentLocation!.latitude,
            longitude: _currentLocation!.longitude,
            query: _expandKeywords(['shopping']),
            topN: 1,
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
            
        // Sort by rating
        places.sort((a, b) => b.rating.compareTo(a.rating));
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
      
      if (places.isNotEmpty) {
        print('🏛️ Top places: ${places.take(3).map((p) => '${p.name} (${p.rating}⭐)').join(", ")}');
      }
      if (loadMore) {
        final existingIds = _places.map((p) => p.id).toSet();
        final newPlaces = places.where((p) => !existingIds.contains(p.id)).toList();
        _places.addAll(newPlaces);
        _currentPage++;
        _hasMorePlaces = newPlaces.isNotEmpty;
      } else {
        _places = places;
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
      case 'landmarks':
        return _expandKeywords(['landmarks']);
      case 'culture':
        return _expandKeywords(['culture']);
      case 'nature':
        return _expandKeywords(['nature']);
      case 'food':
        return isEvening ? _expandKeywords(['restaurants', 'fine dining']) : _expandKeywords(['restaurants', 'cafes']);
      case 'entertainment':
        return isEvening ? _expandKeywords(['bars', 'nightlife']) : _expandKeywords(['entertainment']);
      case 'lodging':
        return _expandKeywords(['hotels']);
      case 'shopping':
        return _expandKeywords(['shopping']);
      case 'all':
      default:
        return _expandKeywords(['attractions']);
    }
  }
  
  String _expandKeywords(List<String> keywords) {
    final expanded = <String>{};
    
    for (final keyword in keywords) {
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

  Future<void> searchPlaces(String query) async {
    print('🔍 searchPlaces called with: "$query"');
    
    if (query.isEmpty) {
      // Empty search - reload default places
      await loadNearbyPlaces();
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

  void setSelectedRadius(int radius) {
    _selectedRadius = radius;
    SettingsService.setSearchRadius(radius);
    _storageService.setSelectedRadius(radius);
    notifyListeners();
    loadNearbyPlaces();
  }

  // Trip Methods
  Future<void> loadTripPlans() async {
    if (_currentUser?.mongoId == null) return;

    _isTripsLoading = true;
    notifyListeners();

    try {
      final tripPlans = await _apiService.getUserTripPlans(_currentUser!.mongoId!);
      _tripPlans = tripPlans;
      
      // Cache locally
      for (final trip in tripPlans) {
        await _storageService.saveTripPlan(trip);
      }
    } catch (e) {
      // Load from cache if API fails
      _tripPlans = await _storageService.getTripPlans();
    } finally {
      _isTripsLoading = false;
      notifyListeners();
    }
  }

  Future<void> saveTripPlan(TripPlan tripPlan) async {
    await _storageService.saveTripPlan(tripPlan);
    
    if (_currentUser?.mongoId != null) {
      await _apiService.saveTripPlan(_currentUser!.mongoId!, tripPlan);
    }
    
    _tripPlans.add(tripPlan);
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
      final deals = await _apiService.getActiveDeals();
      final newDealsCount = deals.length - _deals.length;
      _deals = deals;
      
      if (newDealsCount > 0 && SettingsService.dealAlertsEnabled) {
        await _notificationService.showLocalNotification(
          'New Deals Available!',
          '$newDealsCount new deals found near you',
        );
      }
      
      debugPrint('✅ Loaded ${deals.length} deals');
    } catch (e) {
      debugPrint('❌ Error loading deals: $e');
      _dealsError = 'Failed to load deals: ${e.toString()}';
    } finally {
      _isDealsLoading = false;
      notifyListeners();
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
    debugPrint('🔄 Force refresh places - bypassing cache');
    _places.clear();
    _currentPage = 1;
    _hasMorePlaces = true;
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
      // Only load cached trips and itineraries, NOT places
      // Places should always be fresh from API
      _tripPlans = await _storageService.getTripPlans() ?? [];
      _itineraries = await _storageService.getItineraries() ?? [];
      
      print('📱 Loaded cached trips and itineraries only (no places)');
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
      // Generate AI description
      final description = await _aiService.generatePlaceDescription(place);
      
      // Generate local tip
      final localTip = await _aiService.generateLocalTip(place);
      
      // Generate handy phrase (basic for now)
      final handyPhrase = _generateHandyPhrase(place.type);
      
      return Place(
        id: place.id,
        name: place.name,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        rating: place.rating,
        type: place.type,
        photoUrl: place.photoUrl,
        description: description.isNotEmpty ? description : place.description,
        localTip: localTip.isNotEmpty ? localTip : 'Check opening hours before visiting.',
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

  // Safety Methods
  Future<void> loadEmergencyServices() async {
    // Skip API calls if app is not active
    if (!_isAppActive) {
      print('🚫 Skipping emergency services API call - app is inactive');
      return;
    }
    
    if (_currentLocation == null) return;

    _isSafetyLoading = true;
    _safetyError = null;
    notifyListeners();

    try {
      final policeStations = await _apiService.getNearbyPoliceStations(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        radius: 5000,
      );

      final hospitals = await _apiService.getNearbyHospitals(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        radius: 5000,
      );

      _nearbyPoliceStations = policeStations.take(2).toList();
      _nearbyHospitals = hospitals.take(2).toList();
      
      print('✅ Loaded ${_nearbyPoliceStations.length} police stations and ${_nearbyHospitals.length} hospitals');
    } catch (e) {
      print('❌ Error loading emergency services: $e');
      _safetyError = 'Failed to load emergency services';
    } finally {
      _isSafetyLoading = false;
      notifyListeners();
    }
  }

  Future<bool> makeEmergencyCall(String phoneNumber) async {
    return await _safetyService.makePhoneCall(phoneNumber);
  }

  Future<bool> sendSOSAlert() async {
    if (_currentLocation == null) {
      await _notificationService.showLocalNotification(
        'SOS Alert Failed',
        'Location not available. Please enable location services.',
      );
      return false;
    }
    
    try {
      final location = '${_currentLocation!.latitude}, ${_currentLocation!.longitude}';
      final locationName = 'Current Location'; // Could be enhanced with reverse geocoding
      
      // Send SOS to emergency contacts
      final contacts = _safetyService.emergencyContacts;
      if (contacts.isEmpty) {
        await _notificationService.showLocalNotification(
          'SOS Alert',
          'No emergency contacts found. Please add emergency contacts first.',
        );
        return false;
      }
      
      // Create SOS message
      final sosMessage = 'EMERGENCY ALERT! I need help. My location: $locationName ($location). Please contact me immediately or call emergency services.';
      
      // Send to all emergency contacts
      bool success = true;
      for (final contact in contacts) {
        final result = await _safetyService.sendSOSMessage(contact.phoneNumber, sosMessage);
        if (!result) success = false;
      }
      
      // Show confirmation
      await _notificationService.showLocalNotification(
        'SOS Alert Sent',
        'Emergency alert sent to ${contacts.length} contacts',
      );
      
      return success;
    } catch (e) {
      print('Error sending SOS alert: $e');
      await _notificationService.showLocalNotification(
        'SOS Alert Failed',
        'Failed to send emergency alert. Please try again.',
      );
      return false;
    }
  }

  Future<bool> shareCurrentLocation() async {
    if (_currentLocation == null) {
      await _notificationService.showLocalNotification(
        'Location Share Failed',
        'Location not available. Please enable location services.',
      );
      return false;
    }
    
    try {
      final location = '${_currentLocation!.latitude}, ${_currentLocation!.longitude}';
      final googleMapsUrl = 'https://maps.google.com/maps?q=$location';
      final message = 'Here is my current location: $googleMapsUrl';
      
      final result = await _safetyService.shareLocation(message);
      
      if (result) {
        await _notificationService.showLocalNotification(
          'Location Shared',
          'Your location has been shared successfully',
        );
      }
      
      return result;
    } catch (e) {
      print('Error sharing location: $e');
      return false;
    }
  }

  void addEmergencyContact(String name, String phoneNumber, String relationship) {
    final contact = EmergencyContact(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      phoneNumber: phoneNumber,
      relationship: relationship,
    );
    _safetyService.addEmergencyContact(contact);
    notifyListeners();
  }

  List<EmergencyContact> get emergencyContacts => _safetyService.emergencyContacts;

  void removeEmergencyContact(String contactId) {
    _safetyService.removeEmergencyContact(contactId);
    notifyListeners();
  }

  // Local Dishes Methods
  Future<void> loadLocalDishes() async {
    print('🍽️ loadLocalDishes() called');
    
    // Skip API calls if app is not active
    if (!_isAppActive) {
      print('🚫 Skipping dishes API call - app is inactive');
      return;
    }
    
    if (_currentLocation == null) {
      print('❌ No location available for dishes');
      return;
    }

    print('📍 Location: ${_currentLocation!.latitude}, ${_currentLocation!.longitude}');
    
    _isDishesLoading = true;
    _dishesError = null;
    notifyListeners();

    try {
      print('🔄 Calling API service...');
      final dishes = await _apiService.getLocalDishes(
        latitude: _currentLocation!.latitude,
        longitude: _currentLocation!.longitude,
        cuisine: 'local',
        limit: 8,
      );

      _localDishes = dishes;
      print('✅ Loaded ${_localDishes.length} local dishes');
      
      if (_localDishes.isNotEmpty) {
        print('🥘 First dish: ${_localDishes[0].name}');
      }
    } catch (e) {
      print('❌ Error loading local dishes: $e');
      _dishesError = 'Failed to load local dishes';
    } finally {
      _isDishesLoading = false;
      print('📊 Dishes loading finished. Count: ${_localDishes.length}');
      notifyListeners();
    }
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
            loadLocalDishes(),
            loadEmergencyServices(),
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
}