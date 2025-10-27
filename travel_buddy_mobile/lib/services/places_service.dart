import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'dart:math' as math;
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
  static const Duration _cacheExpiry = Duration(minutes: 15);
  static const Duration _rateLimitDelay = Duration(seconds: 2);
  
  // Subscription limits
  int _dailyApiCalls = 0;
  DateTime _lastResetDate = DateTime.now();
  
  // Daily API limits by subscription tier
  static const Map<String, int> _subscriptionLimits = {
    'free': 10,
    'basic': 50, 
    'premium': 200,
    'pro': 500,
  };

  // Google Places API First pipeline with AI fallback
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
  }) async {
    // Check cache first
    final cacheKey = '${latitude.toStringAsFixed(3)}_${longitude.toStringAsFixed(3)}_$query';
    if (_isValidCache(cacheKey)) {
      DebugLogger.log('💾 Using cached places (${_cache[cacheKey]!.length} found) - API call avoided');
      return _cache[cacheKey]!.take(topN).toList();
    }
    
    // Rate limiting check
    if (_isRateLimited(cacheKey)) {
      DebugLogger.log('⏱️ Rate limited, using AI fallback');
      return await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 10));
    }
    
    // Subscription limit check
    if (!_canMakeApiCall()) {
      DebugLogger.log('🚫 Daily API limit reached for subscription, using AI fallback');
      _notifyLimitReached();
      return await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 10));
    }
    
    try {
      // Primary: Google Places API for real, accurate data
      DebugLogger.log('🔍 Using Google Places API for real places data');
      _lastApiCalls[cacheKey] = DateTime.now();
      _incrementApiCall();
      final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, offset, topN)
          .timeout(const Duration(seconds: 15));
      
      if (realPlaces.length >= (topN * 0.5)) { // If Google provides 50%+ of needed places
        final filteredPlaces = realPlaces.where((p) => p.rating >= 3.0).take(topN).toList();
        _updateCache(cacheKey, filteredPlaces);
        DebugLogger.log('✅ Using Google Places API (${filteredPlaces.length} found) - Real places data');
        return filteredPlaces;
      }
      
      // Hybrid: Use Google + AI for gaps if Google has some results
      if (realPlaces.isNotEmpty) {
        DebugLogger.log('🔄 Google provided ${realPlaces.length} places, filling gaps with AI');
        final remainingNeeded = topN - realPlaces.length;
        
        if (remainingNeeded > 0) {
          final aiPlaces = await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
              .timeout(const Duration(seconds: 10));
          
          final combined = <Place>[...realPlaces, ...aiPlaces.take(remainingNeeded)];
          final filteredCombined = combined.where((p) => p.rating >= 3.0).take(topN).toList();
          _updateCache(cacheKey, filteredCombined);
          DebugLogger.log('✅ Hybrid result: ${realPlaces.length} Google + ${aiPlaces.take(remainingNeeded).length} AI = ${filteredCombined.length} total');
          return filteredCombined;
        }
        
        final filteredPlaces = realPlaces.where((p) => p.rating >= 3.0).take(topN).toList();
        _updateCache(cacheKey, filteredPlaces);
        return filteredPlaces;
      }
      
      // Fallback: AI if Google fails completely
      DebugLogger.log('⚠️ Google Places failed, trying AI fallback');
      final aiPlaces = await _fetchAIPlaces(latitude, longitude, query, radius, userType, vibe, language)
          .timeout(const Duration(seconds: 15));
      
      if (aiPlaces.isNotEmpty) {
        final filteredAI = aiPlaces.where((p) => p.rating >= 3.0).take(topN).toList();
        _updateCache(cacheKey, filteredAI);
        DebugLogger.log('✅ Using AI fallback (${filteredAI.length} places)');
        return filteredAI;
      }
      
      DebugLogger.log('⚠️ Both Google and AI failed, using mock data');
      return _generateEnhancedMockPlaces(latitude, longitude, query, topN);
      
    } catch (e) {
      DebugLogger.error('Places pipeline failed: $e - using mock data fallback');
      return _generateEnhancedMockPlaces(latitude, longitude, query, topN);
    }
  }
  
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
    // Try mobile-optimized endpoint with limited results to reduce costs
    final mobileUrl = '${Environment.backendUrl}/api/places/mobile/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=$limit';
    print('🔍 Fetching places (mobile): $mobileUrl');
    
    try {
      final mobileResponse = await _makeRequestWithRetry(() => http.get(
        Uri.parse(mobileUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      print('📡 Mobile API Response:');
      print('   Status Code: ${mobileResponse.statusCode}');
      print('   Headers: ${mobileResponse.headers}');
      print('   Body Length: ${mobileResponse.body.length} chars');
      print('   Raw Body: ${mobileResponse.body.substring(0, math.min(500, mobileResponse.body.length))}...');
      
      if (mobileResponse.statusCode == 200) {
        final mobileData = json.decode(mobileResponse.body);
        print('📱 Mobile API parsed response:');
        print('   Type: ${mobileData.runtimeType}');
        print('   Keys: ${mobileData is Map ? mobileData.keys.toList() : "Not a Map"}');
        print('   Status: ${mobileData['status']}');
        
        if (mobileData['status'] == 'OK' && mobileData['results'] != null) {
          final List<dynamic> data = mobileData['results'];
          print('✅ Got ${data.length} places from mobile API');
          
          if (data.isNotEmpty) {
            print('📍 First place details:');
            print('   Name: ${data.first['name']}');
            print('   ID: ${data.first['place_id'] ?? data.first['id']}');
            print('   Address: ${data.first['vicinity'] ?? data.first['formatted_address']}');
            print('   Rating: ${data.first['rating']}');
            print('   All keys: ${data.first.keys.toList()}');
            return await _enrichPlaces(data).then((enriched) => 
              enriched.map((json) => Place.fromJson(json)).toList());
          }
        } else {
          print('❌ Mobile API returned status: ${mobileData['status']} or no results');
        }
      } else {
        print('❌ Mobile API HTTP error: ${mobileResponse.statusCode}');
        print('❌ Mobile API response body: ${mobileResponse.body}');
      }
    } catch (e) {
      print('⚠️ Mobile API failed, trying fallback: $e');
    }
    
    // Fallback to original endpoint
    final url = '${Environment.backendUrl}/api/places/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&offset=$offset';
    print('🔍 Fetching places (fallback): $url');
    
    final response = await _makeRequestWithRetry(() => http.get(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
    ));
    
    print('📡 Fallback API Response:');
    print('   Status Code: ${response.statusCode}');
    print('   Headers: ${response.headers}');
    print('   Body Length: ${response.body.length} chars');
    
    if (response.statusCode == 200) {
      final responseBody = response.body;
      print('📡 Fallback API raw response: ${responseBody.substring(0, math.min(500, responseBody.length))}...');
      
      try {
        final decoded = json.decode(responseBody);
        print('📡 Fallback API parsed response:');
        print('   Type: ${decoded.runtimeType}');
        
        // Handle both array and object responses
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
          print('   Format: Direct array with ${data.length} items');
        } else if (decoded is Map && decoded['results'] != null) {
          data = decoded['results'];
          print('   Format: Object with results array (${data.length} items)');
          print('   Object keys: ${decoded.keys.toList()}');
        } else {
          print('❌ Fallback API returned unexpected format: ${decoded.runtimeType}');
          if (decoded is Map) {
            print('   Available keys: ${decoded.keys.toList()}');
          }
          return [];
        }
        
        print('✅ Got ${data.length} real places from fallback API');
        
        if (data.isNotEmpty) {
          print('📍 First place from fallback:');
          print('   Name: ${data.first['name']}');
          print('   ID: ${data.first['place_id'] ?? data.first['id']}');
          print('   Address: ${data.first['vicinity'] ?? data.first['formatted_address']}');
          print('   Rating: ${data.first['rating']}');
          print('   All keys: ${data.first.keys.toList()}');
          final enrichedPlaces = await _enrichPlaces(data);
          return enrichedPlaces.map((json) => Place.fromJson(json)).toList();
        }
      } catch (e) {
        print('❌ Failed to parse fallback API response: $e');
        print('❌ Raw response: $responseBody');
      }
    } else {
      print('❌ Fallback API error (${response.statusCode}): ${response.body}');
    }
    return [];
  }
  
  Future<http.Response> _makeRequestWithRetry(Future<http.Response> Function() request) async {
    try {
      print('🌐 Making HTTP request...');
      final response = await request().timeout(const Duration(seconds: 10));
      print('🌐 Request completed: ${response.statusCode}');
      return response;
    } on SocketException catch (e) {
      print('❌ Network error: $e');
      throw Exception('Network error: $e');
    } on TimeoutException catch (e) {
      print('❌ Request timeout: $e');
      throw Exception('Request timeout: $e');
    } catch (e) {
      print('❌ Request failed: $e');
      throw Exception('Request failed: $e');
    }
  }

  Future<List<Map<String, dynamic>>> _enrichPlaces(List<dynamic> places) async {
    try {
      // Check enrichment cache first
      final enrichResponse = await _makeRequestWithRetry(() => http.post(
        Uri.parse('${Environment.backendUrl}/api/enrichment/batch'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'items': places, 'lang': 'en'}),
      ));
      
      if (enrichResponse.statusCode == 200) {
        final enrichData = json.decode(enrichResponse.body);
        final cached = enrichData['cached'] ?? {};
        
        // Apply enriched content to places
        return places.map((place) {
          final placeMap = Map<String, dynamic>.from(place);
          final placeId = placeMap['place_id'] ?? placeMap['id'];
          final enriched = Map<String, dynamic>.from(cached[placeId] ?? {});
          
          return {
            ...placeMap,
            'description': enriched['description'] ?? 'A great place to visit in the area.',
            'localTip': enriched['localTip'] ?? 'Check opening hours before visiting.',
            'handyPhrase': enriched['handyPhrase'] ?? 'Hello, thank you!',
            'type': enriched['type'] ?? placeMap['types']?[0]?.toString().replaceAll('_', ' ') ?? 'Place',
          };
        }).toList();
      }
    } catch (e) {
      print('⚠️ Enrichment failed: $e');
    }
    
    // Return original places if enrichment fails
    return places.map((place) => Map<String, dynamic>.from(place)).toList();
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
    print('💡 Using enhanced mock data to avoid API costs for: $query');
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