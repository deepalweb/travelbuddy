import 'package:dio/dio.dart';
import '../config/environment.dart';

class BackendStatusChecker {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));

  static Future<Map<String, dynamic>> checkAllEndpoints() async {
    final results = <String, dynamic>{};
    
    print('🔍 Starting comprehensive backend connectivity check...');
    print('🌐 Backend URL: ${Environment.backendUrl}');
    
    // Test health endpoint
    results['health'] = await _testHealthEndpoint();
    
    // Test places API
    results['places'] = await _testPlacesEndpoint();
    
    // Test community posts API
    results['community'] = await _testCommunityEndpoint();
    
    // Test user endpoints
    results['user'] = await _testUserEndpoints();
    
    // Overall status
    final allWorking = results.values.every((result) => result['status'] == 'success');
    results['overall'] = {
      'status': allWorking ? 'success' : 'partial',
      'message': allWorking ? 'All endpoints working' : 'Some endpoints have issues'
    };
    
    return results;
  }

  static Future<Map<String, dynamic>> _testHealthEndpoint() async {
    try {
      final response = await _dio.get('/health');
      if (response.statusCode == 200) {
        return {
          'status': 'success',
          'message': 'Health endpoint working',
          'data': response.data,
          'responseTime': '${response.extra['responseTime'] ?? 'N/A'}ms'
        };
      }
      return {
        'status': 'error',
        'message': 'Health endpoint returned ${response.statusCode}'
      };
    } catch (e) {
      return {
        'status': 'error',
        'message': 'Health endpoint failed: $e'
      };
    }
  }

  static Future<Map<String, dynamic>> _testPlacesEndpoint() async {
    try {
      final response = await _dio.get('/api/places/nearby', queryParameters: {
        'lat': 6.9271,
        'lng': 79.8612,
        'q': 'restaurant',
        'radius': 5000,
      });
      
      if (response.statusCode == 200) {
        final data = response.data;
        final count = data is List ? data.length : 0;
        return {
          'status': 'success',
          'message': 'Places API working',
          'placesCount': count,
          'samplePlace': count > 0 ? data[0]['name'] : 'No places found'
        };
      }
      return {
        'status': 'error',
        'message': 'Places API returned ${response.statusCode}'
      };
    } catch (e) {
      return {
        'status': 'error',
        'message': 'Places API failed: $e'
      };
    }
  }

  static Future<Map<String, dynamic>> _testCommunityEndpoint() async {
    try {
      final response = await _dio.get('/api/community/posts', 
        queryParameters: {'limit': 5},
        options: Options(headers: {'x-user-id': 'test-user'})
      );
      
      if (response.statusCode == 200) {
        final data = response.data;
        final count = data is List ? data.length : 0;
        return {
          'status': 'success',
          'message': 'Community API working',
          'postsCount': count,
          'samplePost': count > 0 ? data[0]['content']['text'] : 'No posts found'
        };
      }
      return {
        'status': 'error',
        'message': 'Community API returned ${response.statusCode}'
      };
    } catch (e) {
      return {
        'status': 'error',
        'message': 'Community API failed: $e'
      };
    }
  }

  static Future<Map<String, dynamic>> _testUserEndpoints() async {
    try {
      // Test user stats endpoint
      final response = await _dio.get('/api/users/test-user/stats');
      
      if (response.statusCode == 200) {
        return {
          'status': 'success',
          'message': 'User endpoints working',
          'data': response.data
        };
      }
      return {
        'status': 'partial',
        'message': 'User endpoints returned ${response.statusCode}'
      };
    } catch (e) {
      return {
        'status': 'partial',
        'message': 'User endpoints not fully implemented: $e'
      };
    }
  }

  static Future<bool> quickHealthCheck() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static void printResults(Map<String, dynamic> results) {
    print('\n📊 BACKEND CONNECTIVITY REPORT');
    print('=' * 50);
    
    results.forEach((endpoint, result) {
      if (endpoint == 'overall') return;
      
      final status = result['status'];
      final icon = status == 'success' ? '✅' : status == 'partial' ? '⚠️' : '❌';
      
      print('$icon ${endpoint.toUpperCase()}: ${result['message']}');
      
      if (result.containsKey('placesCount')) {
        print('   📍 Found ${result['placesCount']} places');
      }
      if (result.containsKey('postsCount')) {
        print('   💬 Found ${result['postsCount']} posts');
      }
      if (result.containsKey('responseTime')) {
        print('   ⏱️ Response time: ${result['responseTime']}');
      }
    });
    
    print('=' * 50);
    final overall = results['overall'];
    final overallIcon = overall['status'] == 'success' ? '✅' : '⚠️';
    print('$overallIcon OVERALL: ${overall['message']}');
    print('');
  }
}