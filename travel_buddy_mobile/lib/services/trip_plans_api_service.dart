import 'dart:async';
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
      
      final response = await _dio.post('/api/users/trip-plans', 
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
      print('🔗 Endpoint: /api/users/trip-plans');
      print('🔑 Getting auth token...');
      
      final token = await user.getIdToken().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('⏱️ Token retrieval timed out');
          throw TimeoutException('Token retrieval timeout');
        },
      );
      print('✅ Token obtained: ${token?.substring(0, 20)}...');
      
      print('📤 Making GET request...');
      final response = await _dio.get(
        '/api/users/trip-plans',
        options: Options(
          extra: {'noCache': true},
          headers: {'Cache-Control': 'no-cache'},
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        ),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          print('⏱️ Request timed out');
          throw TimeoutException('Request timeout');
        },
      );
      
      print('📊 Response status: ${response.statusCode}');
      print('📊 Response data type: ${response.data.runtimeType}');
      print('📊 Response data length: ${response.data?.length ?? 0}');
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        final tripPlans = data.map((json) => TripPlan.fromJson(json)).toList();
        
        print('✅ Loaded ${tripPlans.length} trip plans from backend');
        return tripPlans;
      }
      
      print('⚠️ Unexpected response status: ${response.statusCode}');
      return [];
    } on TimeoutException catch (e) {
      print('❌ Timeout error: $e');
      return [];
    } catch (e, stackTrace) {
      print('❌ Error fetching trip plans: $e');
      print('❌ Error type: ${e.runtimeType}');
      print('❌ Stack trace: ${stackTrace.toString().substring(0, 500)}');
      if (e is DioException) {
        print('❌ DioException details:');
        print('   Status: ${e.response?.statusCode}');
        print('   Data: ${e.response?.data}');
        print('   Message: ${e.message}');
        print('   Type: ${e.type}');
      }
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
      
      final response = await _dio.put('/api/users/trip-plans/${tripPlan.id}',
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
      
      final response = await _dio.patch('/api/users/trip-plans/$tripPlanId/activities',
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
      print('🔑 User UID: ${user.uid}');
      
      final response = await _dio.delete('/api/users/trip-plans/$tripPlanId');
      
      print('📊 Response status: ${response.statusCode}');
      print('📊 Response data: ${response.data}');
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ Trip plan deleted successfully');
        return true;
      }
      
      print('⚠️ Unexpected status code: ${response.statusCode}');
      return false;
    } on DioException catch (e) {
      print('❌ DioException deleting trip plan:');
      print('   Status: ${e.response?.statusCode}');
      print('   Message: ${e.message}');
      print('   Data: ${e.response?.data}');
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
}