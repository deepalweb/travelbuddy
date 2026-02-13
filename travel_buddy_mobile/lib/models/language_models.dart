class SupportedLanguage {
  final String code;
  final String name;
  final String flag;

  const SupportedLanguage({
    required this.code,
    required this.name,
    required this.flag,
  });
}

class TravelPhrase {
  final String id;
  final String category;
  final String english;
  final String translation;
  final String? pronunciation;

  const TravelPhrase({
    required this.id,
    required this.category,
    required this.english,
    required this.translation,
    this.pronunciation,
  });

  factory TravelPhrase.fromJson(Map<String, dynamic> json) {
    return TravelPhrase(
      id: json['id'],
      category: json['category'],
      english: json['english'],
      translation: json['translation'],
      pronunciation: json['pronunciation'],
    );
  }
}

class LocationLanguageInfo {
  final String countryCode;
  final String primaryLanguage;
  final List<String> commonLanguages;
  final List<TravelPhrase> emergencyPhrases;

  const LocationLanguageInfo({
    required this.countryCode,
    required this.primaryLanguage,
    required this.commonLanguages,
    required this.emergencyPhrases,
  });

  factory LocationLanguageInfo.fromJson(Map<String, dynamic> json) {
    return LocationLanguageInfo(
      countryCode: json['countryCode'],
      primaryLanguage: json['primaryLanguage'],
      commonLanguages: List<String>.from(json['commonLanguages']),
      emergencyPhrases: (json['emergencyPhrases'] as List)
          .map((e) => TravelPhrase.fromJson(e))
          .toList(),
    );
  }
}

// Constants
const List<SupportedLanguage> supportedLanguages = [
  SupportedLanguage(code: 'en', name: 'English', flag: '🇺🇸'),
  SupportedLanguage(code: 'es', name: 'Español', flag: '🇪🇸'),
  SupportedLanguage(code: 'fr', name: 'Français', flag: '🇫🇷'),
  SupportedLanguage(code: 'de', name: 'Deutsch', flag: '🇩🇪'),
  SupportedLanguage(code: 'zh', name: '简体中文', flag: '🇨🇳'),
  SupportedLanguage(code: 'ja', name: '日本語', flag: '🇯🇵'),
  SupportedLanguage(code: 'hi', name: 'हिन्दी', flag: '🇮🇳'),
  SupportedLanguage(code: 'ru', name: 'Русский', flag: '🇷🇺'),
  SupportedLanguage(code: 'ko', name: '한국어', flag: '🇰🇷'),
  SupportedLanguage(code: 'ar', name: 'العربية', flag: '🇸🇦'),
  SupportedLanguage(code: 'pt', name: 'Português', flag: '🇵🇹'),
  SupportedLanguage(code: 'it', name: 'Italiano', flag: '🇮🇹'),
  SupportedLanguage(code: 'nl', name: 'Nederlands', flag: '🇳🇱'),
  SupportedLanguage(code: 'tr', name: 'Türkçe', flag: '🇹🇷'),
];

const List<String> phraseCategories = [
  'emergency',
  'greetings', 
  'directions',
  'food',
  'accommodation',
  'transportation',
  'shopping',
  'numbers',
  'time',
  'basic'
];