// Backend Dishes Service - Simplified version for backend integration

import 'package:dio/dio.dart';
import '../config/environment.dart';

class BackendDishesService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  // Get local dishes from backend
  static Future<List<Map<String, dynamic>>> getLocalDishes({
    required double lat,
    required double lng,
    int limit = 10,
    Map<String, dynamic>? filters,
  }) async {
    try {
      print('🍽️ Calling backend dishes API at: ${Environment.backendUrl}');
      print('📍 Coordinates: $lat, $lng');
      
      final requestData = {
        'latitude': lat,
        'longitude': lng,
        'filters': filters ?? {},
        'language': 'en',
      };
      
      print('📤 Request data: $requestData');
      
      final response = await _dio.post('/api/dishes/generate', data: requestData);

      print('✅ Backend response received: ${response.statusCode}');
      
      // Transform backend response to mobile format
      final backendData = response.data;
      final dishes = <Map<String, dynamic>>[];
      
      print('🔍 Backend response structure: ${backendData.keys}');
      
      if (backendData['dishes'] != null) {
        final dishList = backendData['dishes'] as List;
        print('📋 Found ${dishList.length} dishes in response');
        
        for (int i = 0; i < dishList.length; i++) {
          final dish = dishList[i];
          print('🍽️ Processing dish $i: ${dish['name']}');
          
          dishes.add({
            'id': DateTime.now().millisecondsSinceEpoch.toString() + '_$i',
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
                ? dish['recommended_places'][0]['place_id'] ?? 'local_$i'
                : 'local_$i',
            'imageUrl': dish['user_photos']?.isNotEmpty == true 
                ? dish['user_photos'][0] 
                : '',
            'rating': dish['recommended_places']?.isNotEmpty == true 
                ? (dish['recommended_places'][0]['rating'] ?? 4.0).toDouble()
                : 4.0,
            'dietaryTags': List<String>.from(dish['dietary_tags'] ?? []),
            'culturalNote': dish['cultural_significance'] ?? 'A local favorite',
          });
        }
      } else {
        print('⚠️ No dishes found in backend response');
      }
      
      print('🎉 Transformed ${dishes.length} dishes from backend');
      return dishes;
      
    } on DioException catch (e) {
      print('❌ Backend dishes error: ${e.message}');
      print('❌ Error type: ${e.type}');
      print('❌ Status code: ${e.response?.statusCode}');
      print('❌ Response data: ${e.response?.data}');
      
      if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Backend timeout. Please check your connection.');
      }
      if (e.type == DioExceptionType.connectionError) {
        throw Exception('Cannot connect to backend. Please check if the server is running.');
      }
      if (e.response?.statusCode == 400) {
        throw Exception('Bad request: ${e.response?.data['error'] ?? 'Invalid request format'}');
      }
      if (e.response?.statusCode == 500) {
        throw Exception('Server error: ${e.response?.data['message'] ?? 'Internal server error'}');
      }
      throw Exception('Failed to load dishes: ${e.message}');
    } catch (e) {
      print('❌ Unexpected error: $e');
      throw Exception('Unexpected error: $e');
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
  
  // Test backend connection
  static Future<bool> testConnection() async {
    try {
      print('🔍 Testing backend connection...');
      final response = await _dio.get('/health');
      print('✅ Backend health check: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Backend connection test failed: $e');
      return false;
    }
  }
  
  // Get backend status
  static Future<Map<String, dynamic>> getBackendStatus() async {
    try {
      final response = await _dio.get('/health');
      return {
        'connected': true,
        'status': response.data,
        'url': Environment.backendUrl,
      };
    } catch (e) {
      return {
        'connected': false,
        'error': e.toString(),
        'url': Environment.backendUrl,
      };
    }
  }
}