import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';
import '../utils/debug_logger.dart';
import '../models/travel_agent_model.dart';

class TravelAgentService {
  static const String _endpoint = '/api/travel-agents';

  static Future<List<TravelAgentModel>> getTravelAgents({
    String? location,
    String? specialty,
    String? language,
    double? minRating,
  }) async {
    try {
      DebugLogger.info('🧳 Fetching travel agents from API...');
      
      final queryParams = <String, String>{};
      if (location != null && location.isNotEmpty) queryParams['location'] = location;
      if (specialty != null && specialty.isNotEmpty) queryParams['specialty'] = specialty;
      if (language != null && language.isNotEmpty) queryParams['language'] = language;
      if (minRating != null) queryParams['minRating'] = minRating.toString();
      
      final uri = Uri.parse('${Environment.backendUrl}$_endpoint')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      
      DebugLogger.info('📡 API URL: $uri');
      
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      DebugLogger.info('📥 API Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Handle both array and object responses
        final List<dynamic> agentsList = data is List ? data : (data['agents'] ?? []);
        
        print('🔍 API returned ${agentsList.length} agents');
        
        final agents = agentsList.map((json) => TravelAgentModel.fromJson(json)).toList();
        print('✅ Using REAL API data: ${agents.length} travel agents');
        return agents;
      } else {
        print('⚠️ API returned ${response.statusCode}');
        return [];
      }
    } catch (e) {
      DebugLogger.error('❌ API call failed: $e');
      return [];
    }
  }

  static Future<TravelAgentModel?> getAgentById(String id) async {
    try {
      DebugLogger.info('🔍 Fetching agent by ID: $id');
      
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}$_endpoint/$id'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        DebugLogger.info('✅ Agent found: ${data['name']}');
        return TravelAgentModel.fromJson(data);
      }
      
      DebugLogger.info('⚠️ Agent not found (${response.statusCode})');
      return null;
    } catch (e) {
      DebugLogger.error('❌ Failed to get agent by ID: $e');
      return null;
    }
  }



  static Future<List<String>> getSpecializations() async {
    return [
      'Adventure',
      'Cultural',
      'Wildlife',
      'Beach',
      'Historical',
      'Religious',
      'Luxury',
      'Budget',
      'Family',
      'Honeymoon',
    ];
  }

  static Future<List<String>> getLanguages() async {
    return [
      'English',
      'Sinhala',
      'Tamil',
      'Hindi',
      'German',
      'French',
      'Chinese',
      'Japanese',
    ];
  }
}
