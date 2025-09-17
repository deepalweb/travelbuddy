class EmergencyService {
  final String id;
  final String name;
  final String address;
  final String phoneNumber;
  final double distance;
  final String type; // 'police' or 'hospital'
  final double? latitude;
  final double? longitude;
  final double rating;

  EmergencyService({
    required this.id,
    required this.name,
    required this.address,
    required this.phoneNumber,
    required this.distance,
    required this.type,
    this.latitude,
    this.longitude,
    this.rating = 0.0,
  });

  factory EmergencyService.fromJson(Map<String, dynamic> json) {
    // Handle distance as string (e.g., "2.3 km") or number
    double distanceValue = 0.0;
    if (json['distance'] is String) {
      final distanceStr = json['distance'] as String;
      final match = RegExp(r'([0-9.]+)').firstMatch(distanceStr);
      if (match != null) {
        distanceValue = double.tryParse(match.group(1) ?? '0') ?? 0.0;
      }
    } else if (json['distance'] is num) {
      distanceValue = (json['distance'] as num).toDouble();
    }
    
    return EmergencyService(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phoneNumber: json['phoneNumber'] ?? json['emergencyNumber'] ?? 'Call 911',
      distance: distanceValue,
      type: json['type'] ?? json['serviceType'] ?? 'emergency',
      latitude: json['coordinates']?['lat']?.toDouble() ?? (json['latitude'] as num?)?.toDouble(),
      longitude: json['coordinates']?['lng']?.toDouble() ?? (json['longitude'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'phoneNumber': phoneNumber,
      'distance': distance,
      'type': type,
      'latitude': latitude,
      'longitude': longitude,
      'rating': rating,
    };
  }
}