import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';
import '../models/place_model.dart';
import 'cache_service.dart';

class PlaceService {
  static final PlaceService _instance = PlaceService._internal();
  factory PlaceService() => _instance;
  PlaceService._internal();

  final CacheService _cache = CacheService();

  // Main search method - uses your Azure backend
  Future<List<Place>> searchPlaces(String query, {double? lat, double? lng}) async {
    try {
      // 1. Check cache first
      final cachedResults = await _cache.getCachedPlaces(query);
      if (cachedResults.isNotEmpty) {
        return cachedResults;
      }

      // 2. Call your Azure backend
      final backendResults = await _searchWithBackend(query, lat: lat, lng: lng);
      if (backendResults.isNotEmpty) {
        await _cache.cachePlaces(query, backendResults);
        return backendResults;
      }

      return [];
    } catch (e) {
      print('Place search error: $e');
      return [];
    }
  }

  // Get detailed place info from your backend
  Future<Place?> getPlaceDetails(String placeId, {bool includeReviews = false}) async {
    try {
      // Check cache first
      final cached = await _cache.getCachedPlace(placeId);
      if (cached != null && (!includeReviews || cached.hasReviews)) {
        return cached;
      }

      // Get details from your backend
      var url = '${Environment.backendUrl}/api/places/$placeId';
      if (includeReviews) {
        url += '?includeReviews=true';
      }

      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final place = Place.fromBackend(data['place']);
        await _cache.cachePlace(place);
        return place;
      }

      return null;
    } catch (e) {
      print('Place details error: $e');
      return null;
    }
  }

  // Call backend endpoint (fallback to existing until hybrid is deployed)
  Future<List<Place>> _searchWithBackend(String query, {double? lat, double? lng}) async {
    var url = '${Environment.backendUrl}/api/places/mobile/nearby?q=${Uri.encodeComponent(query)}';
    
    if (lat != null && lng != null) {
      url += '&lat=$lat&lng=$lng';
    }

    print('🔍 Calling: $url');
    final response = await http.get(Uri.parse(url));
    print('📡 Response status: ${response.statusCode}');
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      print('📄 Full response: ${response.body}');
      print('🔍 Response keys: ${data.keys.toList()}');
      
      // Handle backend's actual format
      final places = data['results'] ?? data['places'] ?? data ?? [];
      print('🏢 Places array type: ${places.runtimeType}');
      print('🏢 Places array length: ${(places as List).length}');
      
      if (places.isNotEmpty) {
        print('📄 First place sample: ${places[0]}');
      }
      
      final parsedPlaces = (places)
          .map((result) {
            try {
              return Place.fromBackend(result);
            } catch (e) {
              print('❌ Error parsing place: $e');
              print('❌ Place data: $result');
              return null;
            }
          })
          .where((place) => place != null)
          .cast<Place>()
          .toList();
      
      print('🏢 Successfully parsed ${parsedPlaces.length} places');
      return parsedPlaces;
    }
    return [];
  }



  // Get nearby places
  Future<List<Place>> getNearbyPlaces(double lat, double lng, {String? type}) async {
    final query = type ?? 'restaurant';
    return searchPlaces(query, lat: lat, lng: lng);
  }


}