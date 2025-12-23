import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/environment.dart';

class TransportProvider {
  final String id;
  final String companyName;
  final String vehicleType;
  final String description;
  final List<String> services;
  final double rating;
  final String phone;
  final String email;
  final String route;
  final int price;
  double? distance;

  TransportProvider({
    required this.id,
    required this.companyName,
    required this.vehicleType,
    required this.description,
    required this.services,
    required this.rating,
    required this.phone,
    required this.email,
    required this.route,
    required this.price,
  });

  factory TransportProvider.fromJson(Map<String, dynamic> json) {
    final vehicleTypes = json['vehicleTypes'] != null ? List<String>.from(json['vehicleTypes']) : ['Transport'];
    final serviceAreas = json['serviceAreas'] != null ? List<String>.from(json['serviceAreas']) : [];
    
    return TransportProvider(
      id: json['_id'] ?? json['id'] ?? '',
      companyName: json['companyName'] ?? '',
      vehicleType: vehicleTypes.isNotEmpty ? vehicleTypes[0] : 'Transport',
      description: json['description'] ?? 'Professional transport service',
      services: vehicleTypes,
      rating: 5.0,
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      route: serviceAreas.length >= 2 ? '${serviceAreas[0]} - ${serviceAreas[1]}' : serviceAreas.isNotEmpty ? serviceAreas[0] : 'Various',
      price: json['basePrice'] != null ? int.tryParse(json['basePrice'].toString().replaceAll(RegExp(r'[^0-9]'), '')) ?? 500 : 500,
    );
  }
}

class TransportService {
  static Future<List<TransportProvider>> getNearbyTransport(double lat, double lng, {int radius = 20000}) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/transport-providers/services'),
      ).timeout(const Duration(seconds: 10));

      print('🚗 Transport API Response: ${response.statusCode}');
      print('🚗 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final providersList = data is List ? data : [];
        
        print('🚗 Found ${providersList.length} providers');
        
        final providers = (providersList as List)
            .map((json) => TransportProvider.fromJson(json))
            .toList();
        return providers;
      }
      return [];
    } catch (e) {
      print('❌ Transport service error: $e');
      return [];
    }
  }
}
