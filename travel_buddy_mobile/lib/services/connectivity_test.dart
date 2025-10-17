import 'package:dio/dio.dart';
import '../config/environment.dart';

class ConnectivityTest {
  static Future<void> testBackendConnectivity() async {
    final dio = Dio(BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: Duration(seconds: 10),
      receiveTimeout: Duration(seconds: 10),
    ));

    print('🔍 Testing backend connectivity...');
    print('🌐 Backend URL: ${Environment.backendUrl}');

    try {
      // Test health endpoint
      final healthResponse = await dio.get('/health');
      print('✅ Health check: ${healthResponse.statusCode} - ${healthResponse.data}');
    } catch (e) {
      print('❌ Health check failed: $e');
    }

    try {
      // Test places API
      final placesResponse = await dio.get('/api/places/nearby', queryParameters: {
        'lat': 6.9271,
        'lng': 79.8612,
        'q': 'restaurant',
        'radius': 5000,
      });
      print('✅ Places API: ${placesResponse.statusCode} - ${placesResponse.data?.length ?? 0} places');
    } catch (e) {
      print('❌ Places API failed: $e');
    }

    try {
      // Test posts API
      final postsResponse = await dio.get('/api/posts', queryParameters: {
        'limit': 5,
      });
      print('✅ Posts API: ${postsResponse.statusCode} - ${postsResponse.data?.length ?? 0} posts');
    } catch (e) {
      print('❌ Posts API failed: $e');
    }
  }
}