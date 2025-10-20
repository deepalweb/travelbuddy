import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../config/environment.dart';

class MobilePlacesService {
  static final MobilePlacesService _instance = MobilePlacesService._internal();
  factory MobilePlacesService() => _instance;
  MobilePlacesService._internal();

  // Main discovery method - follows your exact flow
  Future<Map<String, List<Place>>> discoverPlaces({
    String userType = 'Explorer',
    String vibe = 'Cultural',
    List<String> interests = const [],
  }) async {
    try {
      // Step 1: Detect device location
      print('📍 Step 1: Detecting device location...');
      final position = await _getCurrentLocation();
      
      // Step 2: Send to backend places search process
      print('🌐 Step 2: Sending location to backend AI...');
      final response = await _callBackendDiscovery(
        position.latitude, 
        position.longitude,
        userType: userType,
        vibe: vibe,
        interests: interests,
      );
      
      // Step 3: Backend AI generates places (handled in backend)
      print('🤖 Step 3: Backend AI generated ${response['totalPlaces']} places');
      
      // Step 4: Arrange by category and return to mobile
      print('📱 Step 4: Arranging places by category...');
      final categorizedPlaces = _parseCategories(response['categories']);
      
      print('✅ Discovery complete: ${categorizedPlaces.keys.length} categories');
      return categorizedPlaces;
      
    } catch (e) {
      print('❌ Places discovery failed: $e');
      return {};
    }
  }

  // Step 1: Get device location
  Future<Position> _getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  // Step 2: Call backend discovery endpoint
  Future<Map<String, dynamic>> _callBackendDiscovery(
    double latitude, 
    double longitude, {
    required String userType,
    required String vibe,
    required List<String> interests,
  }) async {
    final response = await http.post(
      Uri.parse('${Environment.backendUrl}/api/mobile-places/discover'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'latitude': latitude,
        'longitude': longitude,
        'userPreferences': {
          'userType': userType,
          'vibe': vibe,
          'interests': interests,
        }
      }),
    ).timeout(const Duration(seconds: 30));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    
    throw Exception('Backend discovery failed: ${response.statusCode}');
  }

  // Step 4: Parse categories from backend response
  Map<String, List<Place>> _parseCategories(Map<String, dynamic> categories) {
    final result = <String, List<Place>>{};
    
    categories.forEach((category, places) {
      if (places is List) {
        result[category] = places
            .map((placeJson) => Place.fromJson(Map<String, dynamic>.from(placeJson)))
            .toList();
      }
    });
    
    return result;
  }

  // Get all places (flat list)
  Future<List<Place>> getAllPlaces({
    String userType = 'Explorer',
    String vibe = 'Cultural',
    List<String> interests = const [],
  }) async {
    final categories = await discoverPlaces(
      userType: userType,
      vibe: vibe,
      interests: interests,
    );
    
    final allPlaces = <Place>[];
    categories.values.forEach((places) => allPlaces.addAll(places));
    return allPlaces;
  }

  // Get places by specific category
  Future<List<Place>> getPlacesByCategory(String category, {
    String userType = 'Explorer',
    String vibe = 'Cultural',
    List<String> interests = const [],
  }) async {
    final categories = await discoverPlaces(
      userType: userType,
      vibe: vibe,
      interests: interests,
    );
    
    return categories[category] ?? [];
  }
}