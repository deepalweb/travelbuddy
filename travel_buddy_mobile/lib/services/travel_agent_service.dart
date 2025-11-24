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
      DebugLogger.info('🧳 Fetching travel agents...');
      
      final queryParams = <String, String>{};
      if (location != null) queryParams['location'] = location;
      if (specialty != null) queryParams['specialty'] = specialty;
      if (language != null) queryParams['language'] = language;
      if (minRating != null) queryParams['minRating'] = minRating.toString();
      
      final uri = Uri.parse('${Environment.backendUrl}$_endpoint')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final agents = data.map((json) => TravelAgentModel.fromJson(json)).toList();
        DebugLogger.info('✅ Fetched ${agents.length} travel agents');
        return agents;
      } else {
        DebugLogger.info('⚠️ API returned ${response.statusCode}, using mock data');
        return _getMockAgents();
      }
    } catch (e) {
      DebugLogger.error('❌ Failed to fetch travel agents: $e');
      return _getMockAgents();
    }
  }

  static Future<TravelAgentModel?> getAgentById(String id) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}$_endpoint/$id'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return TravelAgentModel.fromJson(data);
      }
      return null;
    } catch (e) {
      DebugLogger.error('❌ Failed to get agent by ID: $e');
      return null;
    }
  }

  static List<TravelAgentModel> _getMockAgents() {
    return [
      TravelAgentModel(
        id: '1',
        name: 'Sarah Johnson',
        agency: 'Adventure Lanka Tours',
        photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
        location: 'Colombo, Sri Lanka',
        specializations: ['Adventure', 'Cultural', 'Wildlife'],
        rating: 4.8,
        reviewCount: 127,
        languages: ['English', 'Sinhala'],
        verified: true,
        experience: 8,
        description: 'Specialized in authentic Sri Lankan experiences with focus on adventure and cultural immersion.',
        phone: '+94 77 123 4567',
        email: 'sarah@adventurelanka.com',
        priceRange: '\$50-150/day',
        responseTime: '< 1 hour',
        totalTrips: 250,
        trustBadges: ['Top Rated', 'Quick Response', 'Verified'],
        profileCompletion: 100,
      ),
      TravelAgentModel(
        id: '2',
        name: 'Rajesh Kumar',
        agency: 'Ceylon Heritage Tours',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        location: 'Kandy, Sri Lanka',
        specializations: ['Cultural', 'Historical', 'Religious'],
        rating: 4.9,
        reviewCount: 203,
        languages: ['English', 'Sinhala', 'Tamil', 'Hindi'],
        verified: true,
        experience: 12,
        description: 'Expert in Sri Lankan cultural heritage and historical sites. Passionate about sharing the rich history of Ceylon.',
        phone: '+94 81 234 5678',
        email: 'rajesh@ceylonheritage.com',
        priceRange: '\$40-120/day',
        responseTime: '< 2 hours',
        totalTrips: 450,
        trustBadges: ['Expert Guide', 'Top Rated', 'Verified'],
        profileCompletion: 95,
      ),
      TravelAgentModel(
        id: '3',
        name: 'Priya Fernando',
        agency: 'Beach & Beyond',
        photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        location: 'Galle, Sri Lanka',
        specializations: ['Beach', 'Relaxation', 'Luxury'],
        rating: 4.7,
        reviewCount: 89,
        languages: ['English', 'Sinhala'],
        verified: true,
        experience: 6,
        description: 'Luxury beach experiences and coastal adventures. Specializing in high-end resort packages.',
        phone: '+94 91 345 6789',
        email: 'priya@beachandbeyond.com',
        priceRange: '\$80-200/day',
        responseTime: '< 3 hours',
        totalTrips: 180,
        trustBadges: ['Luxury Expert', 'Verified'],
        profileCompletion: 90,
      ),
    ];
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
