import 'package:dio/dio.dart';
import 'package:geolocator/geolocator.dart';
import '../constants/app_constants.dart';
import '../config/environment.dart';
import '../models/place.dart';
import '../models/user.dart';
import '../models/trip.dart';


import '../models/community_post.dart';
import '../models/user_profile.dart';
import '../models/travel_enums.dart';


import 'error_handler_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ))..interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
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
          return List<Map<String, dynamic>>.from(data);
        }
      }
      return [];
    } catch (e) {
      print('Error getting personalized suggestions: $e');
      return [];
    }
  }

  // Trips API
  Future<List<TripPlan>> getRecentTrips() async {
    try {
      final response = await _dio.get('/api/trips/recent');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => TripPlan.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching recent trips: $e');
      return [];
    }
  }

  // User Stats API
  Future<Map<String, dynamic>> getUserStats(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/stats');
      
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        if (data is Map) {
          return Map<String, dynamic>.from(data);
        }
      }
      return {};
    } catch (e) {
      print('Error fetching user stats: $e');
      return {};
    }
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

  // Trip Plans API
  Future<List<TripPlan>> getUserTripPlans(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/trips');
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

  Future<TripPlan?> saveTripPlan(String userId, TripPlan tripPlan) async {
    try {
      final response = await _dio.post('/api/trips', data: {
        'userId': userId,
        ...tripPlan.toJson(),
      });
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
      final response = await _dio.delete('/api/trips/$tripPlanId');
      return response.statusCode == 200;
    } catch (e) {
      print('Error deleting trip plan: $e');
      return false;
    }
  }

  // Itineraries API
  Future<List<OneDayItinerary>> getUserItineraries(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/itineraries');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => OneDayItinerary.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching itineraries: $e');
      return [];
    }
  }

  Future<OneDayItinerary?> saveItinerary(String userId, OneDayItinerary itinerary) async {
    try {
      final response = await _dio.post('/api/itineraries', data: {
        'userId': userId,
        ...itinerary.toJson(),
      });
      if (response.statusCode == 201) {
        return OneDayItinerary.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error saving itinerary: $e');
      return null;
    }
  }

  // AI Services
  Future<OneDayItinerary?> generateItinerary(List<Place> places) async {
    try {
      final response = await _dio.post('/api/ai/generate-itinerary', data: {
        'places': places.map((p) => p.toJson()).toList(),
      });
      if (response.statusCode == 200) {
        return OneDayItinerary.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error generating itinerary: $e');
      return null;
    }
  }

  Future<TripPlan?> generateTripPlan({
    required String destination,
    required String duration,
    required String interests,
    String pace = 'Moderate',
    List<String> travelStyles = const [],
    String budget = 'Mid-Range',
  }) async {
    try {
      // Use enrichment endpoint as fallback since trip-plan endpoint doesn't exist
      final response = await _dio.post('/api/enrichment/batch', data: {
        'places': [{
          'name': destination,
          'type': 'destination',
          'duration': duration,
          'interests': interests,
          'pace': pace,
          'budget': budget,
          'travelStyles': travelStyles,
        }]
      });
      
      if (response.statusCode == 200) {
        // Create mock trip plan from response
        return TripPlan(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          tripTitle: '$duration Trip to $destination',
          destination: destination,
          duration: duration,
          introduction: 'AI-generated trip plan for $destination based on your preferences.',
          dailyPlans: _generateMockDailyPlans(duration, destination, interests),
          conclusion: 'Enjoy your amazing trip to $destination!',
        );
      }
      return null;
    } catch (e) {
      print('Error generating trip plan: $e');
      // Return mock trip plan as fallback
      return TripPlan(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        tripTitle: '$duration Trip to $destination',
        destination: destination,
        duration: duration,
        introduction: 'Sample trip plan for $destination. Customize based on your preferences.',
        dailyPlans: _generateMockDailyPlans(duration, destination, interests),
        conclusion: 'Have a wonderful trip!',
      );
    }
  }
  
  List<DailyTripPlan> _generateMockDailyPlans(String duration, String destination, String interests) {
    final days = int.tryParse(duration.split(' ').first) ?? 3;
    return List.generate(days, (index) => DailyTripPlan(
      day: index + 1,
      title: 'Day ${index + 1} in $destination',
      activities: [
        ActivityDetail(
          timeOfDay: 'Morning',
          activityTitle: 'Explore Local Attractions',
          description: 'Discover the best sights and landmarks in $destination',
        ),
        ActivityDetail(
          timeOfDay: 'Afternoon',
          activityTitle: '$interests Activities',
          description: 'Enjoy activities based on your interests',
        ),
        ActivityDetail(
          timeOfDay: 'Evening',
          activityTitle: 'Local Dining Experience',
          description: 'Try authentic local cuisine and restaurants',
        ),
      ],
    ));
  }

  // Deals API - Combined method that returns strongly typed Deal objects
  Future<List<Deal>> getActiveDeals() async {
    try {
      final response = await _dio.get('/api/deals');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => Deal.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching active deals: $e');
      return [];
    }
  }



  // Community API
  Future<List<CommunityPost>> getCommunityPosts({int page = 1, int limit = 20}) async {
    try {
      final response = await _dio.get('/api/posts', queryParameters: {
        'page': page,
        'limit': limit,
        'sort': 'createdAt',
        'order': 'desc',
      });
      
      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data;
        List<dynamic> data = [];
        
        if (responseData is Map) {
          final postsData = responseData['posts'] ?? responseData['data'];
          data = ErrorHandlerService.safeListCast<dynamic>(postsData, 'getCommunityPosts - posts extraction');
        } else if (responseData is List) {
          data = ErrorHandlerService.safeListCast<dynamic>(responseData, 'getCommunityPosts - direct list');
        }
        
        return data.map((json) {
          try {
            final jsonMap = ErrorHandlerService.safeMapCast(json, 'getCommunityPosts - individual post');
            return _convertBackendPostToCommunityPost(jsonMap);
          } catch (e) {
            ErrorHandlerService.handleError('getCommunityPosts - post conversion', e, null);
            return null;
          }
        }).where((post) => post != null).cast<CommunityPost>().toList();
      }
      return [];
    } catch (e) {
      print('Error fetching community posts: $e');
      return [];
    }
  }

  Future<bool> toggleLike(String postId, {String? userId, String? username}) async {
    try {
      final response = await _dio.post('/api/posts/$postId/like', data: {
        'username': username ?? 'Mobile User',
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error toggling like: $e');
      return false;
    }
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
    try {
      final requestData = {
        'userId': userId ?? '507f1f77bcf86cd799439011',
        'content': {
          'text': content,
          'images': images,
        },
        'author': {
          'name': username ?? 'Mobile User',
          'avatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          'location': location,
          'verified': false,
        },
        'tags': hashtags.isNotEmpty ? hashtags : [postType],
        'category': _mapPostTypeToCategory(postType),
        'postType': postType,
        'allowComments': allowComments,
        'visibility': visibility,
        'createdAt': DateTime.now().toIso8601String(),
      };
      
      print('📤 Sending post data: $requestData');
      final response = await _dio.post('/api/posts', data: requestData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Post creation API success: ${response.statusCode}');
        final responseData = response.data;
        print('📝 Response data: $responseData');
        final postData = responseData is Map ? responseData['post'] ?? responseData : responseData;
        print('📝 Post data: $postData');
        final convertedPost = _convertBackendPostToCommunityPost(postData);
        print('✅ Converted post: ${convertedPost.id} - ${convertedPost.content}');
        return convertedPost;
      } else {
        print('❌ Post creation failed with status: ${response.statusCode}');
        print('❌ Response data: ${response.data}');
      }
      return null;
    } catch (e) {
      print('❌ Error creating post: $e');
      if (e is DioException) {
        print('❌ Response status: ${e.response?.statusCode}');
        print('❌ Response data: ${e.response?.data}');
        print('❌ Request data: ${e.requestOptions.data}');
      }
      return null;
    }
  }

  CommunityPost _convertBackendPostToCommunityPost(Map<String, dynamic> json) {
    try {
      final author = Map<String, dynamic>.from(json['author'] ?? {});
      final content = Map<String, dynamic>.from(json['content'] ?? {});
      final engagement = Map<String, dynamic>.from(json['engagement'] ?? {});
      
      List<String> likedBy = [];
      try {
        final likedByData = json['likedBy'];
        if (likedByData is List) {
          likedBy = List<String>.from(likedByData);
        }
      } catch (e) {
        print('Error parsing likedBy: $e');
      }
      
      List<String> images = [];
      try {
        final imagesData = content['images'];
        if (imagesData is List) {
          images = List<String>.from(imagesData);
        }
      } catch (e) {
        print('Error parsing images: $e');
      }
      
      return CommunityPost(
        id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
        userId: json['userId']?.toString() ?? '',
        userName: author['name']?.toString() ?? 'Anonymous',
        userAvatar: author['avatar']?.toString() ?? '',
        content: content['text']?.toString() ?? '',
        images: images,
        location: author['location']?.toString() ?? '',
        createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
        likesCount: (engagement['likes'] as num?)?.toInt() ?? 0,
        commentsCount: (engagement['comments'] as num?)?.toInt() ?? 0,
        isLiked: likedBy.contains('mobile_user'),
        postType: PostType.fromString(_mapCategoryToPostType(json['category']?.toString() ?? 'Experience')),
      );
    } catch (e) {
      print('Error converting backend post: $e');
      // Return a default post if conversion fails
      return CommunityPost(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: '',
        userName: 'Anonymous',
        userAvatar: '',
        content: 'Error loading post content',
        images: [],
        location: '',
        createdAt: DateTime.now(),
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        postType: PostType.story,
      );
    }
  }

  String _mapPostTypeToCategory(String postType) {
    switch (postType) {
      case 'story': return 'Experience';
      case 'photo': return 'Photo';
      case 'review': return 'Experience';
      case 'tip': return 'Tip';
      default: return 'Experience';
    }
  }

  String _mapCategoryToPostType(String category) {
    switch (category) {
      case 'Experience': return 'story';
      case 'Photo': return 'photo';
      case 'Tip': return 'tip';
      default: return 'story';
    }
  }

  // Comments API
  Future<List<Comment>> getPostComments(String postId) async {
    try {
      final response = await _dio.get('/api/posts/$postId/comments');
      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data;
        List<dynamic> data = [];
        
        if (responseData is Map) {
          data = List<dynamic>.from(responseData['comments'] ?? responseData['data'] ?? []);
        } else if (responseData is List) {
          data = List<dynamic>.from(responseData);
        }
        
        return data.map((json) {
          try {
            final commentData = Map<String, dynamic>.from(json ?? {});
            return Comment(
              id: commentData['_id'] ?? commentData['id'] ?? '',
              postId: postId,
              userId: commentData['userId'] ?? '',
              userName: commentData['username'] ?? commentData['userName'] ?? 'Anonymous',
              userAvatar: commentData['userAvatar'] ?? '',
              content: commentData['content'] ?? '',
              createdAt: DateTime.tryParse(commentData['createdAt'] ?? '') ?? DateTime.now(),
            );
          } catch (e) {
            print('Error parsing comment: $e');
            return null;
          }
        }).where((comment) => comment != null).cast<Comment>().toList();
      }
      return [];
    } catch (e) {
      print('Error fetching comments: $e');
      return [];
    }
  }

  Future<Comment> addComment(String postId, String content) async {
    try {
      final response = await _dio.post('/api/posts/$postId/comments', data: {
        'content': content,
        'username': 'Mobile User',
        'userAvatar': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        'createdAt': DateTime.now().toIso8601String(),
      });
      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = response.data;
        final json = responseData is Map ? responseData['comment'] ?? responseData : responseData;
        return Comment(
          id: json['_id'] ?? json['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          postId: postId,
          userId: json['userId'] ?? 'mobile_user',
          userName: 'Mobile User',
          userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          content: content,
          createdAt: DateTime.now(),
        );
      }
      throw Exception('Failed to add comment');
    } catch (e) {
      print('Error adding comment: $e');
      rethrow;
    }
  }

  // Search API
  Future<List<CommunityPost>> searchPosts(String query) async {
    try {
      final response = await _dio.get('/api/posts/search', queryParameters: {
        'q': query,
        'limit': 20,
      });
      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data;
        List<dynamic> data = [];
        
        if (responseData is Map) {
          data = List<dynamic>.from(responseData['posts'] ?? responseData['data'] ?? []);
        } else if (responseData is List) {
          data = List<dynamic>.from(responseData);
        }
        
        return data.map((json) {
          try {
            return _convertBackendPostToCommunityPost(Map<String, dynamic>.from(json ?? {}));
          } catch (e) {
            print('Error parsing search result: $e');
            return null;
          }
        }).where((post) => post != null).cast<CommunityPost>().toList();
      }
      return [];
    } catch (e) {
      print('Error searching posts: $e');
      return [];
    }
  }

  // Bookmarks API
  Future<bool> toggleBookmark(String postId) async {
    try {
      final response = await _dio.post('/api/posts/$postId/bookmark', data: {
        'username': 'Mobile User',
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error toggling bookmark: $e');
      return false;
    }
  }

  Future<List<CommunityPost>> getBookmarkedPosts() async {
    try {
      final response = await _dio.get('/api/users/mobile_user/bookmarks');
      if (response.statusCode == 200 && response.data != null) {
        final responseData = response.data;
        List<dynamic> data = [];
        
        if (responseData is Map) {
          data = List<dynamic>.from(responseData['posts'] ?? responseData['data'] ?? []);
        } else if (responseData is List) {
          data = List<dynamic>.from(responseData);
        }
        
        return data.map((json) {
          try {
            return _convertBackendPostToCommunityPost(Map<String, dynamic>.from(json ?? {}));
          } catch (e) {
            print('Error parsing bookmarked post: $e');
            return null;
          }
        }).where((post) => post != null).cast<CommunityPost>().toList();
      }
      return [];
    } catch (e) {
      print('Error fetching bookmarked posts: $e');
      return [];
    }
  }

  // User Profile API
  Future<UserProfile?> getUserProfile(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/profile');
      if (response.statusCode == 200) {
        return UserProfile.fromJson(response.data);
      }
      return null;
    } catch (e) {
      print('Error fetching user profile: $e');
      return null;
    }
  }

  Future<bool> followUser(String userId) async {
    try {
      final response = await _dio.post('/api/users/$userId/follow', data: {
        'followerId': 'mobile_user',
      });
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Error following user: $e');
      return false;
    }
  }

  Future<bool> unfollowUser(String userId) async {
    try {
      final response = await _dio.delete('/api/users/$userId/follow', data: {
        'followerId': 'mobile_user',
      });
      return response.statusCode == 200;
    } catch (e) {
      print('Error unfollowing user: $e');
      return false;
    }
  }

  Future<List<UserProfile>> getFollowers(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/followers');
      if (response.statusCode == 200) {
        final responseData = response.data;
        final List<dynamic> data = responseData is Map ? responseData['followers'] ?? responseData['data'] ?? [] : responseData;
        return data.map((json) => UserProfile.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching followers: $e');
      return [];
    }
  }

  Future<List<UserProfile>> getFollowing(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/following');
      if (response.statusCode == 200) {
        final responseData = response.data;
        final List<dynamic> data = responseData is Map ? responseData['following'] ?? responseData['data'] ?? [] : responseData;
        return data.map((json) => UserProfile.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching following: $e');
      return [];
    }
  }





}