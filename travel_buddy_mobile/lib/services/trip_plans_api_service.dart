import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/trip.dart';
import 'auth_api_service.dart';

class TripPlansApiService {
  static final AuthApiService _authApiService = AuthApiService();
  static Dio get _dio => _authApiService.authenticatedDio;

  // Save trip plan to backend
  static Future<TripPlan?> saveTripPlan(TripPlan tripPlan) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to save trip plan');
        return null;
      }
      
      print('💾 Saving trip plan to backend: ${tripPlan.tripTitle}');
      
      final response = await _dio.post('/api/users/${user.uid}/trip-plans', 
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
  static Future<List<TripPlan>> getUserTripPlans() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user for trip plans');
        return [];
      }
      
      print('📥 Fetching trip plans for user: ${user.uid}');
      
      final response = await _dio.get('/api/users/${user.uid}/trip-plans');
      
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
  static Future<bool> updateTripPlan(TripPlan tripPlan) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to update trip plan');
        return false;
      }
      
      print('🔄 Updating trip plan: ${tripPlan.tripTitle}');
      
      final response = await _dio.put('/api/trip-plans/${tripPlan.id}',
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

  // Update activity visited status
  static Future<bool> updateActivityStatus(String tripPlanId, int dayIndex, int activityIndex, bool isVisited) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to update activity status');
        return false;
      }
      
      final response = await _dio.put('/api/trip-plans/$tripPlanId/activity-status',
        data: {
          'dayIndex': dayIndex,
          'activityIndex': activityIndex,
          'isVisited': isVisited,
          'visitedDate': isVisited ? DateTime.now().toIso8601String() : null,
        }
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error updating activity status: $e');
      return false;
    }
  }

  // Delete trip plan
  static Future<bool> deleteTripPlan(String tripPlanId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to delete trip plan');
        return false;
      }
      
      print('🗑️ Deleting trip plan: $tripPlanId');
      
      final response = await _dio.delete('/api/trip-plans/$tripPlanId');
      
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
  static Future<bool> syncLocalPlansToBackend(List<TripPlan> localPlans) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to sync plans');
        return false;
      }
      
      print('🔄 Syncing ${localPlans.length} local plans to backend');
      
      final response = await _dio.post('/api/users/trip-plans/sync',
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
  static Future<String?> shareTripPlan(String tripPlanId) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to share trip plan');
        return null;
      }
      
      print('🔗 Creating share link for trip plan: $tripPlanId');
      
      final response = await _dio.post('/api/users/trip-plans/$tripPlanId/share');
      
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

  // Clear all user trip plans from backend
  static Future<bool> clearAllUserTripPlans() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to clear trip plans');
        return false;
      }
      
      print('🗑️ Clearing all trip plans for user: ${user.uid}');
      
      final response = await _dio.delete('/api/users/${user.uid}/trip-plans/all');
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ All trip plans cleared from backend');
        return true;
      }
      
      return false;
    } catch (e) {
      print('❌ Error clearing trip plans: $e');
      return false;
    }
  }
}