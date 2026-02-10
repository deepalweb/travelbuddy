import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:hive/hive.dart';
import '../models/place.dart';
import '../config/environment.dart';
import '../utils/debug_logger.dart';
import 'storage_service.dart';

class PlacesService {
  static final PlacesService _instance = PlacesService._internal();
  factory PlacesService() => _instance;
  PlacesService._internal() {
    DebugLogger.info('🚀 PlacesService initialized with backend URL: ${Environment.backendUrl}');
    // Force reset API counter on app start
    _dailyApiCalls = 0;
    _lastResetDate = DateTime.now();
    DebugLogger.info('🔄 API counter reset on initialization');
  }


  
  // Cache and rate limiting
  final Map<String, List<Place>> _cache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  final Map<String, DateTime> _lastApiCalls = {};
  final Map<String, Map<String, double>> _cacheLocations = {}; // Store lat/lng for each cache key
  static const Duration _cacheExpiry = Duration(days: 365); // Never expire - keep forever for offline access
  static const Duration _rateLimitDelay = Duration(milliseconds: 500);
  
  // Subscription limits
  int _dailyApiCalls = 0;
  DateTime _lastResetDate = DateTime.now();
  
  // Daily API limits by subscription tier (optimized for cost)
  static const Map<String, int> _subscriptionLimits = {
    'free': 10,      // 10 searches/day = ~$8/month
    'basic': 30,     // 30 searches/day = ~$24/month  
    'premium': 100,  // 100 searches/day = ~$80/month
    'pro': 300,      // 300 searches/day = ~$240/month
  };

  // Pagination state
  int _currentOffset = 0;
  bool _hasMoreResults = true;
  
  // Optimized: Cache + Category-specific queries
  Future<List<Place>> fetchPlacesPipeline({
    required double latitude,
    required double longitude,
    required String query,
    int radius = 20000,
    int topN = 150,
    int offset = 0,
    String? userType,
    String? vibe,
    String? language,
    bool forceRefresh = false, // User can manually refresh
    String? categoryFilter,
    bool loadMore = false, // NEW: Pagination support
  }) async {
    // Use actual query instead of hardcoded 'tourist attractions'
    final cacheKey = '${latitude.toStringAsFixed(2)}_${longitude.toStringAsFixed(2)}_$query';
    
    // Reset pagination on new search
    if (!loadMore) {
      _currentOffset = 0;
      _hasMoreResults = true;
    }
    
    // Check if location changed significantly (>5km)
    bool locationChanged = false;
    if (_cacheLocations.containsKey(cacheKey)) {
      final cachedLat = _cacheLocations[cacheKey]!['lat']!;
      final cachedLng = _cacheLocations[cacheKey]!['lng']!;
      locationChanged = hasLocationChangedSignificantly(cachedLat, cachedLng, latitude, longitude);
      
      if (locationChanged) {
        DebugLogger.log('📍 Location changed significantly - forcing refresh');
        forceRefresh = true;
      }
    }
    
    // Check cache first (unless user manually refreshed or location changed)
    if (!forceRefresh && _isValidCache(cacheKey)) {
      DebugLogger.log('⚡ Cache hit (${_cache[cacheKey]!.length} places) - Offline ready');
      final cached = _cache[cacheKey]!;
      return cached.skip(offset).take(topN).toList();
    }
    
    try {
      // Fetch places with actual query
      if (await _canMakeApiCall()) {
        DebugLogger.log('🔍 Fetching: $query');
        _lastApiCalls[cacheKey] = DateTime.now();
        await _incrementApiCall();
        
        // COST OPTIMIZATION: Only fetch 20 places (was 150), backend filters by rating
        // Pagination: Use offset for loading more
        final fetchOffset = loadMore ? _currentOffset : 0;
        final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, fetchOffset, 20)
            .timeout(const Duration(seconds: 8));
        
        // Update pagination state
        if (realPlaces.isNotEmpty) {
          _currentOffset = fetchOffset + realPlaces.length;
          _hasMoreResults = realPlaces.length >= 20;
        } else {
          _hasMoreResults = false;
        }
        
        if (realPlaces.isNotEmpty) {
          final filtered = realPlaces
              .where((p) => _isWithinRadius(p, latitude, longitude, radius))
              .toList();
          
          // Save to cache and offline storage only
          _updateCache(cacheKey, filtered);
          _cacheLocations[cacheKey] = {'lat': latitude, 'lng': longitude};
          _saveToOfflineStorage(cacheKey, filtered);
          
          DebugLogger.log('✅ Cached ${filtered.length} places');
          
          return filtered.skip(offset).take(topN).toList();
        }
      } else {
        DebugLogger.log('📦 API limit reached - loading from cache/offline storage');
        
        // Try cache first
        if (_cache.containsKey(cacheKey)) {
          DebugLogger.log('📦 Using memory cache (${_cache[cacheKey]!.length} places)');
          return _cache[cacheKey]!.skip(offset).take(topN).toList();
        }
        
        // Try offline storage
        final offline = await _loadFromOfflineStorage(cacheKey);
        if (offline.isNotEmpty) {
          DebugLogger.log('💾 Using offline storage (${offline.length} places)');
          return offline.skip(offset).take(topN).toList();
        }
      }
      
      return [];
      
    } catch (e) {
      DebugLogger.error('Places fetch failed: $e');
    }
    
