import 'package:http/http.dart' as http;
import 'dart:convert';
import './config/environment.dart';

class NetworkDebugger {
  static Future<void> testConnectivity() async {
    print('🔍 NETWORK DEBUG TEST');
    print('===================');
    print('Backend URL: ${Environment.backendUrl}');
    
    // Test 1: Health check
    try {
      print('\n📡 Test 1: Health Check');
      final healthResponse = await http.get(
        Uri.parse('${Environment.backendUrl}/health'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 10));
      
      print('✅ Health Status: ${healthResponse.statusCode}');
      if (healthResponse.statusCode == 200) {
        final healthData = json.decode(healthResponse.body);
        print('✅ Health Response: ${healthData['status']}');
      }
    } catch (e) {
      print('❌ Health Check Failed: $e');
    }
    
    // Test 2: Places API
    try {
      print('\n📡 Test 2: Places API');
      final placesResponse = await http.get(
        Uri.parse('${Environment.backendUrl}/api/places/mobile/nearby?lat=6.8786668&lng=79.8708167&q=restaurant&radius=20000&limit=3'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 15));
      
      print('✅ Places Status: ${placesResponse.statusCode}');
      if (placesResponse.statusCode == 200) {
        final placesData = json.decode(placesResponse.body);
        print('✅ Places Response Status: ${placesData['status']}');
        print('✅ Places Count: ${placesData['results']?.length ?? 0}');
        if (placesData['results']?.isNotEmpty == true) {
          print('✅ Sample Place: ${placesData['results'][0]['name']}');
        }
      } else {
        print('❌ Places Response Body: ${placesResponse.body}');
      }
    } catch (e) {
      print('❌ Places API Failed: $e');
    }
    
    print('\n🔍 DEBUG TEST COMPLETE');
  }
}