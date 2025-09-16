import 'package:dio/dio.dart';
import '../config/environment.dart';

class DebugService {
  static Future<void> testApiConnection() async {
    final dio = Dio();
    
    print('🔍 Testing API connection...');
    print('Backend URL: ${Environment.backendUrl}');
    
    try {
      // Test basic connection
      final response = await dio.get('${Environment.backendUrl}/health');
      print('✅ Health check: ${response.statusCode}');
    } catch (e) {
      print('❌ Health check failed: $e');
    }
    
    try {
      // Test places endpoint with mock data
      final response = await dio.get('${Environment.backendUrl}/api/places/nearby', 
        queryParameters: {
          'lat': 37.7749,
          'lng': -122.4194,
          'category': 'all',
          'radius': 20000,
        }
      );
      print('✅ Places API: ${response.statusCode}');
      print('📍 Places found: ${response.data?.length ?? 0}');
    } catch (e) {
      print('❌ Places API failed: $e');
    }
  }
  
  static void logLocationInfo(double? lat, double? lng) {
    print('📍 Current Location:');
    print('   Latitude: $lat');
    print('   Longitude: $lng');
    print('   Valid: ${lat != null && lng != null}');
  }
  
  static void logPlacesRequest({
    required double latitude,
    required double longitude,
    required String category,
    required int radius,
    String searchQuery = '',
  }) {
    print('🔍 Places Request:');
    print('   URL: ${Environment.backendUrl}/api/places/nearby');
    print('   Lat: $latitude');
    print('   Lng: $longitude');
    print('   Category: $category');
    print('   Radius: $radius');
    print('   Query: "$searchQuery"');
  }
}