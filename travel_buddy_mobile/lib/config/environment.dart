import 'package:http/http.dart' as http;
import 'dart:convert';

class Environment {
  static const String backendUrl = String.fromEnvironment(
    'TRAVELBUDDY_API_URL',
    defaultValue: 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net',
  );
  static const String baseUrl = backendUrl;
  static const bool isProduction = bool.fromEnvironment(
    'TRAVELBUDDY_PRODUCTION',
    defaultValue: true,
  );
  static const bool enableDebugLogging = bool.fromEnvironment(
    'TRAVELBUDDY_DEBUG_LOGGING',
    defaultValue: false,
  );
  
  // API keys loaded from backend
  static String? _googleMapsApiKey;
  static String? _azureMapsApiKey;
  
  // Get API keys from Azure backend
  static Future<void> loadApiKeys() async {
    try {
      final response = await http.get(Uri.parse('$backendUrl/api/config/keys'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _googleMapsApiKey = data['googleMapsApiKey'];
        _azureMapsApiKey = data['azureMapsApiKey'];
      }
    } catch (e) {
      print('❌ Failed to load API keys from backend: $e');
    }
  }
  
  static String get googleMapsApiKey => _googleMapsApiKey ?? '';
  static String get azureMapsApiKey => _azureMapsApiKey ?? '';
  
  // PayPal configuration
  static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID';
  static const String paypalSecret = 'YOUR_SANDBOX_SECRET';
  static const String paypalEnvironment = 'sandbox';
  
  // Cost Optimization Settings
  static const int cacheExpiryHours = 24; // Cache popular places
  static const int maxGoogleCallsPerDay = 1000; // Budget limit
  static const int maxAzureCallsPerDay = 5000; // Higher limit for cheaper API
  
  // Feature flags
  static const bool enablePayments = true;
  static const bool enableTrials = true;
  static const bool enableAnalytics = true;
  static const bool enableAIPlanner = true;
}
