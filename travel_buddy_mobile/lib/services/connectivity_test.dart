import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../utils/debug_logger.dart';

class ConnectivityTest {
  static Future<void> testBackendConnectivity() async {
    final dio = Dio(BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: Duration(seconds: 10),
      receiveTimeout: Duration(seconds: 10),
    ));

    DebugLogger.info('🔍 Testing backend connectivity...');
    DebugLogger.info('🌐 Backend URL: ${Environment.backendUrl}');

    try {
      // Test health endpoint
      final healthResponse = await dio.get('/health');
      DebugLogger.log('✅ Health check: ${healthResponse.statusCode} - ${healthResponse.data}');
    } catch (e) {
      DebugLogger.error('Health check failed: $e');
    }

    try {
      // Test places API
      final placesResponse = await dio.get('/api/places/nearby', queryParameters: {
        'lat': 6.9271,
        'lng': 79.8612,
        'q': 'restaurant',
        'radius': 5000,
      });
      DebugLogger.log('✅ Places API: ${placesResponse.statusCode} - ${placesResponse.data?.length ?? 0} places');
    } catch (e) {
      DebugLogger.error('Places API failed: $e');
    }

    try {
      // Test posts API
      final postsResponse = await dio.get('/api/posts', queryParameters: {
        'limit': 5,
      });
      DebugLogger.log('✅ Posts API: ${postsResponse.statusCode} - ${postsResponse.data?.length ?? 0} posts');
    } catch (e) {
      DebugLogger.error('Posts API failed: $e');
    }
  }
}