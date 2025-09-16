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
    return EmergencyService(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phoneNumber: json['phoneNumber'] ?? 'Call 911',
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
      type: json['type'] ?? 'emergency',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
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