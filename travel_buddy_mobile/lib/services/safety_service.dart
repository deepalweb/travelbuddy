import 'package:url_launcher/url_launcher.dart';


class SafetyService {
  static final SafetyService _instance = SafetyService._internal();
  factory SafetyService() => _instance;
  SafetyService._internal();

  // Emergency contacts storage
  final List<EmergencyContact> _emergencyContacts = [];
  List<EmergencyContact> get emergencyContacts => _emergencyContacts;

  // Make phone call
  Future<bool> makePhoneCall(String phoneNumber) async {
    try {
      final cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
      final uri = Uri(scheme: 'tel', path: cleanNumber);
      
      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri);
      }
      return false;
    } catch (e) {
      print('Error making phone call: $e');
      return false;
    }
  }

  // Send SOS alert
  Future<bool> sendSOSAlert(String location) async {
    try {
      if (_emergencyContacts.isEmpty) {
        return false;
      }

      final message = 'EMERGENCY: I need help! My location: $location';
      
      for (final contact in _emergencyContacts) {
        await _sendSMS(contact.phoneNumber, message);
      }
      
      return true;
    } catch (e) {
      print('Error sending SOS alert: $e');
      return false;
    }
  }

  Future<bool> _sendSMS(String phoneNumber, String message) async {
    try {
      final uri = Uri(
        scheme: 'sms',
        path: phoneNumber,
        queryParameters: {'body': message},
      );
      
      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri);
      }
      return false;
    } catch (e) {
      print('Error sending SMS: $e');
      return false;
    }
  }

  // Emergency contacts management
  void addEmergencyContact(EmergencyContact contact) {
    _emergencyContacts.add(contact);
  }

  void removeEmergencyContact(String id) {
    _emergencyContacts.removeWhere((contact) => contact.id == id);
  }

  // Send SOS message to specific contact
  Future<bool> sendSOSMessage(String phoneNumber, String message) async {
    return await _sendSMS(phoneNumber, message);
  }

  // Share location
  Future<bool> shareLocation(String message) async {
    try {
      final uri = Uri(
        scheme: 'sms',
        queryParameters: {'body': message},
      );
      
      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri);
      }
      return false;
    } catch (e) {
      print('Error sharing location: $e');
      return false;
    }
  }
}

class EmergencyContact {
  final String id;
  final String name;
  final String phoneNumber;
  final String relationship;

  EmergencyContact({
    required this.id,
    required this.name,
    required this.phoneNumber,
    required this.relationship,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) {
    return EmergencyContact(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
      relationship: json['relationship'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phoneNumber': phoneNumber,
      'relationship': relationship,
    };
  }
}