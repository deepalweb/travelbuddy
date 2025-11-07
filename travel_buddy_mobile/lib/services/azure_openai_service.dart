import 'dart:convert';
import 'package:http/http.dart' as http;

class AzureOpenAIService {
  static const String _endpoint = String.fromEnvironment('AZURE_OPENAI_ENDPOINT', defaultValue: '');
  static const String _deployment = String.fromEnvironment('AZURE_OPENAI_DEPLOYMENT', defaultValue: '');
  static const String _apiVersion = String.fromEnvironment('AZURE_OPENAI_API_VERSION', defaultValue: '2024-02-15-preview');
  
  static Future<String?> generateContent({
    required String prompt,
    int maxTokens = 800,
    double temperature = 0.7,
  }) async {
    if (_endpoint.isEmpty || _deployment.isEmpty) {
      throw Exception('Azure OpenAI configuration missing');
    }
    
    try {
      final response = await http.post(
        Uri.parse('$_endpoint/openai/deployments/$_deployment/chat/completions?api-version=$_apiVersion'),
        headers: {
          'Content-Type': 'application/json',
          'api-key': const String.fromEnvironment('AZURE_OPENAI_API_KEY', defaultValue: ''),
        },
        body: json.encode({
          'messages': [
            {'role': 'user', 'content': prompt}
          ],
          'max_tokens': maxTokens,
          'temperature': temperature,
        }),
      ).timeout(const Duration(seconds: 30));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['choices']?[0]?['message']?['content'];
      }
      return null;
    } catch (e) {
      print('Azure OpenAI error: $e');
      return null;
    }
  }
}