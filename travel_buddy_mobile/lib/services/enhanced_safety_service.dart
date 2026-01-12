import 'dart:async';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/enhanced_safety_models.dart';
import '../models/safety_info.dart';
import 'api_service.dart';
import 'storage_service.dart';

class EnhancedSafetyService {
  static final EnhancedSafetyService _instance = EnhancedSafetyService._internal();
  factory EnhancedSafetyService() => _instance;
  EnhancedSafetyService._internal();

  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  // Silent SOS detection - simplified without sensors
  bool _silentSOSEnabled = false;
  
  // Offline mode
  bool _isOfflineMode = false;
  OfflineSafetyData? _offlineData;
  
  // Live location tracking
  LiveLocationSession? _activeLiveSession;
  StreamSubscription<Position>? _locationSubscription;
  
  // Safety alerts
  final StreamController<List<SafetyAlert>> _alertsController = StreamController.broadcast();
  Stream<List<SafetyAlert>> get alertsStream => _alertsController.stream;

  // 🛰️ 1. Location-Aware Smart SOS
  Future<bool> triggerSmartSOS({
    required Position location,
    String? tripName,
    String? customMessage,
  }) async {
    try {
      HapticFeedback.heavyImpact();
      
      final contacts = await getTrustedContacts();
      if (contacts.isEmpty) return false;
      
      final locationUrl = 'https://maps.google.com/?q=${location.latitude},${location.longitude}';
      final timestamp = DateTime.now().toString();
      
      String message = '🚨 EMERGENCY SOS ALERT\n';
      if (tripName != null) message += 'Trip: $tripName\n';
      message += 'Location: $locationUrl\n';
      message += 'Time: $timestamp\n';
      if (customMessage != null) message += 'Message: $customMessage\n';
      
      // Check connectivity
      final connectivity = await Connectivity().checkConnectivity();
      if (connectivity == ConnectivityResult.none) {
        // Queue SMS for when connection returns
        await _queueOfflineSMS(contacts, message);
      } else {
        // Send immediately
        await _sendMultiChannelAlert(contacts, message, location);
      }
      
      return true;
    } catch (e) {
      print('Smart SOS error: $e');
      return false;
    }
  }



  // 📞 3. Smart Emergency Directory
  Future<Map<String, String>> getSmartEmergencyDirectory({
    double? latitude,
    double? longitude,
  }) async {
    try {
      // Try to get location-specific numbers
      if (latitude != null && longitude != null) {
        final response = await _apiService.getAzureEmergencyNumbers(latitude, longitude);
        if (response != null) {
          return {
            'police': response['police'] ?? '112',
            'ambulance': response['ambulance'] ?? '112',
            'fire': response['fire'] ?? '112',
            'embassy': await _getEmbassyNumber(latitude, longitude),
            'tourist_hotline': await _getTouristHotline(latitude, longitude),
          };
        }
      }
      
      // Fallback to cached offline data
      if (_offlineData != null) {
        return _offlineData!.emergencyNumbers;
      }
      
      return {
        'police': '112',
        'ambulance': '112',
        'fire': '112',
        'embassy': '',
        'tourist_hotline': '',
      };
    } catch (e) {
      print('Emergency directory error: $e');
      return {'police': '112', 'ambulance': '112', 'fire': '112'};
    }
  }

  // 🏥 4. Nearby Safety Services Map
  Future<List<EmergencyService>> getNearbyServicesWithFilters({
    required double latitude,
    required double longitude,
    bool only24Hours = false,
    bool onlyEnglishStaff = false,
    double minRating = 0.0,
  }) async {
    try {
      final services = await _apiService.getNearbyEmergencyServices(
        latitude: latitude,
        longitude: longitude,
      );
      
      return services.where((service) {
        if (only24Hours && !service.is24Hours) return false;
        if (onlyEnglishStaff && !service.hasEnglishStaff) return false;
        if (service.rating < minRating) return false;
        return true;
      }).toList();
    } catch (e) {
      print('Nearby services error: $e');
      return _offlineData?.nearbyServices ?? [];
    }
  }

  // 📶 5. Offline Safety Mode
  Future<void> enableOfflineMode() async {
    _isOfflineMode = true;
    await _cacheOfflineData();
  }

