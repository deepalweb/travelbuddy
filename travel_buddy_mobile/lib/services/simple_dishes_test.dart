// Simple test to check backend connectivity and dishes API

import 'package:dio/dio.dart';
import '../config/environment.dart';

class SimpleDishesTest {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: Duration(seconds: 10),
    receiveTimeout: Duration(seconds: 10),
  ));

  // Test 1: Check if backend is reachable
  static Future<void> testBackendHealth() async {
    try {
      print('🔍 Testing backend health...');
      final response = await _dio.get('${Environment.backendUrl}/health');
      print('✅ Backend health: ${response.statusCode}');
      print('📄 Response: ${response.data}');
    } catch (e) {
      print('❌ Backend health failed: $e');
    }
  }

  // Test 2: Test dishes API with sample data
  static Future<void> testDishesAPI() async {
    try {
      print('🍽️ Testing dishes API...');
      
      final requestData = {
        'latitude': 40.7128,  // New York coordinates
        'longitude': -74.0060,
        'filters': {},
        'language': 'en',
      };
      
      print('📤 Sending request: $requestData');
      
      final response = await _dio.post(
        '${Environment.backendUrl}/api/dishes/generate',
        data: requestData,
      );
      
      print('✅ Dishes API response: ${response.statusCode}');
      print('📄 Response data keys: ${response.data?.keys}');
      
      if (response.data['dishes'] != null) {
        final dishes = response.data['dishes'] as List;
        print('🎉 Found ${dishes.length} dishes');
        if (dishes.isNotEmpty) {
          print('📋 First dish: ${dishes[0]['name']}');
        }
      } else {
        print('⚠️ No dishes in response');
      }
      
    } catch (e) {
      print('❌ Dishes API failed: $e');
      if (e is DioException) {
        print('📊 Status: ${e.response?.statusCode}');
        print('📄 Error data: ${e.response?.data}');
      }
    }
  }

  // Run all tests
  static Future<void> runAllTests() async {
    print('🚀 Starting backend tests...');
    print('🌐 Backend URL: ${Environment.backendUrl}');
    
    await testBackendHealth();
    await Future.delayed(Duration(seconds: 1));
    await testDishesAPI();
    
    print('✅ Tests completed');
  }
}