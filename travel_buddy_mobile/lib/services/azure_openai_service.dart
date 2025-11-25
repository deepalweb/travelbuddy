import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trip.dart';
import '../config/environment.dart';

class AzureOpenAIService {
  static Future<String> generateRichIntroduction(TripPlan tripPlan) async {
    try {
      final url = '${Environment.backendUrl}/api/ai/enhance-trip-overview';
      print('✨ Calling AI enhance API: $url');
      print('📤 Request data: ${tripPlan.destination}, ${tripPlan.duration}');
      
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'destination': tripPlan.destination,
          'duration': tripPlan.duration,
          'introduction': tripPlan.introduction,
          'tripTitle': tripPlan.tripTitle,
        }),
      ).timeout(const Duration(seconds: 15));

      print('📥 Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final enhanced = data['enhancedOverview'];
        print('✅ Enhanced overview received: ${enhanced?.substring(0, 50)}...');
        return enhanced ?? tripPlan.introduction;
      } else {
        print('⚠️ API returned status ${response.statusCode}: ${response.body}');
        return tripPlan.introduction;
      }
    } catch (e) {
      print('❌ Enhanced introduction error: $e');
      return tripPlan.introduction;
    }
  }

  static Future<String> generateContent(String prompt) async {
    return 'AI-generated content based on the provided prompt: $prompt';
  }
}