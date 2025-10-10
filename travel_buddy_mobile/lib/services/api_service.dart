import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../constants/app_constants.dart';
import '../config/environment.dart';
import '../config/environment.dart';
import '../models/place.dart';
import '../models/user.dart';
import '../models/trip.dart';
import '../models/travel_stats.dart';
import '../models/community_post.dart';
import '../models/user_profile.dart';
import '../models/travel_enums.dart';
import '../models/safety_info.dart';
import '../models/community_post.dart';
import 'dart:math' as math;
import 'error_handler_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 8),
    receiveTimeout: const Duration(seconds: 12),
    sendTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ))..interceptors.add(LogInterceptor(
    requestBody: false,
    responseBody: false,
    logPrint: (obj) => print(obj),
  ));

  ApiService._internal();

  // Personalized Suggestions API
  Future<List<Map<String, dynamic>>> getPersonalizedSuggestions({
    required String userId,
    required List<String> interests,
    required Position location,
  }) async {
    try {
      print('💡 Fetching personalized suggestions for: $userId');
      final response = await _dio.get(
        '/api/suggestions/personalized',
        queryParameters: {
          'userId': userId,
          'interests': interests.join(','),
          'latitude': location.latitude,
          'longitude': location.longitude,
        },
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is List) {
          print('✅ Loaded ${data.length} personalized suggestions');
          return List<Map<String, dynamic>>.from(data);
        }
      }
      print('❌ No suggestions data received');
      return _getMockSuggestions(interests);
    } catch (e) {
      print('❌ Error getting personalized suggestions: $e');
      return _getMockSuggestions(interests);
    }
  }

  List<Map<String, dynamic>> _getMockSuggestions(List<String> interests) {
    final hour = DateTime.now().hour;
    final suggestions = <Map<String, dynamic>>[];
    
    if (hour < 12) {
      suggestions.add({
        'type': 'activity',
        'title': 'Morning Coffee & Planning',
        'description': 'Start your day with local coffee',
        'reason': 'Perfect morning activity'
      });
    } else if (hour < 17) {
      suggestions.add({
        'type': 'activity',
        'title': 'Afternoon Exploration',
        'description': 'Great time to visit attractions',
        'reason': 'Ideal afternoon timing'
      });
    } else {
      suggestions.add({
        'type': 'activity',
        'title': 'Evening Dining',
        'description': 'Discover local restaurants',
        'reason': 'Perfect evening activity'
      });
    }
    
    for (final interest in interests.take(2)) {
      suggestions.add({
        'type': 'place',
        'title': 'Explore $interest spots',
        'description': 'Discover places for $interest enthusiasts',
        'reason': 'Based on your interest in $interest'
      });
    }
    
    return suggestions;
  }

  // Trips API
  Future<List<TripPlan>> getRecentTrips() async {
    try {
      print('📅 Fetching recent trips');
      final response = await _dio.get('/api/trips/recent');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        print('✅ Loaded ${data.length} recent trips');
        return data.map((json) => TripPlan.fromJson(json)).toList();
      }
      print('❌ No recent trips data');
      return [];
    } catch (e) {
      print('❌ Error fetching recent trips: $e');
      return [];
    }
  }

  // User Stats API
  Future<Map<String, dynamic>> getUserStats(String userId) async {
    try {
      print('📊 Fetching user stats for: $userId');
      final response = await _dio.get('/api/users/$userId/stats');
      
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is Map) {
          print('✅ User stats loaded: ${data.keys.toList()}');
          return Map<String, dynamic>.from(data);
        }
      }
      print('❌ No user stats data received');
      return _getMockUserStats();
    } catch (e) {
      print('❌ Error fetching user stats: $e');
      return _getMockUserStats();
    }
  }

  Map<String, dynamic> _getMockUserStats() {
    return {
      'totalTrips': 0,
      'totalPosts': 0,
      'totalFavorites': 0,
      'totalItineraries': 0,
      'memberSince': DateTime.now().toIso8601String(),
      'profileType': 'traveler',
      'tier': 'free',
      'subscriptionStatus': 'none',
      'placesVisited': 0,
      'badgesEarned': [],
      'travelScore': 0
    };
  }

  // Places API
  Future<List<Place>> fetchNearbyPlaces({
    required double latitude,
    required double longitude,
    String category = 'all',
    int radius = AppConstants.defaultPlacesRadiusM,
    String searchQuery = '',
  }) async {
    try {
      print('🌍 Fetching places from: ${Environment.backendUrl}/api/places/nearby');
      print('📍 Params: lat=$latitude, lng=$longitude, category=$category, radius=$radius');
      
      final response = await _dio.get('/api/places/nearby', queryParameters: {
        'lat': latitude,
        'lng': longitude,
        'category': category,
        'radius': radius,
        'query': searchQuery,
      });

      print('📡 API Response Status: ${response.statusCode}');
      
      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data;
        if (responseData is! List) {
          print('❌ Expected List but got ${responseData.runtimeType}');
          return [];
        }
        final List<dynamic> data = responseData;
        print('📊 Received ${data.length} places from API');
        
        final places = data.map((json) {
          try {
            return Place.fromJson(json);
          } catch (e) {
            print('❌ Error parsing place: $e');
            print('🔍 Place data: $json');
            return null;
          }
        }).where((place) => place != null).cast<Place>().toList();
        
        print('✅ Successfully parsed ${places.length} places');
        return places;
      } else {
        print('❌ API returned status: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching nearby places: $e');
      if (e is DioException) {
        print('🔍 Dio Error Details: ${e.message}');
        print('🔍 Response: ${e.response?.data}');
      }
      return [];
    }
  }

  Future<Place?> getPlaceDetails(String placeId) async {
    try {
      final response = await _dio.get('/api/places/$placeId');
      if (response.statusCode == 200) {
        return Place.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching place details: $e');
      return null;
    }
  }

  // User API
  Future<CurrentUser?> getUser(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId');
      if (response.statusCode == 200) {
        return CurrentUser.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching user: $e');
      return null;
    }
  }

  Future<CurrentUser?> createUser(Map<String, dynamic> userData) async {
    try {
      final response = await _dio.post('/api/users', data: userData);
      if (response.statusCode == 201) {
        return CurrentUser.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error creating user: $e');
      return null;
    }
  }

  Future<bool> updateUser(String userId, Map<String, dynamic> userData) async {
    try {
      final response = await _dio.put('/api/users/$userId', data: userData);
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating user: $e');
      return false;
    }
  }

  // Favorites API
  Future<List<String>> getUserFavorites(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/favorites');
      if (response.statusCode == 200) {
        return List<String>.from(response.data);
      }
      return [];
    } catch (e) {
      print('Error fetching favorites: $e');
      return [];
    }
  }

  Future<bool> addFavorite(String userId, String placeId) async {
    try {
      final response = await _dio.post('/api/users/$userId/favorites', data: {
        'placeId': placeId,
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding favorite: $e');
      return false;
    }
  }

  Future<bool> removeFavorite(String userId, String placeId) async {
    try {
      final response = await _dio.delete('/api/users/$userId/favorites/$placeId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error removing favorite: $e');
      return false;
    }
  }

  // Stub methods for missing APIs - return empty/default values
  Future<List<String>> getDailySuggestions({
    required String userId,
    required double lat,
    required double lng,
    String? weather,
    String? timeOfDay,
    String? userStyle,
  }) async {
    return [];
  }

  Future<Map<String, dynamic>?> getLocalDiscoveries({
    required double lat,
    required double lng,
    int radius = 20000,
    String? userStyle,
  }) async {
    return null;
  }

  Future<TravelStats?> getUserTravelStats(String userId) async {
    return null;
  }

  Future<bool> updateUserTravelStats(String userId, TravelStats stats) async {
    return false;
  }

  Future<bool> deleteUser(String userId) async {
    return false;
  }

  Future<Map<String, dynamic>?> updateUserSubscription(String userId, Map<String, dynamic> subscriptionData) async {
    return null;
  }

  Future<bool> updateUserTravelStyle(String userId, String travelStyle) async {
    return false;
  }

  Future<List<TripPlan>> getUserTripPlans(String userId) async {
    return [];
  }

  Future<TripPlan?> saveTripPlan(String userId, TripPlan tripPlan) async {
    return null;
  }

  Future<bool> deleteTripPlan(String tripPlanId) async {
    return false;
  }

  Future<List<Deal>> getMyDeals(String merchantId) async {
    return [];
  }

  Future<bool> claimDealReal(String dealId, String userId) async {
    return false;
  }

  Future<String?> getUserTravelStyle(String userId) async {
    return null;
  }

  Future<Map<String, String>?> getPlaceAIContent(String placeId) async {
    return null;
  }

  Future<bool> cacheAIContent(String placeId, {
    String? description,
    String? localTip, 
    String? handyPhrase,
  }) async {
    return false;
  }

  Future<List<CommunityPost>> getCommunityPosts({int page = 1, int limit = 20}) async {
    return [];
  }

  Future<bool> toggleLike(String postId, {String? userId, String? username}) async {
    return false;
  }

  Future<bool> toggleBookmark(String postId) async {
    return false;
  }

  Future<CommunityPost?> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    bool allowComments = true,
    String visibility = 'public',
    String? userId,
    String? username,
  }) async {
    return null;
  }

  Future<List<CommunityPost>> getBookmarkedPosts() async {
    return [];
  }

  Future<List<UserProfile>> getFollowers(String userId) async {
    return [];
  }

  Future<List<UserProfile>> getFollowing(String userId) async {
    return [];
  }

  Future<List<Comment>> getPostComments(String postId) async {
    return [];
  }

  Future<Comment> addComment(String postId, String content) async {
    throw Exception('Not implemented');
  }

  // Safety API
  Future<SafetyInfo?> getSafetyInfo(double latitude, double longitude) async {
    try {
      final response = await _dio.get('/api/safety/info', queryParameters: {
        'lat': latitude,
        'lng': longitude,
      });
      if (response.statusCode == 200) {
        return SafetyInfo.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching safety info: $e');
      return null;
    }
  }

  Future<List<EmergencyService>> getNearbyEmergencyServices({
    required double latitude,
    required double longitude,
    int radius = 5000,
  }) async {
    try {
      // Try backend API first
      final response = await _dio.get('/api/safety/emergency-services', queryParameters: {
        'lat': latitude,
        'lng': longitude,
        'radius': radius,
      });
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => EmergencyService.fromJson(json)).toList();
      }
    } catch (e) {
      print('Backend API failed, trying Google Places: $e');
    }
    
    // Fallback to Google Places API
    try {
      final services = <EmergencyService>[];
      
      // Search for hospitals
      final hospitals = await _searchGooglePlaces(latitude, longitude, 'hospital', radius);
      services.addAll(hospitals);
      
      // Search for police stations
      final police = await _searchGooglePlaces(latitude, longitude, 'police', radius);
      services.addAll(police);
      
      // Search for pharmacies
      final pharmacies = await _searchGooglePlaces(latitude, longitude, 'pharmacy', radius);
      services.addAll(pharmacies);
      
      return services;
    } catch (e) {
      print('Google Places API failed: $e');
      return [];
    }
  }
  
  Future<List<EmergencyService>> _searchGooglePlaces(
    double latitude, 
    double longitude, 
    String type, 
    int radius
  ) async {
    final response = await _dio.get(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      queryParameters: {
        'location': '$latitude,$longitude',
        'radius': radius,
        'type': type,
        'key': Environment.googleMapsApiKey,
      },
    );
    
    if (response.statusCode == 200) {
      final data = response.data;
      final results = data['results'] as List<dynamic>;
      
      return results.map((place) {
        final location = place['geometry']['location'];
        final lat = location['lat'];
        final lng = location['lng'];
        final distance = _calculateDistance(latitude, longitude, lat, lng);
        
        return EmergencyService(
          type: type,
          name: place['name'],
          address: place['vicinity'] ?? '',
          phone: place['formatted_phone_number'] ?? '',
          latitude: lat,
          longitude: lng,
          distance: distance,
          rating: (place['rating'] ?? 0.0).toDouble(),
          is24Hours: place['opening_hours']?['open_now'] ?? false,
          hasEnglishStaff: true,
          isVerifiedSafe: place['rating'] != null && place['rating'] > 4.0,
        );
      }).toList();
    }
    
    return [];
  }
  
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371;
    final double dLat = (lat2 - lat1) * (math.pi / 180);
    final double dLon = (lon2 - lon1) * (math.pi / 180);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180)) * math.cos(lat2 * (math.pi / 180)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }

  Future<Map<String, dynamic>?> generateSafetyContent({
    required double latitude,
    required double longitude,
    required String location,
    String contentType = 'general',
  }) async {
    try {
      final response = await _dio.post('/api/ai/safety-content', data: {
        'latitude': latitude,
        'longitude': longitude,
        'location': location,
        'contentType': contentType,
      });
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('Error generating safety content: $e');
      return null;
    }
  }
  
  Future<Map<String, dynamic>?> getReverseGeocode(double latitude, double longitude) async {
    try {
      final response = await _dio.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        queryParameters: {
          'latlng': '$latitude,$longitude',
          'key': Environment.googleMapsApiKey,
        },
      );
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('Error with reverse geocoding: $e');
      return null;
    }
  }
}