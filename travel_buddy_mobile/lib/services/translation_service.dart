import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_tts/flutter_tts.dart';
// import 'package:speech_to_text/speech_to_text.dart'; // Removed for compatibility
import '../models/language_models.dart';
import '../config/environment.dart';

class TranslationService {
  static final TranslationService _instance = TranslationService._internal();
  factory TranslationService() => _instance;
  TranslationService._internal();

  final FlutterTts _tts = FlutterTts();
  // final SpeechToText _stt = SpeechToText(); // Removed for compatibility
  final Map<String, String> _translationCache = {};
  final Map<String, List<TravelPhrase>> _phraseCache = {};

  // Initialize TTS
  Future<void> initializeTTS() async {
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.5); // Slower speed for better comprehension
    await _tts.setPitch(1.0);
  }

  // Initialize Speech Recognition
  Future<bool> initializeSpeech() async {
    return false; // Speech recognition disabled for compatibility
  }

  // Translate text using Azure OpenAI
  Future<String> translateText({
    required String text,
    required String targetLanguage,
    String sourceLanguage = 'en',
  }) async {
    final cacheKey = '${text}_${targetLanguage}';
    
    if (_translationCache.containsKey(cacheKey)) {
      return _translationCache[cacheKey]!;
    }

    try {
      final response = await http.post(
        Uri.parse('${Environment.baseUrl}/api/ai/translate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'text': text,
          'targetLanguage': targetLanguage,
          'sourceLanguage': sourceLanguage,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final translation = data['translation'];
        _translationCache[cacheKey] = translation;
        return translation;
      }
    } catch (e) {
      print('Translation error: $e');
    }
    
    return text; // Return original if translation fails
  }

  // Get travel phrases
  Future<List<TravelPhrase>> getTravelPhrases(
    String language, [
    String? category,
  ]) async {
    final cacheKey = '${language}_${category ?? 'all'}';
    
    if (_phraseCache.containsKey(cacheKey)) {
      return _phraseCache[cacheKey]!;
    }

    try {
      final uri = Uri.parse('${Environment.baseUrl}/api/ai/travel-phrases/$language')
          .replace(queryParameters: category != null ? {'category': category} : null);
      
      final response = await http.get(uri);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final phrases = (data['phrases'] as List)
            .map((e) => TravelPhrase.fromJson(e))
            .toList();
        
        _phraseCache[cacheKey] = phrases;
        return phrases;
      }
    } catch (e) {
      print('Phrases error: $e');
    }
    
    return _getOfflinePhrases(language, category);
  }

  // Get location language info
  Future<LocationLanguageInfo?> getLocationLanguageInfo(
    double latitude,
    double longitude,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.baseUrl}/api/ai/location-language')
            .replace(queryParameters: {
          'lat': latitude.toString(),
          'lng': longitude.toString(),
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return LocationLanguageInfo.fromJson(data);
      }
    } catch (e) {
      print('Location language error: $e');
    }
    
    return null;
  }

  // Text-to-speech
  Future<void> speak(String text, String language) async {
    await _tts.setLanguage(_getLanguageCode(language));
    await _tts.setSpeechRate(0.5); // Slower for learning
    await _tts.speak(text);
  }

  // Speech-to-text (disabled for compatibility)
  Future<String?> listen(String language) async {
    return null; // Speech recognition disabled
  }

  // Helper methods
  String _getLanguageCode(String code) {
    final Map<String, String> languageCodes = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'hi': 'hi-IN',
      'ru': 'ru-RU',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
      'pt': 'pt-PT',
      'it': 'it-IT',
      'nl': 'nl-NL',
      'tr': 'tr-TR',
    };
    return languageCodes[code] ?? 'en-US';
  }

  List<TravelPhrase> _getOfflinePhrases(String language, String? category) {
    // Offline emergency phrases
    final Map<String, List<TravelPhrase>> offlinePhrases = {
      'fr': [
        TravelPhrase(
          id: 'help_fr',
          category: 'emergency',
          english: 'Help!',
          translation: 'Au secours!',
          pronunciation: 'oh suh-KOOR',
        ),
        TravelPhrase(
          id: 'police_fr',
          category: 'emergency',
          english: 'I need police',
          translation: 'J\'ai besoin de la police',
          pronunciation: 'zhay buh-ZWAN duh lah po-LEES',
        ),
      ],
    };
    
    return offlinePhrases[language] ?? [];
  }
}