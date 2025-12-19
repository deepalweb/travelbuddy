import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/environment.dart';

class TravelAgent {
  final String id;
  final String name;
  final String description;
  final List<String> specializations;
  final double rating;
  final String phoneNumber;
  final String email;
  final String? website;
  final AgentLocation? location;
  double? distance;

  TravelAgent({
    required this.id,
    required this.name,
    required this.description,
    required this.specializations,
    required this.rating,
    required this.phoneNumber,
    required this.email,
    this.website,
    this.location,
  });

  factory TravelAgent.fromJson(Map<String, dynamic> json) {
    return TravelAgent(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      specializations: List<String>.from(json['specializations'] ?? []),
      rating: (json['rating'] ?? 0.0).toDouble(),
      phoneNumber: json['phoneNumber'] ?? '',
      email: json['email'] ?? '',
      website: json['website'],
      location: json['location'] != null ? AgentLocation.fromJson(json['location']) : null,
    );
  }
}

class AgentLocation {
  final String type;
  final List<double> coordinates;

  AgentLocation({required this.type, required this.coordinates});

  factory AgentLocation.fromJson(Map<String, dynamic> json) {
    return AgentLocation(
      type: json['type'] ?? 'Point',
      coordinates: List<double>.from(json['coordinates'] ?? [0.0, 0.0]),
    );
  }
}

class TravelAgentsService {
  static Future<List<TravelAgent>> getNearbyAgents(double lat, double lng, {int radius = 20000}) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/travel-agents/nearby?lat=$lat&lng=$lng&radius=$radius'),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final agents = (data['agents'] as List)
            .map((json) => TravelAgent.fromJson(json))
            .toList();
        return agents;
      }
      return [];
    } catch (e) {
      print('❌ Travel agents service error: $e');
      return [];
    }
  }
}
