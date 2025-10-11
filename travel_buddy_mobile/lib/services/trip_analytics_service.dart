import 'package:dio/dio.dart';
import '../config/environment.dart';

class TripAnalyticsService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Track trip plan creation
  static Future<void> trackTripCreated({
    required String userId,
    required String tripPlanId,
    required String destination,
    required String duration,
    required List<String> interests,
    required int activitiesCount,
  }) async {
    try {
      await _dio.post('/api/analytics/trip-created', data: {
        'userId': userId,
        'tripPlanId': tripPlanId,
        'destination': destination,
        'duration': duration,
        'interests': interests,
        'activitiesCount': activitiesCount,
        'timestamp': DateTime.now().toIso8601String(),
      });
      
      print('📊 Trip creation tracked: $destination');
    } catch (e) {
      print('❌ Error tracking trip creation: $e');
    }
  }

  // Track activity completion
  static Future<void> trackActivityCompleted({
    required String userId,
    required String tripPlanId,
    required String activityId,
    required String activityTitle,
    required String category,
  }) async {
    try {
      await _dio.post('/api/analytics/activity-completed', data: {
        'userId': userId,
        'tripPlanId': tripPlanId,
        'activityId': activityId,
        'activityTitle': activityTitle,
        'category': category,
        'timestamp': DateTime.now().toIso8601String(),
      });
      
      print('✅ Activity completion tracked: $activityTitle');
    } catch (e) {
      print('❌ Error tracking activity completion: $e');
    }
  }

  // Track trip sharing
  static Future<void> trackTripShared({
    required String userId,
    required String tripPlanId,
    required String shareMethod, // 'link', 'direct', 'export'
  }) async {
    try {
      await _dio.post('/api/analytics/trip-shared', data: {
        'userId': userId,
        'tripPlanId': tripPlanId,
        'shareMethod': shareMethod,
        'timestamp': DateTime.now().toIso8601String(),
      });
      
      print('🔗 Trip sharing tracked: $shareMethod');
    } catch (e) {
      print('❌ Error tracking trip sharing: $e');
    }
  }

  // Get popular destinations
  static Future<List<Map<String, dynamic>>> getPopularDestinations({int limit = 10}) async {
    try {
      final response = await _dio.get('/api/analytics/popular-destinations', 
        queryParameters: {'limit': limit}
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        return data.cast<Map<String, dynamic>>();
      }
      
      return _getMockPopularDestinations();
    } catch (e) {
      print('❌ Error fetching popular destinations: $e');
      return _getMockPopularDestinations();
    }
  }

  // Get trending activities
  static Future<List<Map<String, dynamic>>> getTrendingActivities({int limit = 10}) async {
    try {
      final response = await _dio.get('/api/analytics/trending-activities',
        queryParameters: {'limit': limit}
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        return data.cast<Map<String, dynamic>>();
      }
      
      return _getMockTrendingActivities();
    } catch (e) {
      print('❌ Error fetching trending activities: $e');
      return _getMockTrendingActivities();
    }
  }

  // Get user trip statistics
  static Future<Map<String, dynamic>> getUserTripStats(String userId) async {
    try {
      final response = await _dio.get('/api/analytics/users/$userId/trip-stats');
      
      if (response.statusCode == 200 && response.data != null) {
        return Map<String, dynamic>.from(response.data);
      }
      
      return _getMockUserStats();
    } catch (e) {
      print('❌ Error fetching user trip stats: $e');
      return _getMockUserStats();
    }
  }

  // Get global trip statistics
  static Future<Map<String, dynamic>> getGlobalTripStats() async {
    try {
      final response = await _dio.get('/api/analytics/global-stats');
      
      if (response.statusCode == 200 && response.data != null) {
        return Map<String, dynamic>.from(response.data);
      }
      
      return _getMockGlobalStats();
    } catch (e) {
      print('❌ Error fetching global trip stats: $e');
      return _getMockGlobalStats();
    }
  }

  // Mock data for fallback
  static List<Map<String, dynamic>> _getMockPopularDestinations() {
    return [
      {'destination': 'Paris', 'tripCount': 245, 'avgRating': 4.7},
      {'destination': 'Tokyo', 'tripCount': 198, 'avgRating': 4.8},
      {'destination': 'London', 'tripCount': 167, 'avgRating': 4.5},
      {'destination': 'New York', 'tripCount': 156, 'avgRating': 4.6},
      {'destination': 'Rome', 'tripCount': 134, 'avgRating': 4.4},
    ];
  }

  static List<Map<String, dynamic>> _getMockTrendingActivities() {
    return [
      {'activity': 'Museum Visit', 'completionCount': 1234, 'category': 'Culture'},
      {'activity': 'Local Restaurant', 'completionCount': 1156, 'category': 'Food'},
      {'activity': 'Walking Tour', 'completionCount': 987, 'category': 'Sightseeing'},
      {'activity': 'Park Visit', 'completionCount': 876, 'category': 'Nature'},
      {'activity': 'Shopping', 'completionCount': 765, 'category': 'Shopping'},
    ];
  }

  static Map<String, dynamic> _getMockUserStats() {
    return {
      'totalTrips': 5,
      'totalActivities': 47,
      'completedActivities': 32,
      'completionRate': 0.68,
      'favoriteDestination': 'Paris',
      'favoriteCategory': 'Culture',
      'totalDistance': 125.5,
      'totalDuration': '18 days',
    };
  }

  static Map<String, dynamic> _getMockGlobalStats() {
    return {
      'totalTrips': 12567,
      'totalUsers': 3456,
      'totalActivities': 156789,
      'avgTripDuration': '4.2 days',
      'mostPopularDestination': 'Paris',
      'mostPopularActivity': 'Museum Visit',
    };
  }
}