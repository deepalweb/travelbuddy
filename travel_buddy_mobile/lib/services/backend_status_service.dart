import 'package:dio/dio.dart';
import '../config/environment.dart';

class BackendStatusService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static Future<Map<String, dynamic>> checkBackendStatus() async {
    final results = <String, dynamic>{
      'baseUrl': Environment.backendUrl,
      'timestamp': DateTime.now().toIso8601String(),
      'endpoints': <String, dynamic>{},
    };

    // Test endpoints
    final endpoints = [
      '/api/users',
      '/api/posts',
      '/api/upload',
      '/upload',
      '/api/files/upload',
    ];

    for (final endpoint in endpoints) {
      try {
        final response = await _dio.get(endpoint);
        results['endpoints'][endpoint] = {
          'status': 'SUCCESS',
          'statusCode': response.statusCode,
          'responseTime': '${DateTime.now().millisecondsSinceEpoch}ms',
        };
      } catch (e) {
        if (e is DioException) {
          results['endpoints'][endpoint] = {
            'status': 'ERROR',
            'statusCode': e.response?.statusCode ?? 0,
            'error': e.message,
            'type': e.type.toString(),
          };
        } else {
          results['endpoints'][endpoint] = {
            'status': 'ERROR',
            'error': e.toString(),
          };
        }
      }
    }

    return results;
  }

  static Future<bool> testImageUpload() async {
    try {
      // Test if upload endpoint exists with HEAD request
      final response = await _dio.head('/api/upload/image');
      return response.statusCode == 200 || response.statusCode == 405;
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 405) {
        return true; // Endpoint exists but wrong method
      }
      return false;
    }
  }
}