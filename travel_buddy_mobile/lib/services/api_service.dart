import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../constants/app_constants.dart';
import '../config/environment.dart';
import '../models/place.dart';
import '../models/user.dart';
import '../models/trip.dart';
import '../models/travel_stats.dart';
import '../models/community_post.dart' as community;
import '../models/user_profile.dart';
import '../models/safety_info.dart';
import 'mock_backend_service.dart';
import 'auth_api_service.dart';
import 'dart:math' as math;

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  final AuthApiService _authApiService = AuthApiService();
  late final Dio _dio;

  ApiService._internal() {
    _dio = _authApiService.authenticatedDio;
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('🌐 API: $obj'),
    ));
  }



  Future<void> _testBackendConnectivity() async {
    try {
      print('🌐 Testing backend connectivity...');
      final response = await _dio.get('/health').timeout(Duration(seconds: 10));
      if (response.statusCode == 200) {
        print('✅ Backend is accessible: ${response.data}');
      } else {
        print('⚠️ Backend returned: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Backend connectivity test failed: $e');
      print('📱 App will use mock data for community features');
    }
  }

  // Personalized Suggestions API
  Future<List<Map<String, dynamic>>> getPersonalizedSuggestions({
    required List<String> interests,
    required Position location,
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for personalized suggestions');
        return _getMockSuggestions(interests);
      }
      
      print('💡 Fetching personalized suggestions for: ${user.uid}');
      final response = await _dio.get(
        '/api/suggestions/personalized',
        queryParameters: {
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
  Future<Map<String, dynamic>> getUserStats() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for stats');
        return _getMockUserStats();
      }
      
      print('📊 Fetching user stats for: ${user.uid}');
      
      // Try multiple endpoints to get comprehensive stats
      final results = await Future.wait([
        _getUserPostsCount(),
        _getUserFollowersCount(),
        _getUserFollowingCount(),
        _getUserTravelStatsCount(),
      ]);
      
      final stats = {
        'totalPosts': results[0],
        'followersCount': results[1],
        'followingCount': results[2],
        'placesVisited': results[3],
        'memberSince': DateTime.now().toIso8601String(),
        'profileType': 'traveler',
        'tier': 'free',
        'subscriptionStatus': 'none',
      };
      
      print('✅ Compiled user stats: $stats');
      return stats;
    } catch (e) {
      print('❌ Error fetching user stats: $e');
      return _getMockUserStats();
    }
  }
  
  Future<int> _getUserPostsCount() async {
    try {
      final posts = await getCommunityPosts(limit: 1000);
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        return posts.where((post) => post.userId == user.uid).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  Future<int> _getUserFollowersCount() async {
    try {
      final response = await _dio.get('/api/users/followers/count');
      if (response.statusCode == 200) {
        return response.data['count'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  Future<int> _getUserFollowingCount() async {
    try {
      final response = await _dio.get('/api/users/following/count');
      if (response.statusCode == 200) {
        return response.data['count'] ?? 0;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  Future<int> _getUserTravelStatsCount() async {
    try {
      final stats = await getUserTravelStats();
      return stats?.totalPlacesVisited ?? 0;
    } catch (e) {
      return 0;
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
      print('📍 Params: lat=$latitude, lng=$longitude, q=$searchQuery, radius=$radius');
      
      final response = await _dio.get('/api/places/nearby', queryParameters: {
        'lat': latitude,
        'lng': longitude,
        'q': searchQuery.isEmpty ? 'points of interest' : searchQuery,
        'radius': radius,
      }).timeout(Duration(seconds: 15));

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
  Future<CurrentUser?> getUser() async {
    try {
      return await _authApiService.getUserProfile();
    } catch (e) {
      print('Error fetching user: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> createUser(Map<String, dynamic> userData) async {
    try {
      final response = await _dio.post('/api/users', data: userData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('Error creating user: $e');
      return null;
    }
  }
  
  Future<Map<String, dynamic>?> getUserByFirebaseUid(String firebaseUid) async {
    try {
      final response = await _dio.get('/api/users/$firebaseUid');
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('Error getting user by Firebase UID: $e');
      return null;
    }
  }

  Future<bool> updateUser(Map<String, dynamic> userData) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to update');
        return false;
      }
      
      print('👤 Syncing user profile to backend: ${user.uid}');
      final success = await _authApiService.updateUserProfile(userData);
      if (success) {
        print('✅ User profile synced successfully');
      }
      return success;
    } catch (e) {
      print('❌ Error updating user: $e');
      return false;
    }
  }

  // Favorites API
  Future<List<String>> getUserFavorites() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for favorites');
        return [];
      }
      
      final response = await _dio.get('/api/users/favorites');
      if (response.statusCode == 200) {
        return List<String>.from(response.data);
      }
      return [];
    } catch (e) {
      print('Error fetching favorites: $e');
      return [];
    }
  }

  Future<bool> addFavorite(String placeId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to add favorite');
        return false;
      }
      
      final response = await _dio.post('/api/users/favorites', data: {
        'placeId': placeId,
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error adding favorite: $e');
      return false;
    }
  }

  Future<bool> removeFavorite(String placeId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to remove favorite');
        return false;
      }
      
      final response = await _dio.delete('/api/users/favorites/$placeId');
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

  Future<TravelStats?> getUserTravelStats() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for travel stats');
        return null;
      }
      
      final response = await _dio.get('/api/users/travel-stats');
      if (response.statusCode == 200) {
        return TravelStats.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching travel stats: $e');
      return null;
    }
  }

  Future<bool> updateUserTravelStats(TravelStats stats) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for travel stats update');
        return false;
      }
      
      final response = await _dio.put('/api/users/travel-stats', data: stats.toJson());
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating travel stats: $e');
      return false;
    }
  }

  Future<bool> deleteUser() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return false;
      
      final response = await _dio.delete('/api/users/profile');
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting user: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>?> updateUserSubscription(Map<String, dynamic> subscriptionData) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for subscription update');
        return null;
      }
      
      final response = await _dio.put('/api/users/subscription', data: subscriptionData);
      if (response.statusCode == 200) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('Error updating subscription: $e');
      return null;
    }
  }

  Future<bool> updateUserTravelStyle(String travelStyle) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for travel style update');
        return false;
      }
      
      final response = await _dio.put('/api/users/travel-style', data: {
        'travelStyle': travelStyle,
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error updating travel style: $e');
      return false;
    }
  }

  Future<List<TripPlan>> getUserTripPlans() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for trip plans');
        return [];
      }
      
      final response = await _dio.get('/api/users/trip-plans');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => TripPlan.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching trip plans: $e');
      return [];
    }
  }

  Future<TripPlan?> saveTripPlan(TripPlan tripPlan) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to save trip plan');
        return null;
      }
      
      final response = await _dio.post('/api/users/trip-plans', data: tripPlan.toJson());
      if (response.statusCode == 201) {
        return TripPlan.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error saving trip plan: $e');
      return null;
    }
  }

  Future<bool> deleteTripPlan(String tripPlanId) async {
    try {
      final response = await _dio.delete('/api/trip-plans/$tripPlanId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting trip plan: $e');
      return false;
    }
  }

  Future<List<Deal>> getMyDeals() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for deals');
        return [];
      }
      
      final response = await _dio.get('/api/users/deals');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Deal.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching user deals: $e');
      return [];
    }
  }

  Future<bool> claimDealReal(String dealId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to claim deal');
        return false;
      }
      
      final response = await _dio.post('/api/deals/$dealId/claim');
      return response.statusCode == 200;
    } catch (e) {
      print('Error claiming deal: $e');
      return false;
    }
  }

  Future<String?> getUserTravelStyle() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for travel style');
        return null;
      }
      
      final response = await _dio.get('/api/users/travel-style');
      if (response.statusCode == 200) {
        return response.data['travelStyle'];
      }
      return null;
    } catch (e) {
      print('Error fetching travel style: $e');
      return null;
    }
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

  Future<List<community.CommunityPost>> getCommunityPosts({int page = 1, int limit = 20}) async {
    try {
      print('🌐 Attempting to fetch posts from: ${Environment.backendUrl}/api/community/posts');
      final response = await _dio.get('/api/community/posts', queryParameters: {
        'limit': limit,
        'page': page,
      }).timeout(Duration(seconds: 15));
      print('🌐 Backend response status: ${response.statusCode}');
      if (response.statusCode == 200) {
        final responseData = response.data;
        List<dynamic> posts;
        
        // Handle both array and object responses
        if (responseData is List) {
          posts = responseData;
        } else if (responseData is Map && responseData['posts'] != null) {
          posts = responseData['posts'];
        } else {
          posts = [];
        }
        
        print('✅ Backend success: ${posts.length} posts loaded');
        return posts.map((json) => community.CommunityPost.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('❌ Backend error: $e');
      return [];
    }
  }

  Future<bool> toggleLike(String postId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to toggle like');
        return false;
      }
      
      print('🌐 Toggling like for post: $postId');
      final response = await _dio.post('/api/posts/$postId/like', data: {
        'userId': user.uid,
        'username': user.displayName ?? 'Mobile User',
      });
      print('🌐 Like response: ${response.statusCode}');
      if (response.statusCode == 200) {
        print('✅ Like synced to backend');
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Like backend error: $e');
      return false;
    }
  }

  Future<bool> toggleBookmark(String postId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to toggle bookmark');
        return false;
      }
      
      final response = await _dio.post('/api/posts/$postId/bookmark');
      if (response.statusCode == 200) {
        print('✅ Bookmark toggled successfully');
        return true;
      }
      return false;
    } catch (e) {
      print('❌ Bookmark error: $e');
      return false;
    }
  }

  Future<community.CommunityPost?> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    bool allowComments = true,
    String visibility = 'public',
  }) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to create post');
        return null;
      }
      
      print('🌐 Creating post via: /api/community/posts');
      final response = await _dio.post('/api/community/posts', data: {
        'userId': user.uid,
        'content': {
          'text': content,
          'images': images,
        },
        'author': {
          'name': user.displayName ?? 'Mobile User',
          'avatar': user.photoURL ?? '',
          'location': location,
          'verified': false,
        },
        'tags': hashtags,
        'category': postType,
      });
      print('🌐 Create post response: ${response.statusCode}');
      if (response.statusCode == 200) {
        print('✅ Post created successfully');
        return community.CommunityPost.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('❌ Create post error: $e');
      return null;
    }
  }

  Future<List<community.CommunityPost>> getBookmarkedPosts() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for bookmarked posts');
        return [];
      }
      
      final response = await _dio.get('/api/posts/bookmarked');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        print('✅ Loaded ${data.length} bookmarked posts');
        return data.map((json) => community.CommunityPost.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('❌ Error fetching bookmarked posts: $e');
      return [];
    }
  }

  Future<List<UserProfile>> getFollowers() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for followers');
        return [];
      }
      
      final response = await _dio.get('/api/users/followers');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => UserProfile.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching followers: $e');
      return [];
    }
  }

  Future<List<UserProfile>> getFollowing() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for following');
        return [];
      }
      
      final response = await _dio.get('/api/users/following');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => UserProfile.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching following: $e');
      return [];
    }
  }

  Future<List<community.Comment>> getPostComments(String postId) async {
    try {
      final response = await _dio.get('/api/posts/$postId/comments');
      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> comments = data['comments'] ?? [];
        return comments.map((json) => community.Comment.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('🔄 Real backend unavailable, using mock database');
      return await MockBackendService().getPostComments(postId);
    }
  }

  Future<community.Comment> addComment(String postId, String content) async {
    try {
      final response = await _dio.post('/api/posts/$postId/comments', data: {
        'text': content,
        'username': 'Mobile User',
      });
      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> comments = data['comments'] ?? [];
        if (comments.isNotEmpty) {
          return community.Comment.fromJson(comments.last);
        }
      }
      throw Exception('Failed to create comment');
    } catch (e) {
      print('🔄 Real backend unavailable, using mock database');
      return await MockBackendService().addComment(postId, content);
    }
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
      final response = await _dio.get('/api/emergency/services', queryParameters: {
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
  
  Future<Map<String, dynamic>?> getAzureEmergencyNumbers(double latitude, double longitude) async {
    try {
      print('🤖 Fetching emergency numbers via Azure OpenAI');
      final response = await _dio.get('/api/emergency/numbers', queryParameters: {
        'lat': latitude,
        'lng': longitude,
      });
      
      if (response.statusCode == 200) {
        print('✅ Got Azure OpenAI emergency numbers: ${response.data}');
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (e) {
      print('❌ Azure OpenAI emergency numbers failed: $e');
      return null;
    }
  }
}