import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter/services.dart';
import '../models/safety_info.dart';
import '../models/safety_enums.dart';
import 'api_service.dart';
import 'storage_service.dart';

class SafetyService {
  static final SafetyService _instance = SafetyService._internal();
  factory SafetyService() => _instance;
  SafetyService._internal();

  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  // Enhanced SOS settings
  SOSAction _sosAction = SOSAction.both;
  List<AlertChannel> _alertChannels = [AlertChannel.sms, AlertChannel.push];
  bool _silentModeEnabled = false;
  String _customGesture = 'volume_down_down_up';
  String _safeWord = '';
  
  // Safety timer
  SafetyTimer? _activeTimer;
  
  // Medical info
  MedicalInfo? _medicalInfo;

  Future<SafetyInfo?> getSafetyInfo(double latitude, double longitude) async {
    try {
      // Try Azure OpenAI-powered emergency numbers first
      final response = await _apiService.getAzureEmergencyNumbers(latitude, longitude);
      if (response != null) {
        return SafetyInfo(
          country: response['country'] ?? 'Unknown',
          city: 'Current Location',
          emergencyNumber: response['police'] ?? '112',
          policeNumber: response['police'] ?? '112',
          ambulanceNumber: response['ambulance'] ?? '112', 
          fireNumber: response['fire'] ?? '112',
          emergencyServices: [],
          emergencyContacts: [],
        );
      }

      // Fallback to location-based emergency numbers
      final country = await _getCountryFromCoordinates(latitude, longitude);
      return _getEmergencyNumbersByCountry(country, latitude, longitude);
    } catch (e) {
      print('Error getting safety info: $e');
      return _getDefaultSafetyInfo(latitude, longitude);
    }
  }

  Future<Map<String, dynamic>?> generateSafetyContent({
    required double latitude,
    required double longitude,
    required String location,
  }) async {
    try {
      return await _apiService.generateSafetyContent(
        latitude: latitude,
        longitude: longitude,
        location: location,
      );
    } catch (e) {
      print('Error generating safety content: $e');
      return null;
    }
  }
  
  Future<Map<String, dynamic>?> getReverseGeocode(double latitude, double longitude) async {
    return await _apiService.getReverseGeocode(latitude, longitude);
  }

  Future<List<EmergencyService>> getNearbyEmergencyServices({
    required double latitude,
    required double longitude,
    int radius = 5000,
  }) async {
    try {
      return await _apiService.getNearbyEmergencyServices(
        latitude: latitude,
        longitude: longitude,
        radius: radius,
      );
    } catch (e) {
      print('Error getting emergency services: $e');
      return [];
    }
  }

  // 🚨 1. Enhanced Panic Button (One-tap SOS)
  Future<bool> triggerPanicButton({
    required Position location,
    EmergencyType type = EmergencyType.general,
    String? customMessage,
  }) async {
    try {
      // Haptic feedback
      HapticFeedback.heavyImpact();
      
      final contacts = await getEmergencyContacts();
      if (contacts.isEmpty) return false;
      
      // Execute based on SOS action setting
      switch (_sosAction) {
        case SOSAction.callPolice:
          await _callEmergencyWithFallback();
          break;
        case SOSAction.sendAlertOnly:
          await _sendMultiChannelAlert(location, contacts, type, customMessage);
          break;
        case SOSAction.both:
          await Future.wait([
            _callEmergencyWithFallback(),
            _sendMultiChannelAlert(location, contacts, type, customMessage),
          ]);
          break;
      }
      
      return true;
    } catch (e) {
      print('Panic button error: $e');
      return false;
    }
  }
  
