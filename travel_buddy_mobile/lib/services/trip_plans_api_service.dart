import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../models/trip.dart';

class TripPlansApiService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(seconds: 15),
    receiveTimeout: Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Save trip plan to backend
  static Future<TripPlan?> saveTripPlan(String userId, TripPlan tripPlan) async {
    try {
      print('💾 Saving trip plan to backend: ${tripPlan.tripTitle}');
      
      final response = await _dio.post('/api/users/$userId/trip-plans', 
        data: tripPlan.toJson()
      );
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Trip plan saved to backend');
        return TripPlan.fromJson(response.data);
      }
      
      print('❌ Failed to save trip plan: ${response.statusCode}');
      return null;
    } catch (e) {
      print('❌ Error saving trip plan: $e');
      return null;
    }
  }

  // Get user's trip plans from backend
  static Future<List<TripPlan>> getUserTripPlans(String userId) async {
    try {
      print('📥 Fetching trip plans for user: $userId');
      
      final response = await _dio.get('/api/users/$userId/trip-plans');
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        final tripPlans = data.map((json) => TripPlan.fromJson(json)).toList();
        
        print('✅ Loaded ${tripPlans.length} trip plans from backend');
        return tripPlans;
      }
      
      return [];
    } catch (e) {
      print('❌ Error fetching trip plans: $e');
      return [];
    }
  }

  // Update trip plan
  static Future<bool> updateTripPlan(String userId, TripPlan tripPlan) async {
    try {
      print('🔄 Updating trip plan: ${tripPlan.tripTitle}');
      
      final response = await _dio.put('/api/users/$userId/trip-plans/${tripPlan.id}',
        data: tripPlan.toJson()
      );
      
      if (response.statusCode == 200) {
        print('✅ Trip plan updated successfully');
        return true;
      }
      
      return false;
    } catch (e) {
      print('❌ Error updating trip plan: $e');
      return false;
    }
  }

  // Delete trip plan
  static Future<bool> deleteTripPlan(String userId, String tripPlanId) async {
    try {
      print('🗑️ Deleting trip plan: $tripPlanId');
      
      final response = await _dio.delete('/api/users/$userId/trip-plans/$tripPlanId');
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ Trip plan deleted successfully');
        return true;
      }
      
      return false;
    } catch (e) {
      print('❌ Error deleting trip plan: $e');
      return false;
    }
  }

  // Sync local plans to backend
  static Future<bool> syncLocalPlansToBackend(String userId, List<TripPlan> localPlans) async {
    try {
      print('🔄 Syncing ${localPlans.length} local plans to backend');
      
      final response = await _dio.post('/api/users/$userId/trip-plans/sync',
        data: {'tripPlans': localPlans.map((plan) => plan.toJson()).toList()}
      );
      
      if (response.statusCode == 200) {
        print('✅ Local plans synced successfully');
        return true;
      }
      
      return false;
    } catch (e) {
      print('❌ Error syncing local plans: $e');
      return false;
    }
  }

  // Share trip plan
  static Future<String?> shareTripPlan(String userId, String tripPlanId) async {
    try {
      print('🔗 Creating share link for trip plan: $tripPlanId');
      
      final response = await _dio.post('/api/users/$userId/trip-plans/$tripPlanId/share');
      
      if (response.statusCode == 200 && response.data != null) {
        final shareUrl = response.data['shareUrl'];
        print('✅ Share link created: $shareUrl');
        return shareUrl;
      }
      
      return null;
    } catch (e) {
      print('❌ Error creating share link: $e');
      return null;
    }
  }

  // Get shared trip plan
  static Future<TripPlan?> getSharedTripPlan(String shareId) async {
    try {
      print('📥 Fetching shared trip plan: $shareId');
      
      final response = await _dio.get('/api/shared/trip-plans/$shareId');
      
      if (response.statusCode == 200 && response.data != null) {
        print('✅ Shared trip plan loaded');
        return TripPlan.fromJson(response.data);
      }
      
      return null;
    } catch (e) {
      print('❌ Error fetching shared trip plan: $e');
      return null;
    }
  }
}