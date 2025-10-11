import 'dart:convert';
import 'package:http/http.dart' as http;

class ConfigService {
  static const String baseUrl = 'https://travelbuddy-backend-h5hqhqhqhqhqhqhq.azurewebsites.net';
  
  static Future<Map<String, dynamic>> getFirebaseConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/config/firebase'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('HTTP ${response.statusCode}: ${response.body}');
    } catch (e) {
      print('ConfigService error: $e');
      // Fallback to local config if backend fails
      return {
        'apiKey': 'fallback-key',
        'authDomain': 'travelbuddy-2d1c5.firebaseapp.com',
        'projectId': 'travelbuddy-2d1c5',
        'storageBucket': 'travelbuddy-2d1c5.firebasestorage.app',
        'messagingSenderId': '45425409967',
        'appId': '1:45425409967:android:8808750a02d7c77356b95a'
      };
    }
  }
}