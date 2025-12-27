import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import 'package:hive/hive.dart';
import '../models/place.dart';
import '../config/environment.dart';
import '../utils/debug_logger.dart';
import 'gemini_places_service.dart';
import 'storage_service.dart';

class PlacesService {
  static final PlacesService _instance = PlacesService._internal();
  factory PlacesService() => _instance;
  PlacesService._internal() {
    DebugLogger.info('🚀 PlacesService initialized with backend URL: ${Environment.backendUrl}');
  }

  final AzureAIPlacesService _azureAIService = AzureAIPlacesService();
  
  // Cache and rate limiting
  final Map<String, List<Place>> _cache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  final Map<String, DateTime> _lastApiCalls = {};
  static const Duration _cacheExpiry = Duration(minutes: 30); // Longer cache for better UX
  static const Duration _rateLimitDelay = Duration(milliseconds: 500); // Faster rate limit
  
  // Subscription limits
  int _dailyApiCalls = 0;
  DateTime _lastResetDate = DateTime.now();
  
  // Daily API limits by subscription tier
  static const Map<String, int> _subscriptionLimits = {
    'free': 1,
    'basic': 5, 
    'premium': 20,
    'pro': 50,
  };

  // Optimized: Cache + Tourist attraction base query
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
    bool forceRefresh = false,
    String? categoryFilter,
  }) async {
    // Use simple but effective query - Google will understand context
    final baseQuery = 'tourist attractions';
    final cacheKey = '${latitude.toStringAsFixed(2)}_${longitude.toStringAsFixed(2)}_$baseQuery';
    
    // CACHE DISABLED: Always fetch fresh until backend returns more places
    // if (!forceRefresh && _isValidCache(cacheKey)) {
    //   DebugLogger.log('⚡ INSTANT: Cache hit (${_cache[cacheKey]!.length} places)');
    //   final cached = _cache[cacheKey]!;
    //   
    //   if (categoryFilter != null && categoryFilter != 'all') {
    //     final filtered = _filterByCategory(cached, categoryFilter, query);
    //     DebugLogger.log('🎯 Filtered to $categoryFilter: ${filtered.length} places');
    //     return filtered.take(topN).toList();
    //   }
    //   
    //   return cached.take(topN).toList();
    // }
    
    // Rate limiting check
    if (_isRateLimited(cacheKey)) {
      DebugLogger.log('⏱️ Rate limited, returning cached/empty');
      return _cache[cacheKey]?.take(topN).toList() ?? [];
    }
    
    try {
      // Fetch tourist attractions (single API call)
      if (await _canMakeApiCall()) {
        DebugLogger.log('🔍 Fetching tourist attractions (base query)');
        _lastApiCalls[cacheKey] = DateTime.now();
        await _incrementApiCall();
        
        final realPlaces = await _fetchRealPlaces(latitude, longitude, baseQuery, radius, offset, 60)
            .timeout(const Duration(seconds: 8));
        
        if (realPlaces.isNotEmpty) {
          final filtered = realPlaces
              .where((p) => p.rating >= 3.0 && _isWithinRadius(p, latitude, longitude, radius))
              .toList();
          
          // Enrich with AI descriptions (async, non-blocking)
          _enrichPlacesWithAI(filtered);
          
          // Save to cache and offline storage
          _updateCache(cacheKey, filtered);
          _saveToOfflineStorage(cacheKey, filtered);
          
          DebugLogger.log('✅ Cached ${filtered.length} places (30-min expiry)');
          
          // Filter by category if specified
          if (categoryFilter != null && categoryFilter != 'all') {
            final categoryFiltered = _filterByCategory(filtered, categoryFilter, query);
            return categoryFiltered.take(topN).toList();
          }
          
          return filtered.take(topN).toList();
        }
      }
      
      // Fallback: Load from offline storage
      DebugLogger.log('💾 Loading from offline storage');
      final offline = await _loadFromOfflineStorage(cacheKey);
      if (offline.isNotEmpty) {
        _updateCache(cacheKey, offline);
        return offline.take(topN).toList();
      }
      
      return [];
      
    } catch (e) {
      DebugLogger.error('Places fetch failed: $e');
      
      // Try cache first
      if (_cache.containsKey(cacheKey)) {
        return _cache[cacheKey]!.take(topN).toList();
      }
      
      // Try offline storage
      final offline = await _loadFromOfflineStorage(cacheKey);
      if (offline.isNotEmpty) {
        return offline.take(topN).toList();
      }
      
      return [];
    }
  }
  
  // Background refresh disabled
  void _refreshCacheInBackground(double lat, double lng, String query, int radius, int topN, String cacheKey) async {
    // Disabled - not needed
  }
  
  // Enrich real places with AI descriptions (non-blocking)
  void _enrichPlacesWithAI(List<Place> places) async {
    if (places.isEmpty) return;
    
    try {
      DebugLogger.log('🤖 Enriching ${places.length} places with AI descriptions');
      await _azureAIService.enrichPlaces(places);
      DebugLogger.log('✅ AI enrichment complete');
    } catch (e) {
      DebugLogger.log('⚠️ AI enrichment failed (non-critical): $e');
    }
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
  
  // Enhanced AI Places using Gemini service
  Future<List<Place>> _fetchAIPlaces(double lat, double lng, String query, int radius, String? userType, String? vibe, String? language) async {
    try {
      DebugLogger.log('🤖 Using Azure OpenAI for places generation (cost-effective)');
      
      final places = await _azureAIService.generatePlaces(
        latitude: lat,
        longitude: lng,
        category: query,
        limit: 50,
        userType: userType ?? 'Solo traveler',
        vibe: vibe ?? 'Cultural',
        language: language ?? 'English',
      );
      
      if (places.isNotEmpty) {
        DebugLogger.log('🤖 Azure OpenAI generated ${places.length} high-quality places');
        return places;
      }
      
      // Fallback to backend AI if Azure OpenAI fails
      return await _fetchBackendAIPlaces(lat, lng, query, radius, userType, vibe, language);
      
    } catch (e) {
      DebugLogger.log('❌ Azure OpenAI failed: $e, trying backend AI');
      return await _fetchBackendAIPlaces(lat, lng, query, radius, userType, vibe, language);
    }
  }
  
  // Fallback backend AI method
  Future<List<Place>> _fetchBackendAIPlaces(double lat, double lng, String query, int radius, String? userType, String? vibe, String? language) async {
    final aiLimit = 50;
    final url = '${Environment.backendUrl}/api/places/ai/nearby?lat=$lat&lng=$lng&category=$query&radius=$radius&limit=$aiLimit';
    final params = <String>[];
    if (userType != null) params.add('userType=${Uri.encodeComponent(userType)}');
    if (vibe != null) params.add('vibe=${Uri.encodeComponent(vibe)}');
    if (language != null) params.add('language=${Uri.encodeComponent(language)}');
    
    final finalUrl = params.isEmpty ? url : '$url&${params.join('&')}';
    
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(finalUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> places = data['results'];
          return places.map((json) => Place.fromJson({
            ...json,
            'ai_generated': true,
            'description': json['description'] ?? 'A great place to visit in the area.',
            'localTip': json['tips'] ?? 'Check opening hours before visiting.',
            'handyPhrase': 'Hello, thank you!',
          })).toList();
        }
      }
    } catch (e) {
      print('❌ Backend AI Places API failed: $e');
    }
    return [];
  }
  
  // Get full travel plan content from AI
  Future<Map<String, dynamic>?> fetchAITravelPlan({
    required double latitude,
    required double longitude,
    String userType = 'Solo traveler',
    String vibe = 'Cultural', 
    String language = 'English',
    int radius = 10,
  }) async {
    final url = '${Environment.backendUrl}/api/places/ai/travel-plan?lat=$latitude&lng=$longitude&userType=${Uri.encodeComponent(userType)}&vibe=${Uri.encodeComponent(vibe)}&language=${Uri.encodeComponent(language)}&radius=$radius';
    print('🤖 Fetching AI travel plan: $url');
    
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          print('🤖 Got AI travel plan with ${data['places']?.length ?? 0} places');
          return data;
        }
      }
    } catch (e) {
      print('❌ AI Travel Plan failed: $e');
    }
    return null;
  }
  
  Future<List<Place>> _fetchRealPlaces(double lat, double lng, String query, int radius, [int offset = 0, int limit = 60]) async {
    final mobileUrl = '${Environment.backendUrl}/api/places/mobile/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=$limit';
    DebugLogger.log('🔍 API: $query within ${radius}m (limit: $limit)');
    DebugLogger.log('📍 Location: $lat, $lng');
    
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(mobileUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> places = data['results'];
          DebugLogger.log('✅ API returned ${places.length} places');
          
          return places.map((json) => Place.fromJson({
            ...json,
            'description': json['description'] ?? json['editorial_summary']?['overview'] ?? '',
            'localTip': 'Check opening hours before visiting',
            'handyPhrase': 'Hello, thank you!',
          })).toList();
        }
      }
      DebugLogger.error('API returned status: ${response.statusCode}');
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
      
      if (data != null && data is List) {
        final places = data.map((json) => Place.fromJson(json as Map<String, dynamic>)).toList();
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
    return _dailyApiCalls < limit;
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
  
  void _notifyLimitReached() {
    // This will be called by UI to show upgrade dialog
    print('💡 Consider upgrading subscription for more API calls');
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