class SafetyInfo {
  final String country;
  final String city;
  final List<EmergencyService> emergencyServices;
  final List<EmergencyContact> emergencyContacts;
  final String emergencyNumber;
  final String policeNumber;
  final String ambulanceNumber;
  final String fireNumber;
  final List<String> alternativeNumbers;
  final String embassyNumber;
  final String touristHelpline;
  final String taxiSafetyLine;
  final bool isOfflineMode;

  SafetyInfo({
    required this.country,
    required this.city,
    required this.emergencyServices,
    required this.emergencyContacts,
    required this.emergencyNumber,
    required this.policeNumber,
    required this.ambulanceNumber,
    required this.fireNumber,
    this.alternativeNumbers = const [],
    this.embassyNumber = '',
    this.touristHelpline = '',
    this.taxiSafetyLine = '',
    this.isOfflineMode = false,
  });

  factory SafetyInfo.fromJson(Map<String, dynamic> json) {
    return SafetyInfo(
      country: json['country'] ?? '',
      city: json['city'] ?? '',
      emergencyNumber: json['emergencyNumber'] ?? '112',
      policeNumber: json['policeNumber'] ?? '112',
      ambulanceNumber: json['ambulanceNumber'] ?? '112',
      fireNumber: json['fireNumber'] ?? '112',
      alternativeNumbers: List<String>.from(json['alternativeNumbers'] ?? []),
      embassyNumber: json['embassyNumber'] ?? '',
      touristHelpline: json['touristHelpline'] ?? '',
      taxiSafetyLine: json['taxiSafetyLine'] ?? '',
      isOfflineMode: json['isOfflineMode'] ?? false,
      emergencyServices: (json['emergencyServices'] as List? ?? [])
          .map((e) => EmergencyService.fromJson(e))
          .toList(),
      emergencyContacts: (json['emergencyContacts'] as List? ?? [])
          .map((e) => EmergencyContact.fromJson(e))
          .toList(),
    );
  }
}

class EmergencyService {
  final String type; // 'police', 'hospital', 'pharmacy'
  final String name;
  final String address;
  final String phone;
  final double latitude;
  final double longitude;
  final double distance; // in km
  final bool is24Hours;
  final bool hasEnglishStaff;
  final bool isVerifiedSafe;
  final double rating;
  final List<String> services;

  EmergencyService({
    required this.type,
    required this.name,
    required this.address,
    required this.phone,
    required this.latitude,
    required this.longitude,
    required this.distance,
    this.is24Hours = false,
    this.hasEnglishStaff = false,
    this.isVerifiedSafe = true,
    this.rating = 0.0,
    this.services = const [],
  });

  factory EmergencyService.fromJson(Map<String, dynamic> json) {
    return EmergencyService(
      type: json['type'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      phone: json['phone'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
      is24Hours: json['is24Hours'] ?? false,
      hasEnglishStaff: json['hasEnglishStaff'] ?? false,
      isVerifiedSafe: json['isVerifiedSafe'] ?? true,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      services: List<String>.from(json['services'] ?? []),
    );
  }
}

class EmergencyContact {
  final String id;
  final String name;
  final String phone;
  final String relationship;
  final bool isActive;

  EmergencyContact({
    required this.id,
    required this.name,
    required this.phone,
    required this.relationship,
    this.isActive = true,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      relationship: json['relationship'] ?? '',
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'relationship': relationship,
      'isActive': isActive,
    };
  }
}