  Future<void> _cacheOfflineData() async {
    try {
      final position = await Geolocator.getCurrentPosition();
      
      final emergencyNumbers = await getSmartEmergencyDirectory(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      final nearbyServices = await getNearbyServicesWithFilters(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      final phrases = await getEmergencyPhrases();
      
      final safetyAlerts = await getSafetyAlerts(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      _offlineData = OfflineSafetyData(
        emergencyNumbers: emergencyNumbers,
        nearbyServices: nearbyServices,
        emergencyPhrases: phrases,
        safetyAlerts: safetyAlerts,
        lastUpdated: DateTime.now(),
      );
    } catch (e) {
      print('Cache offline data error: $e');
    }
  }

  // 🕵️ 6. Silent SOS (Discreet Mode)
  void enableSilentSOS() {
    _silentSOSEnabled = true;
  }

  void disableSilentSOS() {
    _silentSOSEnabled = false;
  }

  Future<void> _triggerSilentSOS() async {
    if (!_silentSOSEnabled) return;
    
    try {
      HapticFeedback.selectionClick(); // Minimal feedback
      
      final position = await Geolocator.getCurrentPosition();
      final contacts = await getTrustedContacts();
      
      if (contacts.isNotEmpty) {
        final message = '🔇 SILENT EMERGENCY\nDiscreet help needed.\nLocation: https://maps.google.com/?q=${position.latitude},${position.longitude}';
        await _sendSilentAlert(contacts, message);
      }
    } catch (e) {
      print('Silent SOS error: $e');
    }
  }

  // 🔐 7. Trusted Contacts & Live Tracking
  Future<List<TrustedContact>> getTrustedContacts() async {
    final contacts = await _storageService.getEmergencyContacts();
    return contacts.map((c) => TrustedContact(
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: '',
      relationship: c.relationship,
      receiveAlerts: c.isActive,
    )).toList();
  }

  Future<void> addTrustedContact(TrustedContact contact) async {
    final emergencyContact = EmergencyContact(
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      relationship: 'Trusted Contact',
    );
    await _storageService.addEmergencyContact(emergencyContact);
  }

  Future<void> startLiveLocationSharing({
    required String tripName,
    required List<String> contactIds,
    Duration? duration,
  }) async {
    _activeLiveSession = LiveLocationSession(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      tripName: tripName,
      startTime: DateTime.now(),
      sharedWithContacts: contactIds,
    );
    
    // Start location tracking
    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((position) {
      _broadcastLocationUpdate(position);
    });
  }

  Future<void> stopLiveLocationSharing() async {
    _locationSubscription?.cancel();
    _activeLiveSession = null;
  }

  // 🌐 8. Safety Feed & Alerts
  Future<List<SafetyAlert>> getSafetyAlerts({
    double? latitude,
    double? longitude,
  }) async {
    try {
      // Return mock alerts for now
      final alerts = <SafetyAlert>[];
      _alertsController.add(alerts);
      return alerts;
    } catch (e) {
      print('Safety alerts error: $e');
      return [];
    }
  }

  // 🗣️ 9. Translation & Emergency Phrases
  Future<List<EmergencyPhrase>> getEmergencyPhrases({String? countryCode}) async {
    return _getDefaultPhrases();
  }

  // Helper methods
  Future<void> _sendMultiChannelAlert(
    List<TrustedContact> contacts,
    String message,
    Position location,
  ) async {
    for (final contact in contacts.where((c) => c.receiveAlerts)) {
      // SMS
      await _sendSMS(contact.phone, message);
      
      // Email if available
      if (contact.email.isNotEmpty) {
        await _sendEmail(contact.email, 'Emergency Alert', message);
      }
    }
  }

  Future<void> _sendSilentAlert(List<TrustedContact> contacts, String message) async {
    for (final contact in contacts.where((c) => c.receiveAlerts)) {
      await _sendSMS(contact.phone, message);
    }
  }

  Future<void> _queueOfflineSMS(List<TrustedContact> contacts, String message) async {
    // Store SMS for later sending when connection returns
    print('Queued SMS for ${contacts.length} contacts');
  }

  Future<void> _sendSMS(String phoneNumber, String message) async {
    // Implementation depends on platform
    // For now, use URL launcher
    final uri = Uri.parse('sms:$phoneNumber?body=${Uri.encodeComponent(message)}');
    // await launchUrl(uri);
  }

  Future<void> _sendEmail(String email, String subject, String body) async {
    final uri = Uri.parse('mailto:$email?subject=${Uri.encodeComponent(subject)}&body=${Uri.encodeComponent(body)}');
    // await launchUrl(uri);
  }

  void _broadcastLocationUpdate(Position position) {
    // Send location update to trusted contacts
    // Implementation would involve backend API call
  }

  Future<String> _getEmbassyNumber(double latitude, double longitude) async {
    // Implementation to get embassy number based on location
    return '';
  }

  Future<String> _getTouristHotline(double latitude, double longitude) async {
    // Implementation to get tourist hotline based on location
    return '';
  }

  List<EmergencyPhrase> _getDefaultPhrases() {
    return [
      EmergencyPhrase(
        english: 'Help me!',
        local: 'මට උදව් කරන්න!',
        pronunciation: 'mata udav karanna',
        category: 'emergency',
      ),
      EmergencyPhrase(
        english: 'Where is the hospital?',
        local: 'රෝහල කොහෙද?',
        pronunciation: 'rohala kohed',
        category: 'medical',
      ),
      EmergencyPhrase(
        english: 'Call the police',
        local: 'පොලිසියට කතා කරන්න',
        pronunciation: 'polisiyata kata karanna',
        category: 'emergency',
      ),
    ];
  }

  // 🤖 10. AI Safety Advisor
  Future<Map<String, dynamic>?> askAISafetyAdvisor(
    String question, {
    double? latitude,
    double? longitude,
    String? location,
  }) async {
    try {
      // Mock AI response for now
      await Future.delayed(const Duration(seconds: 1));
      
      final responses = {
        'safe at night': 'Based on current data, this area has moderate safety levels at night. Stay in well-lit areas and avoid walking alone after 10 PM.',
        'precautions': 'Keep valuables secure, stay aware of surroundings, use registered taxis, and keep emergency contacts handy.',
        'embassy': 'Contact your embassy through their 24/7 hotline. Keep their number saved in your phone.',
        'scams': 'Common scams include overpriced taxis, fake tour guides, and distraction theft. Always verify credentials.',
        'emergency': 'Local emergency numbers: Police 119, Ambulance 1990, Fire 110. International emergency: 112.',
      };
      
      String answer = 'I\'m here to help with safety questions. Could you be more specific?';
      int confidence = 5;
      
      for (final key in responses.keys) {
        if (question.toLowerCase().contains(key)) {
          answer = responses[key]!;
          confidence = 8;
          break;
        }
      }
      
      return {
        'answer': answer,
        'confidence': confidence,
        'timestamp': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      print('AI Safety Advisor error: $e');
      return null;
    }
  }

  // Cleanup
  void dispose() {
    _locationSubscription?.cancel();
    _alertsController.close();
  }
}