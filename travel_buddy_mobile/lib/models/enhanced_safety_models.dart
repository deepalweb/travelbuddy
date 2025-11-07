// Enhanced Safety Models for Next-Generation Safety Hub

import '../models/safety_info.dart';

class SafetyAlert {
  final String id;
  final String title;
  final String description;
  final SafetyAlertType type;
  final SafetyAlertSeverity severity;
  final DateTime timestamp;
  final String? location;
  final double? latitude;
  final double? longitude;
  final bool isActive;

  SafetyAlert({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.severity,
    required this.timestamp,
    this.location,
    this.latitude,
    this.longitude,
    this.isActive = true,
  });

  factory SafetyAlert.fromJson(Map<String, dynamic> json) {
    return SafetyAlert(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      type: SafetyAlertType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => SafetyAlertType.general,
      ),
      severity: SafetyAlertSeverity.values.firstWhere(
        (e) => e.name == json['severity'],
        orElse: () => SafetyAlertSeverity.medium,
      ),
      timestamp: DateTime.parse(json['timestamp']),
      location: json['location'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      isActive: json['isActive'] ?? true,
    );
  }
}

enum SafetyAlertType {
  weather,
  security,
  health,
  transport,
  general,
  protest,
  natural_disaster,
}

enum SafetyAlertSeverity {
  low,
  medium,
  high,
  critical,
}

class TrustedContact {
  final String id;
  final String name;
  final String phone;
  final String email;
  final String relationship;
  final bool canViewLiveLocation;
  final bool receiveAlerts;
  final bool isActive;

  TrustedContact({
    required this.id,
    required this.name,
    required this.phone,
    this.email = '',
    required this.relationship,
    this.canViewLiveLocation = false,
    this.receiveAlerts = true,
    this.isActive = true,
  });

  factory TrustedContact.fromJson(Map<String, dynamic> json) {
    return TrustedContact(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      relationship: json['relationship'] ?? '',
      canViewLiveLocation: json['canViewLiveLocation'] ?? false,
      receiveAlerts: json['receiveAlerts'] ?? true,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'relationship': relationship,
      'canViewLiveLocation': canViewLiveLocation,
      'receiveAlerts': receiveAlerts,
      'isActive': isActive,
    };
  }
}

class EmergencyPhrase {
  final String english;
  final String local;
  final String pronunciation;
  final String category;

  EmergencyPhrase({
    required this.english,
    required this.local,
    required this.pronunciation,
    required this.category,
  });

  factory EmergencyPhrase.fromJson(Map<String, dynamic> json) {
    return EmergencyPhrase(
      english: json['english'] ?? '',
      local: json['local'] ?? '',
      pronunciation: json['pronunciation'] ?? '',
      category: json['category'] ?? '',
    );
  }
}

class SafetyDashboardStatus {
  final bool isOnline;
  final bool locationEnabled;
  final int emergencyContactsCount;
  final SafetyRiskLevel currentRiskLevel;
  final String? currentLocation;
  final DateTime lastUpdated;

  SafetyDashboardStatus({
    required this.isOnline,
    required this.locationEnabled,
    required this.emergencyContactsCount,
    required this.currentRiskLevel,
    this.currentLocation,
    required this.lastUpdated,
  });
}

enum SafetyRiskLevel {
  safe,
  low,
  medium,
  high,
  critical,
}

class LiveLocationSession {
  final String id;
  final String tripName;
  final DateTime startTime;
  final DateTime? endTime;
  final List<String> sharedWithContacts;
  final bool isActive;

  LiveLocationSession({
    required this.id,
    required this.tripName,
    required this.startTime,
    this.endTime,
    required this.sharedWithContacts,
    this.isActive = true,
  });
}

class OfflineSafetyData {
  final Map<String, String> emergencyNumbers;
  final List<EmergencyService> nearbyServices;
  final List<EmergencyPhrase> emergencyPhrases;
  final List<SafetyAlert> safetyAlerts;
  final DateTime lastUpdated;

  OfflineSafetyData({
    required this.emergencyNumbers,
    required this.nearbyServices,
    required this.emergencyPhrases,
    required this.safetyAlerts,
    required this.lastUpdated,
  });

  factory OfflineSafetyData.fromJson(Map<String, dynamic> json) {
    return OfflineSafetyData(
      emergencyNumbers: Map<String, String>.from(json['emergencyNumbers'] ?? {}),
      nearbyServices: (json['nearbyServices'] as List? ?? [])
          .map((e) => EmergencyService.fromJson(e))
          .toList(),
      emergencyPhrases: (json['emergencyPhrases'] as List? ?? [])
          .map((e) => EmergencyPhrase.fromJson(e))
          .toList(),
      safetyAlerts: (json['safetyAlerts'] as List? ?? [])
          .map((e) => SafetyAlert.fromJson(e))
          .toList(),
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'emergencyNumbers': emergencyNumbers,
      'nearbyServices': nearbyServices.map((e) => EmergencyServiceExtension(e).toJson()).toList(),
      'emergencyPhrases': emergencyPhrases.map((e) => {
        'english': e.english,
        'local': e.local,
        'pronunciation': e.pronunciation,
        'category': e.category,
      }).toList(),
      'safetyAlerts': safetyAlerts.map((e) => {
        'id': e.id,
        'title': e.title,
        'description': e.description,
        'type': e.type.name,
        'severity': e.severity.name,
        'timestamp': e.timestamp.toIso8601String(),
        'location': e.location,
        'latitude': e.latitude,
        'longitude': e.longitude,
        'isActive': e.isActive,
      }).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }
}

// Extension for EmergencyService to add toJson
extension EmergencyServiceExtension on EmergencyService {
  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'name': name,
      'address': address,
      'phone': phone,
      'latitude': latitude,
      'longitude': longitude,
      'distance': distance,
      'is24Hours': is24Hours,
      'hasEnglishStaff': hasEnglishStaff,
      'isVerifiedSafe': isVerifiedSafe,
      'rating': rating,
      'services': services,
    };
  }
}

