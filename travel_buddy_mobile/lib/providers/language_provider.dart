import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/language_models.dart';
import '../services/translation_service.dart';
import '../services/localization_service.dart';

class LanguageProvider extends ChangeNotifier {
  String _currentLanguage = 'en';
  String? _suggestedLanguage;
  bool _showLocationSuggestion = false;
  final TranslationService _translationService = TranslationService();
  final LocalizationService _localizationService = LocalizationService();

  String get currentLanguage => _currentLanguage;
  String? get suggestedLanguage => _suggestedLanguage;
  bool get showLocationSuggestion => _showLocationSuggestion;
  bool get isRTL => _currentLanguage == 'ar';

  SupportedLanguage get currentLanguageInfo {
    return supportedLanguages.firstWhere(
      (lang) => lang.code == _currentLanguage,
      orElse: () => supportedLanguages.first,
    );
  }

  String tr(String key) => _localizationService.translate(key, _currentLanguage);

  Future<void> initialize() async {
    await _loadSavedLanguage();
    await _translationService.initializeTTS();
    await _translationService.initializeSpeech();
  }

  Future<void> _loadSavedLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    _currentLanguage = prefs.getString('selected_language') ?? 'en';
    notifyListeners();
  }

  Future<void> changeLanguage(String languageCode) async {
    if (supportedLanguages.any((lang) => lang.code == languageCode)) {
      _currentLanguage = languageCode;
      _showLocationSuggestion = false;
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('selected_language', languageCode);
      
      notifyListeners();
    }
  }

  Future<void> checkLocationLanguage(double latitude, double longitude) async {
    try {
      final locationInfo = await _translationService.getLocationLanguageInfo(
        latitude,
        longitude,
      );

      if (locationInfo != null && 
          locationInfo.primaryLanguage != _currentLanguage &&
          supportedLanguages.any((lang) => lang.code == locationInfo.primaryLanguage)) {
        _suggestedLanguage = locationInfo.primaryLanguage;
        _showLocationSuggestion = true;
        notifyListeners();
      }
    } catch (e) {
      print('Location language check error: $e');
    }
  }

  void dismissLocationSuggestion() {
    _showLocationSuggestion = false;
    notifyListeners();
  }

  Future<void> acceptLocationSuggestion() async {
    if (_suggestedLanguage != null) {
      await changeLanguage(_suggestedLanguage!);
    }
  }

  // Translation methods
  Future<String> translate(String text, String targetLanguage) {
    return _translationService.translateText(
      text: text,
      targetLanguage: targetLanguage,
      sourceLanguage: _currentLanguage,
    );
  }

  Future<List<TravelPhrase>> getTravelPhrases(String language, [String? category]) {
    return _translationService.getTravelPhrases(language, category);
  }

  Future<void> speak(String text, String language) {
    return _translationService.speak(text, language);
  }

  Future<String?> listen(String language) {
    return _translationService.listen(language);
  }
}