// Enhanced Dishes API Service for Backend

import 'package:dio/dio.dart';
import '../models/dish_models.dart';
import '../config/environment.dart';

class EnhancedDishesApiService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(minutes: 2),
    receiveTimeout: Duration(minutes: 2),
    headers: {'Content-Type': 'application/json'},
  ));

  // Enhanced dishes API call with filters
  static Future<List<Map<String, dynamic>>> getLocalDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
    String language = 'en',
  }) async {
    try {
      print('🍽️ Calling backend dishes API...');
      
      final response = await _dio.post('/api/dishes/generate', data: {
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        if (destination != null) 'destination': destination,
        'filters': filters ?? {},
        'language': language,
      });

      print('✅ Backend response received');
      
      // Transform backend response to mobile format
      final backendData = response.data;
      final dishes = <Map<String, dynamic>>[];
      
      if (backendData['dishes'] != null) {
        for (var dish in backendData['dishes']) {
          dishes.add({
            'id': DateTime.now().millisecondsSinceEpoch.toString() + '_${dishes.length}',
            'name': dish['name'] ?? 'Local Dish',
            'description': dish['description'] ?? 'Delicious local specialty',
            'priceRange': _mapPriceRange(dish['category']),
            'averagePrice': dish['average_price'] ?? '\$10-15',
            'cuisine': dish['category'] ?? 'Local',
            'restaurantName': dish['recommended_places']?.isNotEmpty == true 
                ? dish['recommended_places'][0]['name'] 
                : 'Local Restaurant',
            'restaurantAddress': dish['recommended_places']?.isNotEmpty == true 
                ? dish['recommended_places'][0]['address'] 
                : 'Local Area',
            'restaurantId': dish['recommended_places']?.isNotEmpty == true 
                ? dish['recommended_places'][0]['place_id'] ?? 'local_${dishes.length}'
                : 'local_${dishes.length}',
            'imageUrl': dish['user_photos']?.isNotEmpty == true 
                ? dish['user_photos'][0] 
                : '',
            'rating': dish['recommended_places']?.isNotEmpty == true 
                ? dish['recommended_places'][0]['rating'] ?? 4.0
                : 4.0,
            'dietaryTags': dish['dietary_tags'] ?? [],
            'culturalNote': dish['cultural_significance'] ?? 'A local favorite',
          });
        }
      }
      
      return dishes;
    } on DioException catch (e) {
      print('❌ Backend dishes error: ${e.message}');
      if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Backend timeout. Please try again.');
      }
      throw Exception('Failed to load dishes: ${e.message}');
    }
  }
  
  static String _mapPriceRange(String? category) {
    if (category == null) return 'mid-range';
    switch (category.toLowerCase()) {
      case 'breakfast':
      case 'street food':
        return 'budget';
      case 'dinner':
        return 'fine-dining';
      default:
        return 'mid-range';
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

  // Get meal suggestions using backend
  static Future<List<Map<String, dynamic>>> getMealSuggestions({
    required double latitude,
    required double longitude,
    required String timeOfDay,
    String? weather,
    List<String>? dietaryPrefs,
  }) async {
    try {
      final filters = {
        'timeOfDay': timeOfDay,
        if (weather != null) 'weather': weather,
        if (dietaryPrefs != null && dietaryPrefs.isNotEmpty) 'dietary': dietaryPrefs,
      };
      
      return await getLocalDishes(
        latitude: latitude,
        longitude: longitude,
        filters: filters,
      );
    } catch (e) {
      print('Failed to get meal suggestions: $e');
      return [];
    }
  }
  
  // Test backend connection
  static Future<bool> testConnection() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      print('Backend connection test failed: $e');
      return false;
    }
  }
}