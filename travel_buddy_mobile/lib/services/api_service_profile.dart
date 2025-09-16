  // User Profile API
  Future<Map<String, dynamic>> getCurrentUserProfile() async {
    try {
      final response = await _dio.get('/api/users/profile');
      return response.data;
    } catch (e) {
      print('Error getting current user profile: $e');
      return _getMockUserProfile();
    }
  }

  Future<Map<String, dynamic>> getUserProfile(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/profile');
      return response.data;
    } catch (e) {
      print('Error getting user profile: $e');
      return _getMockUserProfile(userId: userId);
    }
  }

  Future<Map<String, dynamic>> updateUserProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _dio.patch('/api/users/profile', data: updates);
      return response.data;
    } catch (e) {
      print('Error updating user profile: $e');
      throw Exception('Failed to update profile');
    }
  }

  Future<void> followUser(String userId) async {
    try {
      await _dio.post('/api/users/$userId/follow');
    } catch (e) {
      print('Error following user: $e');
      throw Exception('Failed to follow user');
    }
  }

  Future<void> unfollowUser(String userId) async {
    try {
      await _dio.delete('/api/users/$userId/follow');
    } catch (e) {
      print('Error unfollowing user: $e');
      throw Exception('Failed to unfollow user');
    }
  }

  Map<String, dynamic> _getMockUserProfile({String? userId}) {
    return {
      'userId': userId ?? '12345',
      'username': 'traveler_jane',
      'email': 'jane@example.com',
      'bio': 'Adventure seeker | Food lover | Photography enthusiast',
      'profileImage': 'https://example.com/profile.jpg',
      'travelInterests': ['adventure', 'food', 'photography'],
      'stats': {
        'countriesVisited': 12,
        'citiesVisited': 35,
        'placesVisited': 150,
        'totalReviews': 45,
        'totalPhotos': 230,
        'helpfulVotes': 89,
        'postsShared': 67,
      },
      'badges': [
        {
          'id': 'badge1',
          'name': 'Globetrotter',
          'description': 'Visited 10+ countries',
          'iconUrl': 'https://example.com/badges/globetrotter.png',
          'earnedAt': DateTime.now().toIso8601String(),
          'category': 'explorer',
          'level': 1,
        }
      ],
      'favoritePlaceIds': ['place1', 'place2'],
      'publicTripIds': ['trip1', 'trip2'],
      'travelerType': 'adventure',
      'joinedAt': DateTime.now().subtract(const Duration(days: 365)).toIso8601String(),
      'currentLocation': 'Paris, France',
      'preferences': {
        'language': 'en',
        'currency': 'USD',
        'notifications': true,
      },
      'isVerified': true,
      'followersCount': 250,
      'followingCount': 180,
    };
  }