  Future<void> callEmergency(String phoneNumber) async {
    final uri = Uri.parse('tel:$phoneNumber');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  // Smart fallback calling
  Future<void> _callEmergencyWithFallback() async {
    final safetyInfo = await _getOfflineSafetyInfo();
    final numbers = [
      safetyInfo.emergencyNumber,
      ...safetyInfo.alternativeNumbers,
      '112', // International fallback
    ];
    
    for (final number in numbers) {
      if (number.isNotEmpty) {
        await callEmergency(number);
        return;
      }
    }
  }
  
  // Multi-channel alert system
  Future<void> _sendMultiChannelAlert(
    Position location,
    List<EmergencyContact> contacts,
    EmergencyType type,
    String? customMessage,
  ) async {
    final message = customMessage ?? _buildEmergencyMessage(location, type);
    
    for (final channel in _alertChannels) {
      try {
        switch (channel) {
          case AlertChannel.sms:
            await _sendSMSToContacts(contacts, message);
            break;
          case AlertChannel.whatsapp:
            await _sendWhatsAppAlert(contacts, message);
            break;
          case AlertChannel.email:
            await _sendEmailAlert(contacts, message);
            break;
          case AlertChannel.push:
            // Push notification to contacts' apps (if they have the app)
            break;
        }
      } catch (e) {
        print('Failed to send via $channel: $e');
        continue; // Try next channel
      }
    }
  }
  
  String _buildEmergencyMessage(Position location, EmergencyType type) {
    final typeText = type.name.toUpperCase();
    final locationUrl = 'https://maps.google.com/?q=${location.latitude},${location.longitude}';
    
    String message = '🚨 EMERGENCY ALERT - $typeText\n';
    message += 'I need help! My location: $locationUrl\n';
    message += 'Time: ${DateTime.now().toString()}\n';
    
    // Add medical info if enabled
    if (_medicalInfo?.shareInEmergency == true) {
      message += '\nMedical Info:\n';
      if (_medicalInfo!.bloodType.isNotEmpty) {
        message += 'Blood Type: ${_medicalInfo!.bloodType}\n';
      }
      if (_medicalInfo!.allergies.isNotEmpty) {
        message += 'Allergies: ${_medicalInfo!.allergies.join(", ")}\n';
      }
    }
    
    return message;
  }

  Future<void> sendEmergencyAlert({
    required Position location,
    required List<EmergencyContact> contacts,
    String? message,
  }) async {
    final defaultMessage = message ?? 
        'EMERGENCY: I need help! My location: https://maps.google.com/?q=${location.latitude},${location.longitude}';
    
    for (final contact in contacts.where((c) => c.isActive)) {
      await _sendSMS(contact.phone, defaultMessage);
    }
  }

  Future<void> shareLocation(Position location) async {
    final locationUrl = 'https://maps.google.com/?q=${location.latitude},${location.longitude}';
    await Share.share(
      'My current location: $locationUrl',
      subject: 'Location Share',
    );
  }

  Future<void> _sendSMS(String phoneNumber, String message) async {
    final uri = Uri.parse('sms:$phoneNumber?body=${Uri.encodeComponent(message)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<String> _getCountryFromCoordinates(double latitude, double longitude) async {
    try {
      // Use Google Geocoding API for real country detection
      final response = await _apiService.getReverseGeocode(latitude, longitude);
      if (response != null && response['results'] != null) {
        final results = response['results'] as List<dynamic>;
        if (results.isNotEmpty) {
          final components = results[0]['address_components'] as List<dynamic>;
          for (final component in components) {
            final types = component['types'] as List<dynamic>;
            if (types.contains('country')) {
              print('✅ Detected country: ${component['short_name']}');
              return component['short_name'];
            }
          }
        }
      }
    } catch (e) {
      print('Geocoding failed, using coordinate fallback: $e');
    }
    
    // Enhanced coordinate-based detection
    print('🌍 Using coordinate fallback for: $latitude, $longitude');
    
    // Sri Lanka
    if (latitude >= 5.9 && latitude <= 9.9 && longitude >= 79.5 && longitude <= 81.9) {
      print('📍 Detected: Sri Lanka');
      return 'LK';
    }
    // India  
    if (latitude >= 8.0 && latitude <= 37.0 && longitude >= 68.0 && longitude <= 97.0) {
      print('📍 Detected: India');
      return 'IN';
    }
    // USA
    if (latitude >= 24.0 && latitude <= 49.0 && longitude >= -125.0 && longitude <= -66.0) {
      print('📍 Detected: United States');
      return 'US';
    }
    // Canada
    if (latitude >= 49.0 && latitude <= 60.0 && longitude >= -141.0 && longitude <= -52.0) {
      print('📍 Detected: Canada');
      return 'CA';
    }
    // Europe
    if (latitude >= 35.0 && latitude <= 71.0 && longitude >= -10.0 && longitude <= 40.0) {
      print('📍 Detected: Europe');
      return 'EU';
    }
    
    print('⚠️ Unknown location, using international numbers');
    return 'INTERNATIONAL';
  }

  SafetyInfo _getEmergencyNumbersByCountry(String country, double latitude, double longitude) {
    switch (country) {
      case 'LK': // Sri Lanka
        return SafetyInfo(
          country: 'Sri Lanka',
          city: 'Current Location',
          emergencyNumber: '119',
          policeNumber: '119',
          ambulanceNumber: '110',
          fireNumber: '111',
          emergencyServices: [],
          emergencyContacts: [],
        );
      case 'IN': // India
        return SafetyInfo(
          country: 'India',
          city: 'Current Location',
          emergencyNumber: '112',
          policeNumber: '100',
          ambulanceNumber: '108',
          fireNumber: '101',
          emergencyServices: [],
          emergencyContacts: [],
        );
      case 'US': // United States
        return SafetyInfo(
          country: 'United States',
          city: 'Current Location',
          emergencyNumber: '911',
          policeNumber: '911',
          ambulanceNumber: '911',
          fireNumber: '911',
          emergencyServices: [],
          emergencyContacts: [],
        );
      case 'CA': // Canada
        return SafetyInfo(
          country: 'Canada',
          city: 'Current Location',
          emergencyNumber: '911',
          policeNumber: '911',
          ambulanceNumber: '911',
          fireNumber: '911',
          emergencyServices: [],
          emergencyContacts: [],
        );
      case 'EU': // Europe
        return SafetyInfo(
          country: 'Europe',
          city: 'Current Location',
          emergencyNumber: '112',
          policeNumber: '112',
          ambulanceNumber: '112',
          fireNumber: '112',
          emergencyServices: [],
          emergencyContacts: [],
        );
      case 'INTERNATIONAL':
        return SafetyInfo(
          country: 'International',
          city: 'Current Location',
          emergencyNumber: '112',
          policeNumber: '112', 
          ambulanceNumber: '112',
          fireNumber: '112',
          emergencyServices: [],
          emergencyContacts: [],
        );
      default:
        return _getDefaultSafetyInfo(latitude, longitude);
    }
  }

  SafetyInfo _getDefaultSafetyInfo(double latitude, double longitude) {
    return SafetyInfo(
      country: 'Unknown',
      city: 'Current Location',
      emergencyNumber: '112', // International emergency number
      policeNumber: '112',
      ambulanceNumber: '112',
      fireNumber: '112',
      emergencyServices: [],
      emergencyContacts: [],
    );
  }

  // Emergency contacts management
  Future<List<EmergencyContact>> getEmergencyContacts() async {
    return await _storageService.getEmergencyContacts();
  }

  Future<void> addEmergencyContact(EmergencyContact contact) async {
    await _storageService.addEmergencyContact(contact);
  }

  Future<void> removeEmergencyContact(String contactId) async {
    await _storageService.removeEmergencyContact(contactId);
  }
  
  // 🤫 2. Silent Mode SOS
  Future<bool> triggerSilentSOS(Position location) async {
    if (!_silentModeEnabled) return false;
    
    try {
      // Tiny haptic feedback only
      HapticFeedback.selectionClick();
      
      final contacts = await getEmergencyContacts();
      if (contacts.isEmpty) return false;
      
      // Send silent alert without any UI indication
      await _sendSilentAlert(location, contacts);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  Future<void> _sendSilentAlert(Position location, List<EmergencyContact> contacts) async {
    final message = '🔇 SILENT EMERGENCY ALERT\n' +
        'Discreet help needed. Location: https://maps.google.com/?q=${location.latitude},${location.longitude}\n' +
        'Time: ${DateTime.now().toString()}';
    
    await _sendSMSToContacts(contacts, message);
  }
  
  bool checkCustomGesture(List<String> sequence) {
    final expectedSequence = _customGesture.split('_');
    return sequence.join('_') == _customGesture;
  }
  
  bool checkSafeWord(String word) {
    return _safeWord.isNotEmpty && word.toLowerCase() == _safeWord.toLowerCase();
  }
  
  // ☕ 3. Enhanced Emergency Numbers with Smart Fallback
  Future<SafetyInfo> _getOfflineSafetyInfo() async {
    // Try to get cached offline data first
    final cachedInfo = await _storageService.getOfflineSafetyInfo();
    if (cachedInfo != null) return cachedInfo;
    
    // Fallback to basic info
    final country = await _getCountryFromCoordinates(0, 0);
    return _getEmergencyNumbersByCountry(country, 0, 0);
  }
  
  // 🏥 4. Enhanced Nearby Services with Filtering
  Future<List<EmergencyService>> getFilteredEmergencyServices({
    required double latitude,
    required double longitude,
    bool only24Hours = false,
    bool onlyEnglishStaff = false,
    bool onlyVerifiedSafe = false,
    double minRating = 0.0,
  }) async {
    final services = await getNearbyEmergencyServices(
      latitude: latitude,
      longitude: longitude,
    );
    
    return services.where((service) {
      if (only24Hours && !service.is24Hours) return false;
      if (onlyEnglishStaff && !service.hasEnglishStaff) return false;
      if (onlyVerifiedSafe && !service.isVerifiedSafe) return false;
      if (service.rating < minRating) return false;
      return true;
    }).toList();
  }
  
  Future<void> openInMaps(double latitude, double longitude) async {
    final uri = Uri.parse('https://maps.google.com/?q=$latitude,$longitude');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }
  
  // ⏰ Safety Timer Feature
  Future<void> startSafetyTimer({
    required Duration duration,
    required String description,
    required List<String> notifyContacts,
  }) async {
    _activeTimer = SafetyTimer(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      startTime: DateTime.now(),
      duration: duration,
      description: description,
      notifyContacts: notifyContacts,
    );
    
    await _storageService.saveActiveTimer(_activeTimer!);
    
    // Schedule check-in reminder
    _scheduleTimerCheck();
  }
  
  Future<void> checkIn() async {
    if (_activeTimer != null) {
      await _storageService.clearActiveTimer();
      _activeTimer = null;
    }
  }
  
  void _scheduleTimerCheck() {
    // In a real implementation, use background tasks or local notifications
    // For now, this is a placeholder for the timer logic
  }
  
  // 🩺 Medical Info Management
  Future<void> saveMedicalInfo(MedicalInfo info) async {
    _medicalInfo = info;
    await _storageService.saveMedicalInfo(info);
  }
  
  Future<MedicalInfo?> getMedicalInfo() async {
    _medicalInfo ??= await _storageService.getMedicalInfo();
    return _medicalInfo;
  }
  
  // Settings Management
  Future<void> updateSOSSettings({
    SOSAction? action,
    List<AlertChannel>? channels,
    bool? silentMode,
    String? customGesture,
    String? safeWord,
  }) async {
    if (action != null) _sosAction = action;
    if (channels != null) _alertChannels = channels;
    if (silentMode != null) _silentModeEnabled = silentMode;
    if (customGesture != null) _customGesture = customGesture;
    if (safeWord != null) _safeWord = safeWord;
    
    await _storageService.saveSOSSettings({
      'action': _sosAction.name,
      'channels': _alertChannels.map((c) => c.name).toList(),
      'silentMode': _silentModeEnabled,
      'customGesture': _customGesture,
      'safeWord': _safeWord,
    });
  }
  
  // Helper methods for multi-channel alerts
  Future<void> _sendSMSToContacts(List<EmergencyContact> contacts, String message) async {
    for (final contact in contacts.where((c) => c.isActive)) {
      await _sendSMS(contact.phone, message);
    }
  }
  
  Future<void> _sendWhatsAppAlert(List<EmergencyContact> contacts, String message) async {
    for (final contact in contacts.where((c) => c.isActive)) {
      final uri = Uri.parse('whatsapp://send?phone=${contact.phone}&text=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
        break; // Only send to first available contact via WhatsApp
      }
    }
  }
  
  Future<void> _sendEmailAlert(List<EmergencyContact> contacts, String message) async {
    final emailAddresses = contacts.where((c) => c.isActive && c.phone.contains('@')).map((c) => c.phone).join(',');
    if (emailAddresses.isNotEmpty) {
      final uri = Uri.parse('mailto:$emailAddresses?subject=EMERGENCY ALERT&body=${Uri.encodeComponent(message)}');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }
}