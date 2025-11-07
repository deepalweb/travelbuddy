import 'dart:async';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../models/enhanced_safety_models.dart';
import '../models/safety_info.dart';
import 'api_service.dart';
import 'storage_service.dart';
import 'azure_openai_service.dart';

class EnhancedSafetyService {
  static final EnhancedSafetyService _instance = EnhancedSafetyService._internal();
  factory EnhancedSafetyService() => _instance;
  EnhancedSafetyService._internal();

  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  final AzureOpenAIService _aiService = AzureOpenAIService();
  
  // Silent SOS detection
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;
  List<double> _shakeSequence = [];
  Timer? _shakeTimer;
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
      // Get current location for caching
      final position = await Geolocator.getCurrentPosition();
      
      // Cache emergency numbers
      final emergencyNumbers = await getSmartEmergencyDirectory(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      // Cache nearby services
      final nearbyServices = await getNearbyServicesWithFilters(
        latitude: position.latitude,
        longitude: position.longitude,
      );
      
      // Cache emergency phrases
      final phrases = await getEmergencyPhrases();
      
      // Cache safety alerts
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
      
      await _storageService.saveOfflineSafetyData(_offlineData!);
    } catch (e) {
      print('Cache offline data error: $e');
    }
  }

  // 🕵️ 6. Silent SOS (Discreet Mode)
  void enableSilentSOS() {
    _silentSOSEnabled = true;
    _startShakeDetection();
  }

  void disableSilentSOS() {
    _silentSOSEnabled = false;
    _accelerometerSubscription?.cancel();
  }

  void _startShakeDetection() {
    _accelerometerSubscription = accelerometerEvents.listen((event) {
      final magnitude = (event.x * event.x + event.y * event.y + event.z * event.z);
      
      if (magnitude > 30) { // Shake threshold
        _shakeSequence.add(magnitude);
        
        _shakeTimer?.cancel();
        _shakeTimer = Timer(const Duration(seconds: 2), () {
          if (_shakeSequence.length >= 3) {
            _triggerSilentSOS();
          }
          _shakeSequence.clear();
        });
      }
    });
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
    return await _storageService.getTrustedContacts();
  }

  Future<void> addTrustedContact(TrustedContact contact) async {
    await _storageService.addTrustedContact(contact);
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
    
    await _storageService.saveLiveLocationSession(_activeLiveSession!);
    
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
    if (_activeLiveSession != null) {
      await _storageService.clearLiveLocationSession();
      _activeLiveSession = null;
    }
  }

  // 🌐 8. Safety Feed & Alerts
  Future<List<SafetyAlert>> getSafetyAlerts({
    double? latitude,
    double? longitude,
  }) async {
    try {
      final response = await _apiService.getSafetyAlerts(
        latitude: latitude,
        longitude: longitude,
      );
      
      final alerts = (response as List? ?? [])
          .map((alert) => SafetyAlert.fromJson(alert))
          .toList();
      
      _alertsController.add(alerts);
      return alerts;
    } catch (e) {
      print('Safety alerts error: $e');
      return [];
    }
  }

  // 🗣️ 9. Translation & Emergency Phrases
  Future<List<EmergencyPhrase>> getEmergencyPhrases({String? countryCode}) async {
    try {
      final response = await _apiService.getEmergencyPhrases(countryCode: countryCode);
      return (response as List? ?? [])
          .map((phrase) => EmergencyPhrase.fromJson(phrase))
          .toList();
    } catch (e) {
      print('Emergency phrases error: $e');
      return _getDefaultPhrases();
    }
  }

  Future<String?> translateEmergencyPhrase(String phrase, String targetLanguage) async {
    try {
      return await _apiService.translateText(phrase, targetLanguage);
    } catch (e) {
      print('Translation error: $e');
      return null;
    }
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
    await _storageService.queueOfflineSMS(contacts, message);
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

  // Cleanup
  void dispose() {
    _accelerometerSubscription?.cancel();
    _locationSubscription?.cancel();
    _shakeTimer?.cancel();
    _alertsController.close();
  }
}