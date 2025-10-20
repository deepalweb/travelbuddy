import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class GoogleServicesTest {
  /// Test Google Maps API connection
  static Future<Map<String, dynamic>> testGoogleMapsConnection() async {
    final results = <String, dynamic>{};
    
    // Check API key configuration
    results['api_key_configured'] = Environment.googleMapsApiKey != 'YOUR_GOOGLE_MAPS_KEY' && 
                                   Environment.googleMapsApiKey.isNotEmpty;
    
    if (!results['api_key_configured']) {
      results['status'] = 'FAILED';
      results['message'] = 'Google Maps API key not configured';
      return results;
    }
    
    // Test Directions API
    results['directions_api'] = await _testDirectionsAPI();
    
    // Test Places API  
    results['places_api'] = await _testPlacesAPI();
    
    // Test Geocoding API
    results['geocoding_api'] = await _testGeocodingAPI();
    
    // Overall status
    final allWorking = results['directions_api']['working'] && 
                      results['places_api']['working'] && 
                      results['geocoding_api']['working'];
    
    results['status'] = allWorking ? 'SUCCESS' : 'PARTIAL';
    results['message'] = allWorking ? 'All Google Services connected' : 'Some services have issues';
    
    return results;
  }
  
  /// Test Google Directions API
  static Future<Map<String, dynamic>> _testDirectionsAPI() async {
    try {
      final url = 'https://maps.googleapis.com/maps/api/directions/json?'
          'origin=40.7128,-74.0060&'
          'destination=40.7589,-73.9851&'
          'key=${Environment.googleMapsApiKey}';
      
      final response = await http.get(Uri.parse(url));
      final data = json.decode(response.body);
      
      return {
        'working': data['status'] == 'OK',
        'status': data['status'],
        'error': data['error_message'] ?? 'None',
        'routes_found': data['routes']?.length ?? 0,
      };
    } catch (e) {
      return {
        'working': false,
        'status': 'ERROR',
        'error': e.toString(),
        'routes_found': 0,
      };
    }
  }
  
  /// Test Google Places API
  static Future<Map<String, dynamic>> _testPlacesAPI() async {
    try {
      final url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
          'location=40.7128,-74.0060&'
          'radius=1000&'
          'type=restaurant&'
          'key=${Environment.googleMapsApiKey}';
      
      final response = await http.get(Uri.parse(url));
      final data = json.decode(response.body);
      
      return {
        'working': data['status'] == 'OK',
        'status': data['status'],
        'error': data['error_message'] ?? 'None',
        'places_found': data['results']?.length ?? 0,
      };
    } catch (e) {
      return {
        'working': false,
        'status': 'ERROR',
        'error': e.toString(),
        'places_found': 0,
      };
    }
  }
  
  /// Test Google Geocoding API
  static Future<Map<String, dynamic>> _testGeocodingAPI() async {
    try {
      final url = 'https://maps.googleapis.com/maps/api/geocode/json?'
          'address=Times+Square,New+York,NY&'
          'key=${Environment.googleMapsApiKey}';
      
      final response = await http.get(Uri.parse(url));
      final data = json.decode(response.body);
      
      return {
        'working': data['status'] == 'OK',
        'status': data['status'],
        'error': data['error_message'] ?? 'None',
        'results_found': data['results']?.length ?? 0,
      };
    } catch (e) {
      return {
        'working': false,
        'status': 'ERROR',
        'error': e.toString(),
        'results_found': 0,
      };
    }
  }
  
  /// Get connection status summary
  static String getConnectionSummary(Map<String, dynamic> results) {
    if (!results['api_key_configured']) {
      return '❌ Google Maps API key not configured';
    }
    
    final status = results['status'];
    switch (status) {
      case 'SUCCESS':
        return '✅ All Google Services connected and working';
      case 'PARTIAL':
        return '⚠️ Some Google Services have issues';
      case 'FAILED':
        return '❌ Google Services connection failed';
      default:
        return '❓ Unknown connection status';
    }
  }
}