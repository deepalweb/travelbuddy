import 'package:dio/dio.dart';
import '../config/environment.dart';

class BackendConnectivityService {
  static final BackendConnectivityService _instance = BackendConnectivityService._internal();
  factory BackendConnectivityService() => _instance;
  BackendConnectivityService._internal();

  final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  // Test backend connectivity
  Future<bool> testConnection() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Backend connectivity test failed: $e');
      return false;
    }
  }

  // Get user stats from backend
  Future<Map<String, dynamic>?> getUserStats(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/stats');
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      print('❌ Failed to get user stats: $e');
    }
    return null;
  }

  // Get user favorites
  Future<List<String>> getUserFavorites(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/favorites');
      if (response.statusCode == 200) {
        return List<String>.from(response.data);
      }
    } catch (e) {
      print('❌ Failed to get favorites: $e');
    }
    return [];
  }

  // Get user trip plans
  Future<List<Map<String, dynamic>>> getUserTripPlans(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/trip-plans');
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      print('❌ Failed to get trip plans: $e');
    }
    return [];
  }

  // Get weather data
  Future<Map<String, dynamic>?> getWeatherData(double lat, double lng) async {
    try {
      final response = await _dio.get('/api/weather/google', queryParameters: {
        'lat': lat,
        'lng': lng,
      });
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      print('❌ Failed to get weather: $e');
    }
    return null;
  }

  // Get emergency services
  Future<List<Map<String, dynamic>>> getEmergencyServices(double lat, double lng) async {
    try {
      final response = await _dio.get('/api/emergency/services', queryParameters: {
        'lat': lat,
        'lng': lng,
      });
      if (response.statusCode == 200) {
        return List<Map<String, dynamic>>.from(response.data);
      }
    } catch (e) {
      print('❌ Failed to get emergency services: $e');
    }
    return [];
  }
}