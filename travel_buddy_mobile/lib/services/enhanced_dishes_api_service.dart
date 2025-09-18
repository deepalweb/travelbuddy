// Enhanced Dishes API Service for Azure Backend

import 'package:dio/dio.dart';
import '../models/dish_models.dart';

class EnhancedDishesApiService {
  // Use your Azure backend URL
  static const String baseUrl = 'https://your-azure-app.azurewebsites.net/api';
  
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: Duration(minutes: 2),
    receiveTimeout: Duration(minutes: 2),
    headers: {'Content-Type': 'application/json'},
  ));

  // Enhanced dishes API call with filters
  static Future<DishesResponse> getLocalDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
    String language = 'en',
  }) async {
    try {
      final response = await _dio.post('/dishes/generate', data: {
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (destination != null) 'destination': destination,
        'filters': filters ?? {},
        'language': language,
      });

      return DishesResponse.fromJson(response.data);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Azure backend timeout. Please try again.');
      }
      throw Exception('Failed to load dishes: ${e.message}');
    }
  }

  // Add dish to trip
  static Future<void> addDishToTrip({
    required String dishName,
    required String tripId,
    required int dayNumber,
    String mealTime = 'lunch',
  }) async {
    await _dio.post('/dishes/add-to-trip', data: {
      'dishName': dishName,
      'tripId': tripId,
      'dayNumber': dayNumber,
      'mealTime': mealTime,
    });
  }

  // Get meal suggestions
  static Future<List<Dish>> getMealSuggestions({
    required double latitude,
    required double longitude,
    required String timeOfDay,
    required String weather,
    required List<String> dietaryPrefs,
  }) async {
    final response = await _dio.post('/dishes/meal-suggestions', data: {
      'latitude': latitude,
      'longitude': longitude,
      'timeOfDay': timeOfDay,
      'weather': weather,
      'dietaryPrefs': dietaryPrefs,
    });

    return (response.data['suggestions'] as List)
        .map((json) => Dish.fromJson(json))
        .toList();
  }
}