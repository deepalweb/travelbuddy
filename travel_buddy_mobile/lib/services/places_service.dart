import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'package:http/http.dart' as http;
import '../models/place.dart';
import '../config/environment.dart';

class PlacesService {
  static final PlacesService _instance = PlacesService._internal();
  factory PlacesService() => _instance;
  PlacesService._internal();

  // Web app's Places pipeline implementation
  Future<List<Place>> fetchPlacesPipeline({
    required double latitude,
    required double longitude,
    required String query,
    int radius = 20000,
    int topN = 150, // Further increased for mobile comprehensive results
    int offset = 0,
  }) async {
    try {
      // 1. Try real places API (primary) - get comprehensive results
      final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, offset);
      if (realPlaces.isNotEmpty) {
        print('✅ Got ${realPlaces.length} real places from API');
        // Filter and return quality places from enhanced backend
        final qualityPlaces = realPlaces.where((p) => p.rating >= 3.0).toList();
        print('✅ Filtered to ${qualityPlaces.length} quality places (rating >= 3.0)');
        return qualityPlaces.take(topN).toList();
      }
      
      // 2. Fallback to optimized places
      final optimizedPlaces = await _fetchOptimizedPlaces(latitude, longitude, query);
      if (optimizedPlaces.isNotEmpty) {
        print('✅ Got ${optimizedPlaces.length} optimized places');
        return optimizedPlaces.take(topN).toList();
      }
      
      // 3. Final fallback to basic search
      return await _fetchBasicSearch(latitude, longitude, query, radius);
      
    } catch (e) {
      print('Places pipeline error: $e');
      // Generate more comprehensive mock places as final fallback
      return _generateMockPlaces(latitude, longitude, query, math.min(150, 20));
    }
  }
  
  Future<List<Place>> _fetchRealPlaces(double lat, double lng, String query, int radius, [int offset = 0]) async {
    // Try mobile-optimized endpoint first
    final mobileUrl = '${Environment.backendUrl}/api/places/mobile/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&limit=60';
    print('🔍 Fetching places (mobile): $mobileUrl');
    
    try {
      final mobileResponse = await _makeRequestWithRetry(() => http.get(
        Uri.parse(mobileUrl),
        headers: {'Content-Type': 'application/json'},
      ));
      
      if (mobileResponse.statusCode == 200) {
        final mobileData = json.decode(mobileResponse.body);
        print('📱 Mobile API response status: ${mobileData['status']}');
        print('📱 Mobile API response keys: ${mobileData.keys.toList()}');
        
        if (mobileData['status'] == 'OK' && mobileData['results'] != null) {
          final List<dynamic> data = mobileData['results'];
          print('✅ Got ${data.length} places from mobile API');
          
          if (data.isNotEmpty) {
            print('📍 Sample place: ${data.first['name']} - ID: ${data.first['place_id'] ?? data.first['id']}');
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
    
    print('📡 Fallback API response: ${response.statusCode}');
    if (response.statusCode == 200) {
      final responseBody = response.body;
      print('📡 Fallback API raw response: ${responseBody.substring(0, math.min(200, responseBody.length))}...');
      
      try {
        final decoded = json.decode(responseBody);
        
        // Handle both array and object responses
        List<dynamic> data;
        if (decoded is List) {
          data = decoded;
          print('📡 Fallback API returned direct array');
        } else if (decoded is Map && decoded['results'] != null) {
          data = decoded['results'];
          print('📡 Fallback API returned object with results');
        } else {
          print('❌ Fallback API returned unexpected format: ${decoded.runtimeType}');
          return [];
        }
        
        print('✅ Got ${data.length} real places from fallback API');
        
        if (data.isNotEmpty) {
          print('📍 Sample place from fallback: ${data.first['name']} - ID: ${data.first['place_id'] ?? data.first['id']}');
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
    int retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        final response = await request();
        
        if (response.statusCode == 200) {
          return response;
        } else if (response.statusCode == 503) {
          retryCount++;
          if (retryCount < maxRetries) {
            final delay = Duration(seconds: math.pow(2, retryCount).toInt());
            print('⏳ Service unavailable (503), retrying in ${delay.inSeconds}s...');
            await Future.delayed(delay);
            continue;
          }
        }
        return response;
      } on SocketException {
        retryCount++;
        if (retryCount < maxRetries) {
          final delay = Duration(seconds: math.pow(2, retryCount).toInt());
          print('🌐 Network error, retrying in ${delay.inSeconds}s...');
          await Future.delayed(delay);
        } else {
          rethrow;
        }
      } catch (e) {
        if (retryCount == maxRetries - 1) rethrow;
        retryCount++;
        await Future.delayed(Duration(seconds: math.pow(2, retryCount).toInt()));
      }
    }
    
    throw Exception('Max retries exceeded');
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
          final placeId = place['place_id'] ?? place['id'];
          final enriched = cached[placeId] ?? {};
          
          return {
            ...place,
            'description': enriched['description'] ?? 'A great place to visit in the area.',
            'localTip': enriched['localTip'] ?? 'Check opening hours before visiting.',
            'handyPhrase': enriched['handyPhrase'] ?? 'Hello, thank you!',
            'type': enriched['type'] ?? place['types']?[0]?.toString().replaceAll('_', ' ') ?? 'Place',
          };
        }).cast<Map<String, dynamic>>().toList();
      }
    } catch (e) {
      print('⚠️ Enrichment failed: $e');
    }
    
    // Return original places if enrichment fails
    return places.cast<Map<String, dynamic>>();
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



  // Legacy methods for backward compatibility
  Future<List<Place>> searchPlaces({
    required String query,
    String? category,
    double? latitude,
    double? longitude,
    int radius = 20000,
  }) async {
    if (latitude == null || longitude == null) return [];
    
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
    );
  }

  Future<List<Place>> getNearbyPlaces({
    required double latitude,
    required double longitude,
    String category = 'all',
    int radius = 20000,
  }) async {
    final query = category == 'all' ? 'points of interest' : category;
    
    return await fetchPlacesPipeline(
      latitude: latitude,
      longitude: longitude,
      query: query,
      radius: radius,
    );
  }
  
  // Batch fetch places for multiple categories (for mobile sections)
  Future<Map<String, List<Place>>> fetchPlacesBatch({
    required double latitude,
    required double longitude,
    required Map<String, String> categories, // category -> query mapping
    int radius = 20000,
  }) async {
    try {
      final batchUrl = '${Environment.backendUrl}/api/places/mobile/batch';
      print('🔍 Batch fetching places: $batchUrl');
      
      final queries = categories.entries.map((entry) => {
        'category': entry.key,
        'query': entry.value,
        'limit': 15
      }).toList();
      
      final response = await _makeRequestWithRetry(() => http.post(
        Uri.parse(batchUrl),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'lat': latitude,
          'lng': longitude,
          'queries': queries,
          'radius': radius,
        }),
      ));
      
      if (response.statusCode == 200) {
        final batchData = json.decode(response.body);
        if (batchData['status'] == 'OK' && batchData['results'] != null) {
          final Map<String, dynamic> results = batchData['results'];
          final Map<String, List<Place>> placesMap = {};
          
          for (final entry in results.entries) {
            final categoryPlaces = (entry.value as List<dynamic>)
                .map((json) => Place.fromJson(json))
                .toList();
            placesMap[entry.key] = categoryPlaces;
            print('✅ ${entry.key}: ${categoryPlaces.length} places');
          }
          
          return placesMap;
        }
      }
      
      print('⚠️ Batch API failed, using individual requests');
    } catch (e) {
      print('❌ Batch fetch error: $e');
    }
    
    // Fallback: fetch each category individually
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
      } catch (e) {
        print('❌ Error fetching ${entry.key}: $e');
        results[entry.key] = [];
      }
    }
    
    return results;
  }
}