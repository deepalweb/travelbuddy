import 'dart:convert';
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
    int topN = 12,
    int offset = 0,
  }) async {
    try {
      // 1. Try real places API (primary)
      final realPlaces = await _fetchRealPlaces(latitude, longitude, query, radius, offset);
      if (realPlaces.isNotEmpty) {
        return realPlaces.take(topN).toList();
      }
      
      // 2. Fallback to optimized places
      final optimizedPlaces = await _fetchOptimizedPlaces(latitude, longitude, query);
      if (optimizedPlaces.isNotEmpty) {
        return optimizedPlaces.take(topN).toList();
      }
      
      // 3. Final fallback to basic search
      return await _fetchBasicSearch(latitude, longitude, query, radius);
      
    } catch (e) {
      print('Places pipeline error: $e');
      return _generateMockPlaces(latitude, longitude, query, topN);
    }
  }
  
  Future<List<Place>> _fetchRealPlaces(double lat, double lng, String query, int radius, [int offset = 0]) async {
    final url = '${Environment.backendUrl}/api/places/nearby?lat=$lat&lng=$lng&q=$query&radius=$radius&offset=$offset';
    print('🔍 Fetching places: $url');
    
    final response = await http.get(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
    );
    
    print('📡 Places API response: ${response.statusCode}');
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      print('✅ Got ${data.length} real places from API');
      
      if (data.isNotEmpty) {
        print('📍 Sample place from API: ${data.first['name']} - ID: ${data.first['place_id'] ?? data.first['id']}');
      }
      
      // Enrich places with AI-generated content like web app
      final enrichedPlaces = await _enrichPlaces(data);
      return enrichedPlaces.map((json) => Place.fromJson(json)).toList();
    } else {
      print('❌ Places API error (${response.statusCode}): ${response.body}');
    }
    return [];
  }
  
  Future<List<Map<String, dynamic>>> _enrichPlaces(List<dynamic> places) async {
    try {
      // Check enrichment cache first
      final enrichResponse = await http.post(
        Uri.parse('${Environment.backendUrl}/api/enrichment/batch'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'items': places, 'lang': 'en'}),
      );
      
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
    final response = await http.get(
      Uri.parse('${Environment.backendUrl}/api/places/search?lat=$lat&lng=$lng&q=$query'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Place.fromJson(json)).toList();
    }
    return [];
  }
  
  Future<List<Place>> _fetchBasicSearch(double lat, double lng, String query, int radius) async {
    final response = await http.get(
      Uri.parse('${Environment.backendUrl}/api/places/search?lat=$lat&lng=$lng&q=$query&radius=$radius'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((json) => Place.fromJson(json)).toList();
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
    
    for (int i = 0; i < count && i < names.length; i++) {
      mockPlaces.add(Place(
        id: 'mock_${DateTime.now().millisecondsSinceEpoch}_$i',
        name: names[i],
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
}