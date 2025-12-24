import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
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

  // Hybrid approach: Google first, AI for subsequent
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
    final cacheKey = '${latitude.toStringAsFixed(2)}_${longitude.toStringAsFixed(2)}_$query';
    
    // INSTANT: Return cache if available
    if (!forceRefresh && _isValidCache(cacheKey)) {
      DebugLogger.log('⚡ INSTANT: Showing ${_cache[cacheKey]!.length} cached places');
      // Background refresh with AI (cheap)
      _refreshCacheInBackground(latitude, longitude, query, radius, topN, cacheKey);
      return _cache[cacheKey]!.take(topN).toList();
    }
    
    // Rate limiting check
    if (_isRateLimited(cacheKey)) {
      DebugLogger.log('⏱️ Rate limited, using AI');
      return await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 10));
    }
    
    try {
      // FIRST LOAD: Use Google Places (accurate, real data)
      if (await _canMakeApiCall()) {
        DebugLogger.log('🔍 First load: Using Google Places (accurate)');
        _lastApiCalls[cacheKey] = DateTime.now();
        await _incrementApiCall();
        
        final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, offset, topN)
            .timeout(const Duration(seconds: 8));
        
        if (realPlaces.length >= 10) {
          final filtered = realPlaces
              .where((p) => p.rating >= 3.0 && _isWithinRadius(p, latitude, longitude, radius))
              .toList();
          _updateCache(cacheKey, filtered);
          DebugLogger.log('✅ Got ${filtered.length} real places from Google');
          return filtered.take(topN).toList();
        }
        
        // Return Google results even if few (better than wrong location AI)
        if (realPlaces.isNotEmpty) {
          _updateCache(cacheKey, realPlaces);
          DebugLogger.log('✅ Got ${realPlaces.length} places from Google (no AI supplement)');
          return realPlaces.take(topN).toList();
        }
      }
      
      // Fallback: Use AI if Google API limit reached
      DebugLogger.log('💡 API limit reached, using AI');
      final aiPlaces = await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 10));
      _updateCache(cacheKey, aiPlaces);
      return aiPlaces.take(topN).toList();
      
    } catch (e) {
      DebugLogger.error('Places fetch failed: $e');
      if (_cache.containsKey(cacheKey)) {
        return _cache[cacheKey]!.take(topN).toList();
      }
      return [];
    }
  }
  
  // Background refresh without blocking UI
  void _refreshCacheInBackground(double lat, double lng, String query, int radius, int topN, String cacheKey) async {
    try {
      DebugLogger.log('🔄 Background refresh with AI');
      final aiPlaces = await _fetchAIPlaces(lat, lng, query, radius, null, null, null)
          .timeout(const Duration(seconds: 10));
      
      if (aiPlaces.length >= 10) {
        _updateCache(cacheKey, aiPlaces);
        DebugLogger.log('✅ Background refresh complete: ${aiPlaces.length} places');
      }
    } catch (e) {
      DebugLogger.log('⚠️ Background refresh failed: $e');
    }
  }
  
  // Filter places by category keywords (post-processing)
  List<Place> _filterByCategory(List<Place> places, String category, String originalQuery) {
    // Category keyword mapping for filtering
    final categoryKeywords = {
      'restaurant': ['restaurant', 'cafe', 'food', 'dining', 'eatery'],
      'hotel': ['hotel', 'hostel', 'accommodation', 'resort', 'lodging'],
      'landmark': ['landmark', 'monument', 'attraction', 'historic'],
      'museum': ['museum', 'gallery', 'art', 'cultural'],
      'park': ['park', 'garden', 'nature', 'outdoor', 'beach'],
      'entertainment': ['cinema', 'theater', 'entertainment', 'concert'],
      'bar': ['bar', 'pub', 'nightclub', 'lounge', 'nightlife'],
      'shopping': ['shopping', 'mall', 'market', 'store', 'boutique'],
      'spa': ['spa', 'wellness', 'massage', 'beauty', 'salon'],
      'viewpoint': ['viewpoint', 'scenic', 'observation', 'lookout', 'rooftop'],
    };
    
    // If no specific category or "all", return all places
    if (category == 'all' || !categoryKeywords.containsKey(category.toLowerCase())) {
      return places;
    }
    
    final keywords = categoryKeywords[category.toLowerCase()]!;
    
    // Filter places that match category keywords in name, type, or description
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
    // Use the actual query for now - "tourist attraction" not returning results
    final mobileUrl = '${Environment.backendUrl}/api/places/mobile/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=$limit';
    DebugLogger.log('🔍 Fetching: $query within ${radius}m');
    
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(mobileUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> places = data['results'];
          DebugLogger.log('✅ Got ${places.length} places');
          
          // Skip enrichment for speed - use raw Google data
          return places.map((json) => Place.fromJson({
            ...json,
            'description': json['description'] ?? json['editorial_summary']?['overview'] ?? '',
            'localTip': 'Check opening hours before visiting',
            'handyPhrase': 'Hello, thank you!',
          })).toList();
        }
      }
    } catch (e) {
      DebugLogger.error('Mobile API failed: $e');
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
  
  bool _isRateLimited(String key) {
    if (!_lastApiCalls.containsKey(key)) return false;
    return DateTime.now().difference(_lastApiCalls[key]!) < _rateLimitDelay;
  }
  
  void clearCache() {
    _cache.clear();
    _cacheTimestamps.clear();
    print('🗑️ Places cache cleared');
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
  
  // AI-First batch fetch to minimize Google Places API usage
  Future<Map<String, List<Place>>> fetchPlacesBatch({
    required double latitude,
    required double longitude,
    required Map<String, String> categories,
    int radius = 20000,
  }) async {
    try {
      // Try AI batch endpoint first (cost-effective)
      final aiBatchUrl = '${Environment.backendUrl}/api/places/ai/batch';
      print('🤖 AI Batch fetching places: $aiBatchUrl');
      
      final response = await _makeRequestWithRetry(() => http.post(
        Uri.parse(aiBatchUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'lat': latitude,
          'lng': longitude,
          'categories': categories.keys.toList(),
          'userPreferences': {
            'radius': radius ~/ 1000, // Convert to km
            'limit': 15
          }
        }),
      ));
      
      if (response.statusCode == 200) {
        final batchData = json.decode(response.body);
        if (batchData['status'] == 'OK' && batchData['results'] != null) {
          final Map<String, dynamic> results = batchData['results'];
          final Map<String, List<Place>> placesMap = {};
          
          for (final entry in results.entries) {
            final categoryPlaces = (entry.value as List<dynamic>)
                .map((json) => Place.fromJson({
                  ...json,
                  'ai_generated': true,
                }))
                .toList();
            placesMap[entry.key] = categoryPlaces;
            print('✅ AI ${entry.key}: ${categoryPlaces.length} places (Google API avoided)');
          }
          
          return placesMap;
        }
      }
      
      print('⚠️ AI Batch failed, using individual AI requests');
    } catch (e) {
      print('❌ AI Batch error: $e');
    }
    
    // Fallback: AI-first individual requests (still avoiding Google API)
    final Map<String, List<Place>> results = {};
    for (final entry in categories.entries) {
      try {
        final places = await fetchPlacesPipeline(
          latitude: latitude,
          longitude: longitude,
          query: entry.value,
          radius: radius,
          topN: 15,
        );
        results[entry.key] = places;
        print('🔍 ${entry.key} using Google Places API for real data');
      } catch (e) {
        print('❌ Error fetching ${entry.key}: $e');
        results[entry.key] = [];
      }
    }
    
    return results;
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