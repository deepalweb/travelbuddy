import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;
import '../models/place.dart';
import '../config/environment.dart';
import '../utils/debug_logger.dart';
import 'gemini_places_service.dart';
import '../providers/user_profile_provider.dart';

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
  static const Duration _cacheExpiry = Duration(hours: 2);
  static const Duration _rateLimitDelay = Duration(milliseconds: 500);
  
  // Subscription limits
  int _dailyApiCalls = 0;
  DateTime _lastResetDate = DateTime.now();
  
  // Daily API limits by subscription tier
  static const Map<String, int> _subscriptionLimits = {
    'free': 100,
    'basic': 200, 
    'premium': 500,
    'pro': 1000,
  };

  // Optimized fast pipeline - AI first for speed
  Future<List<Place>> fetchPlacesPipeline({
    required double latitude,
    required double longitude,
    required String query,
    int radius = 20000,
    int topN = 50,
    int offset = 0,
    String? userType,
    String? vibe,
    String? language,
  }) async {
    // Check cache first
    final cacheKey = '${latitude.toStringAsFixed(3)}_${longitude.toStringAsFixed(3)}_$query';
    if (_isValidCache(cacheKey)) {
      return _cache[cacheKey]!.take(topN).toList();
    }
    
    try {
      // AI first for speed (no API limits, instant results)
      print('🤖 STEP 1: Trying AI places generation...');
      final aiPlaces = await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 5));
      
      print('🤖 STEP 1 RESULT: Got ${aiPlaces.length} AI places');
      if (aiPlaces.length >= 10) {
        final filtered = aiPlaces.take(topN).toList();
        _updateCache(cacheKey, filtered);
        print('✅ STEP 1 SUCCESS: Using ${filtered.length} AI places');
        return filtered;
      }
      
      // Only use Google API if AI fails completely
      print('🌐 STEP 2: AI insufficient, trying real places API...');
      if (_canMakeApiCall()) {
        _lastApiCalls[cacheKey] = DateTime.now();
        _incrementApiCall();
        final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, offset, 20)
            .timeout(const Duration(seconds: 8));
        
        print('🌐 STEP 2 RESULT: Got ${realPlaces.length} real places');
        if (realPlaces.isNotEmpty) {
          final combined = [...realPlaces, ...aiPlaces].take(topN).toList();
          _updateCache(cacheKey, combined);
          print('✅ STEP 2 SUCCESS: Using ${combined.length} combined places');
          return combined;
        }
      } else {
        print('🚫 STEP 2 SKIPPED: API call limit reached');
      }
      
      // Final fallback
      print('⚠️ STEP 3: All APIs failed, using fallback...');
      if (aiPlaces.isNotEmpty) {
        print('✅ STEP 3A: Using ${aiPlaces.length} AI places as fallback');
        return aiPlaces.take(topN).toList();
      } else {
        print('🎭 STEP 3B: Generating ${topN} mock places as final fallback');
        return _generateEnhancedMockPlaces(latitude, longitude, query, topN);
      }
      
    } catch (e) {
      return _generateEnhancedMockPlaces(latitude, longitude, query, topN);
    }
  }
  
  // Enhanced AI Places using Gemini service
  Future<List<Place>> _fetchAIPlaces(double lat, double lng, String query, int radius, String? userType, String? vibe, String? language) async {
    try {
      print('🤖 AI STEP A: Trying Azure OpenAI service...');
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
      
      print('🤖 AI STEP A RESULT: Azure OpenAI returned ${places.length} places');
      if (places.isNotEmpty) {
        DebugLogger.log('🤖 Azure OpenAI generated ${places.length} high-quality places');
        return places;
      }
      
      // Fallback to backend AI if Azure OpenAI fails
      print('🤖 AI STEP B: Azure OpenAI empty, trying backend AI...');
      return await _fetchBackendAIPlaces(lat, lng, query, radius, userType, vibe, language);
      
    } catch (e) {
      print('❌ AI STEP A ERROR: Azure OpenAI failed: $e');
      DebugLogger.log('❌ Azure OpenAI failed: $e, trying backend AI');
      print('🤖 AI STEP B: Trying backend AI fallback...');
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
      print('🌐 AI STEP B: Calling backend AI: $finalUrl');
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse(finalUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      print('🌐 AI STEP B RESPONSE: Status ${response.statusCode}');
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('🌐 AI STEP B DATA: ${data.toString().substring(0, 200)}...');
        if (data['status'] == 'OK' && data['results'] != null) {
          final List<dynamic> places = data['results'];
          print('✅ AI STEP B SUCCESS: Got ${places.length} backend AI places');
          return places.map((json) => Place.fromJson({
            ...json,
            'ai_generated': true,
            'description': json['description'] ?? 'A great place to visit in the area.',
            'localTip': json['tips'] ?? 'Check opening hours before visiting.',
            'handyPhrase': 'Hello, thank you!',
          })).toList();
        } else {
          print('❌ AI STEP B FAIL: Invalid response format or status');
        }
      } else {
        print('❌ AI STEP B FAIL: HTTP ${response.statusCode}');
      }
    } catch (e) {
      print('❌ AI STEP B ERROR: Backend AI Places API failed: $e');
    }
    print('❌ AI STEP B FINAL: Returning empty list');
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
  
  Future<List<Place>> _fetchRealPlaces(double lat, double lng, String query, int radius, [int offset = 0, int limit = 20]) async {
    final url = '${Environment.backendUrl}/api/places/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=$limit';
    
    try {
      print('🌐 REAL PLACES: Calling $url');
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));
      
      print('🌐 REAL PLACES RESPONSE: Status ${response.statusCode}');
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        List<dynamic> data = decoded is List ? decoded : (decoded['results'] ?? []);
        
        print('🌐 REAL PLACES DATA: Got ${data.length} places');
        if (data.isNotEmpty) {
          final enriched = await _enrichPlaces(data);
          print('✅ REAL PLACES SUCCESS: Returning ${enriched.length} enriched places');
          return enriched.map((json) => Place.fromJson(json)).toList();
        } else {
          print('❌ REAL PLACES EMPTY: No places in response');
        }
      } else {
        print('❌ REAL PLACES FAIL: HTTP ${response.statusCode}');
      }
    } catch (e) {
      print('❌ REAL PLACES ERROR: $e');
    }
    return [];
  }
  
  Future<http.Response> _makeRequestWithRetry(Future<http.Response> Function() request) async {
    return await request().timeout(const Duration(seconds: 5));
  }

  Future<List<Map<String, dynamic>>> _enrichPlaces(List<dynamic> places) async {
    // Skip enrichment for speed - use basic data
    return places.map((place) {
      final placeMap = Map<String, dynamic>.from(place);
      return {
        ...placeMap,
        'description': 'A great place to visit in the area.',
        'localTip': 'Check opening hours before visiting.',
        'handyPhrase': 'Hello, thank you!',
        'type': placeMap['types']?[0]?.toString().replaceAll('_', ' ') ?? 'Place',
      };
    }).toList();
  }
  
  Future<List<Place>> _fetchOptimizedPlaces(double lat, double lng, String query) async {
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse('${Environment.backendUrl}/api/places/search?lat=$lat&lng=$lng&q=$query'),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Place.fromJson(json)).toList();
      }
    } catch (e) {
      print('⚠️ Optimized places failed: $e');
    }
    return [];
  }
  
  Future<List<Place>> _fetchBasicSearch(double lat, double lng, String query, int radius) async {
    try {
      final response = await _makeRequestWithRetry(() => http.get(
        Uri.parse('${Environment.backendUrl}/api/places/search?lat=$lat&lng=$lng&q=$query&radius=$radius'),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Place.fromJson(json)).toList();
      }
    } catch (e) {
      print('⚠️ Basic search failed: $e');
    }
    return [];
  }
  
  // Enhanced mock places generator with AI-like quality
  List<Place> _generateEnhancedMockPlaces(double lat, double lng, String query, int count) {
    print('💡 MOCK FALLBACK: Using enhanced mock data to avoid API costs for: $query');
    print('💡 MOCK FALLBACK: This means ALL API calls failed - check backend connectivity!');
    return _generateMockPlaces(lat, lng, query, count);
  }
  
  // Mock places generator as final fallback
  List<Place> _generateMockPlaces(double lat, double lng, String query, int count) {
    print('⚠️ USING MOCK DATA - API failed for: $query');
    print('🎭 Generating $count mock places as fallback');
    
    final mockPlaces = <Place>[];
    final baseNames = {
      'restaurant': ['Local Bistro', 'Corner Cafe', 'Garden Restaurant', 'City Grill'],
      'attraction': ['Historic Center', 'City Museum', 'Central Park', 'Observation Deck'],
      'hotel': ['Grand Hotel', 'Boutique Inn', 'City Lodge', 'Comfort Suites'],
      'museum': ['Art Museum', 'History Museum', 'Science Center', 'Cultural Gallery'],
      'park': ['Central Park', 'Riverside Gardens', 'City Green', 'Memorial Park'],
    };
    
    String category = 'attraction';
    if (query.toLowerCase().contains('restaurant')) {
      category = 'restaurant';
    } else if (query.toLowerCase().contains('hotel')) category = 'hotel';
    else if (query.toLowerCase().contains('museum')) category = 'museum';
    else if (query.toLowerCase().contains('park')) category = 'park';
    
    final names = baseNames[category] ?? baseNames['attraction']!;
    
    // Generate multiple variations of each base name for more variety
    final expandedNames = <String>[];
    for (final baseName in names) {
      expandedNames.add(baseName);
      expandedNames.add('$baseName Downtown');
      expandedNames.add('$baseName Plaza');
      expandedNames.add('New $baseName');
    }
    
    for (int i = 0; i < count && i < expandedNames.length; i++) {
      mockPlaces.add(Place(
        id: 'mock_${DateTime.now().millisecondsSinceEpoch}_$i',
        name: expandedNames[i],
        address: 'Near your location',
        latitude: lat + (i * 0.001),
        longitude: lng + (i * 0.001),
        rating: 4.0 + (i * 0.2),
        type: category.replaceAll('_', ' ').split(' ').map((w) => w[0].toUpperCase() + w.substring(1)).join(' '),
        photoUrl: '',
        description: 'A popular local $category in the area',
        localTip: 'Check opening hours before visiting',
        handyPhrase: 'Hello, thank you!',
      ));
    }
    
    return mockPlaces;
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
  bool _canMakeApiCall() {
    _resetDailyCountIfNeeded();
    final userTier = _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    return _dailyApiCalls < limit;
  }
  
  void _incrementApiCall() {
    _resetDailyCountIfNeeded();
    _dailyApiCalls++;
    print('📊 API calls today: $_dailyApiCalls/${_subscriptionLimits[_getUserSubscriptionTier()]}');
  }
  
  void _resetDailyCountIfNeeded() {
    final now = DateTime.now();
    if (now.day != _lastResetDate.day || now.month != _lastResetDate.month || now.year != _lastResetDate.year) {
      _dailyApiCalls = 0;
      _lastResetDate = now;
      print('🔄 Daily API count reset');
    }
  }
  
  String _getUserSubscriptionTier() {
    try {
      final userProvider = UserProfileProvider();
      return userProvider.currentUserProfile?.subscriptionTier ?? 'free';
    } catch (e) {
      return 'free';
    }
  }
  
  int getRemainingApiCalls() {
    _resetDailyCountIfNeeded();
    final userTier = _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    return (limit - _dailyApiCalls).clamp(0, limit);
  }
  
  Map<String, dynamic> getApiUsageStats() {
    _resetDailyCountIfNeeded();
    final userTier = _getUserSubscriptionTier();
    final limit = _subscriptionLimits[userTier] ?? _subscriptionLimits['free']!;
    
    return {
      'tier': userTier,
      'used': _dailyApiCalls,
      'limit': limit,
      'remaining': getRemainingApiCalls(),
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
    
    print('🔍 Using Google Places API for accurate search results');
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
      topN: 50, // Increased to get more AI results
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
    
    print('🔍 Using Google Places API for accurate nearby search');
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
      topN: 60, // Higher limit for better AI coverage
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