    // Try cache first
    if (_cache.containsKey(cacheKey)) {
      DebugLogger.log('📦 Using memory cache (${_cache[cacheKey]!.length} places)');
      return _cache[cacheKey]!.skip(offset).take(topN).toList();
    }
    
    // Try offline storage
    final offline = await _loadFromOfflineStorage(cacheKey);
    if (offline.isNotEmpty) {
      DebugLogger.log('💾 Using offline storage (${offline.length} places)');
      return offline.skip(offset).take(topN).toList();
    }
    
    return [];
  }
  

  
  // Filter places by category keywords (post-processing)
  List<Place> _filterByCategory(List<Place> places, String category, String originalQuery) {
    final categoryKeywords = {
      'food': ['restaurant', 'cafe', 'coffee', 'bar', 'food', 'dining', 'eatery', 'bakery', 'bistro'],
      'landmarks': ['landmark', 'monument', 'attraction', 'historic', 'tower', 'temple', 'church', 'mosque'],
      'culture': ['museum', 'gallery', 'art', 'cultural', 'theater', 'theatre', 'auditorium'],
      'nature': ['park', 'garden', 'nature', 'outdoor', 'beach', 'trail', 'hiking', 'forest'],
      'shopping': ['shopping', 'mall', 'market', 'store', 'boutique', 'shop', 'bazaar'],
      'spa': ['spa', 'wellness', 'massage', 'beauty', 'salon', 'therapy'],
    };
    
    if (category == 'all' || !categoryKeywords.containsKey(category.toLowerCase())) {
      return places;
    }
    
    final keywords = categoryKeywords[category.toLowerCase()]!;
    
    return places.where((place) {
      final searchText = '${place.name} ${place.type} ${place.description}'.toLowerCase();
      return keywords.any((keyword) => searchText.contains(keyword));
    }).toList();
  }
  
  // Check if place is within radius (strict filtering)
  bool _isWithinRadius(Place place, double centerLat, double centerLng, int radiusMeters) {
    if (place.latitude == null || place.longitude == null) return false;
    
    const earthRadius = 6371000; // meters
    final dLat = _toRadians(place.latitude! - centerLat);
    final dLng = _toRadians(place.longitude! - centerLng);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(centerLat)) * math.cos(_toRadians(place.latitude!)) *
        math.sin(dLng / 2) * math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    final distance = earthRadius * c;
    return distance <= radiusMeters;
  }
  
  double _toRadians(double degrees) => degrees * math.pi / 180;
  

  
  Future<List<Place>> _fetchRealPlaces(double lat, double lng, String query, int radius, [int offset = 0, int limit = 150]) async {
    final mobileUrl = '${Environment.backendUrl}/api/places/mobile/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=$limit';
    DebugLogger.log('🔍 API: $query within ${radius}m (limit: $limit)');
    DebugLogger.log('📍 Location: $lat, $lng');
    DebugLogger.log('🌐 URL: $mobileUrl');
    
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(mobileUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      DebugLogger.log('📡 Response status: ${response.statusCode}');
      DebugLogger.log('📦 Response body: ${response.body.substring(0, math.min(500, response.body.length))}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        DebugLogger.log('📦 Backend response: status=${data['status']}, results=${data['results']?.length ?? 0}');
        
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> places = data['results'];
          DebugLogger.log('✅ API returned ${places.length} places');
          
          return places.map((json) => Place.fromJson({
            ...json,
            'description': json['description'] ?? json['editorial_summary']?['overview'] ?? '',
            'localTip': 'Check opening hours before visiting',
            'handyPhrase': 'Hello, thank you!',
          })).toList();
        } else {
          DebugLogger.error('Backend returned status: ${data['status']}, message: ${data['message']}');
        }
      } else {
        DebugLogger.error('API HTTP error: ${response.statusCode}');
      }
    } catch (e) {
      DebugLogger.error('API failed: $e');
    }
    return [];
  }
  
  Future<http.Response> _makeRequestWithRetry(Future<http.Response> Function() request) async {
    try {
      return await request().timeout(const Duration(seconds: 8));
    } on SocketException catch (e) {
      DebugLogger.error('Network error: $e');
      throw Exception('Network error: $e');
    } on TimeoutException catch (e) {
      DebugLogger.error('Request timeout: $e');
      throw Exception('Request timeout: $e');
    } catch (e) {
      DebugLogger.error('Request failed: $e');
      throw Exception('Request failed: $e');
    }
  }


  
  // Cache management
  bool _isValidCache(String key) {
    if (!_cache.containsKey(key) || !_cacheTimestamps.containsKey(key)) return false;
    return DateTime.now().difference(_cacheTimestamps[key]!) < _cacheExpiry;
  }
  
  void _updateCache(String key, List<Place> places) {
    _cache[key] = places;
    _cacheTimestamps[key] = DateTime.now();
  }
  
  // Offline storage using Hive
  Future<void> _saveToOfflineStorage(String key, List<Place> places) async {
    try {
      // Store as JSON for multiple places
      final jsonBox = await Hive.openBox('places_cache');
      await jsonBox.put(key, places.map((p) => {
        'id': p.id,
        'name': p.name,
        'type': p.type,
        'rating': p.rating,
        'address': p.address,
        'photoUrl': p.photoUrl,
        'description': p.description,
        'localTip': p.localTip,
        'latitude': p.latitude,
        'longitude': p.longitude,
      }).toList());
      
      DebugLogger.log('💾 Saved ${places.length} places to offline storage');
    } catch (e) {
      DebugLogger.log('⚠️ Offline storage failed: $e');
    }
  }
  
  Future<List<Place>> _loadFromOfflineStorage(String key) async {
    try {
      final jsonBox = await Hive.openBox('places_cache');
      final data = jsonBox.get(key);
      
      if (data != null && data is List && data.isNotEmpty) {
        final places = data.map((json) {
          final Map<String, dynamic> jsonMap = Map<String, dynamic>.from(json as Map);
          return Place.fromJson(jsonMap);
        }).toList();
        DebugLogger.log('💾 Loaded ${places.length} places from offline storage');
        return places;
      }
    } catch (e) {
      DebugLogger.log('⚠️ Offline load failed: $e');
    }
    return [];
  }
  
  bool _isRateLimited(String key) {
    if (!_lastApiCalls.containsKey(key)) return false;
    return DateTime.now().difference(_lastApiCalls[key]!) < _rateLimitDelay;
  }
  
  void clearCache() {
    _cache.clear();
    _cacheTimestamps.clear();
    DebugLogger.log('🗑️ Memory cache cleared');
  }
  
  Future<void> clearOfflineStorage() async {
    try {
      final jsonBox = await Hive.openBox('places_cache');
      await jsonBox.clear();
      DebugLogger.log('🗑️ Offline storage cleared');
    } catch (e) {
      DebugLogger.log('⚠️ Clear offline failed: $e');
    }
  }
  
  // Subscription-based API limiting
  Future<bool> _canMakeApiCall() async {
    _resetDailyCountIfNeeded();
    final userTier = await _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    final canCall = _dailyApiCalls < limit;
    
    if (!canCall) {
      print('! API limit reached ($userTier: $_dailyApiCalls/$limit) - using cached data');
    }
    
    return canCall;
  }
  
  Future<void> _incrementApiCall() async {
    _resetDailyCountIfNeeded();
    _dailyApiCalls++;
    final userTier = await _getUserSubscriptionTier();
    print('📊 API calls today: $_dailyApiCalls/${_subscriptionLimits[userTier]}');
  }
  
  void _resetDailyCountIfNeeded() {
    final now = DateTime.now();
    if (now.day != _lastResetDate.day || now.month != _lastResetDate.month || now.year != _lastResetDate.year) {
      _dailyApiCalls = 0;
      _lastResetDate = now;
      print('🔄 Daily API count reset');
    }
  }
  
  Future<String> _getUserSubscriptionTier() async {
    try {
      final storageService = StorageService();
      final user = await storageService.getUser();
      return user?.tier.name ?? 'free';
    } catch (e) {
      return 'free';
    }
  }
  
  Future<int> getRemainingApiCalls() async {
    _resetDailyCountIfNeeded();
    final userTier = await _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    return (limit - _dailyApiCalls).clamp(0, limit);
  }
  
  Future<Map<String, dynamic>> getApiUsageStats() async {
    _resetDailyCountIfNeeded();
    final userTier = await _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    
    return {
      'tier': userTier,
      'used': _dailyApiCalls,
      'limit': limit,
      'remaining': await getRemainingApiCalls(),
      'percentage': (_dailyApiCalls / limit * 100).clamp(0, 100).toInt(),
    };
  }
  
  // Manual reset for testing
  void resetApiCounter() {
    _dailyApiCalls = 0;
    _lastResetDate = DateTime.now();
    DebugLogger.log('🔄 API counter manually reset');
  }
  
  void _notifyLimitReached() {
    // This will be called by UI to show upgrade dialog
    print('💡 Consider upgrading subscription for more API calls');
  }

  // Check if user location changed significantly (>5km)
  bool hasLocationChangedSignificantly(double oldLat, double oldLng, double newLat, double newLng) {
    const earthRadius = 6371000; // meters
    final dLat = _toRadians(newLat - oldLat);
    final dLng = _toRadians(newLng - oldLng);
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(oldLat)) * math.cos(_toRadians(newLat)) *
        math.sin(dLng / 2) * math.sin(dLng / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    final distance = earthRadius * c;
    return distance > 5000; // 5km threshold
  }

  // Get cache age for a location
  Duration? getCacheAge(double latitude, double longitude, String query) {
    final cacheKey = '${latitude.toStringAsFixed(2)}_${longitude.toStringAsFixed(2)}_$query';
    if (_cacheTimestamps.containsKey(cacheKey)) {
      return DateTime.now().difference(_cacheTimestamps[cacheKey]!);
    }
    return null;
  }
  
  // Check if more results available
  bool get hasMoreResults => _hasMoreResults;
  
  // Cache place details for instant detail screen
  final Map<String, Place> _placeDetailsCache = {};
  
  Future<void> cachePlaceDetails(Place place) async {
    _placeDetailsCache[place.id] = place;
    await _saveToOfflineStorage('place_${place.id}', [place]);
  }
  
  Future<Place?> getCachedPlaceDetails(String placeId) async {
    if (_placeDetailsCache.containsKey(placeId)) {
      return _placeDetailsCache[placeId];
    }
    final cached = await _loadFromOfflineStorage('place_$placeId');
    return cached.isNotEmpty ? cached.first : null;
  }



  // Legacy methods for backward compatibility
  Future<List<Place>> searchPlaces({
    required String query,
    String? category,
    double? latitude,
    double? longitude,
    int radius = 20000,
    String? userType,
    String? vibe,
    String? language,
  }) async {
    if (latitude == null || longitude == null) return [];
    
    print('🔍 Using specific query for search: $query');
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
      topN: 50,
      userType: userType,
      vibe: vibe,
      language: language,
    );
  }

  Future<List<Place>> getNearbyPlaces({
    required double latitude,
    required double longitude,
    String category = 'all',
    int radius = 20000,
    String? userType,
    String? vibe,
    String? language,
  }) async {
    final query = category == 'all' ? 'points of interest' : category;
    print('🔍 Using specific query for nearby search: $query');
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
      topN: 60,
      userType: userType,
      vibe: vibe,
      language: language,
    );
  }
  
  // Optimized batch: Single API call + local filtering
  Future<Map<String, List<Place>>> fetchPlacesBatch({
    required double latitude,
    required double longitude,
    required Map<String, String> categories,
    int radius = 20000,
    bool forceRefresh = false,
  }) async {
    try {
      // Single API call for all tourist attractions
      final allPlaces = await fetchPlacesPipeline(
        latitude: latitude,
        longitude: longitude,
        query: 'tourist attraction',
        radius: radius,
        topN: 60,
        forceRefresh: forceRefresh,
      );
      
      if (allPlaces.isEmpty) {
        DebugLogger.log('⚠️ No places found');
        return {for (var key in categories.keys) key: <Place>[]};
      }
      
      // Filter locally by category
      final Map<String, List<Place>> results = {};
      for (final entry in categories.entries) {
        final filtered = _filterByCategory(allPlaces, entry.key, entry.value);
        results[entry.key] = filtered.take(15).toList();
        DebugLogger.log('✅ ${entry.key}: ${filtered.length} places (filtered locally)');
      }
      
      return results;
      
    } catch (e) {
      DebugLogger.error('Batch fetch failed: $e');
      return {for (var key in categories.keys) key: <Place>[]};
    }
  }

  Future<List<Place>> getFavoritePlaces() async {
    return [];
  }

  Future<void> toggleFavorite(String placeId) async {
    // TODO: Implement
  }

  Future<Place> getPlaceDetails(String placeId) async {
    final response = await http.get(
      Uri.parse('${Environment.backendUrl}/api/places/details?place_id=$placeId'),
    );
    if (response.statusCode == 200) {
      return Place.fromJson(json.decode(response.body));
    }
    throw Exception('Failed to load place details');
  }
}