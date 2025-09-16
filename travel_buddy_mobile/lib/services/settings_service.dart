import 'package:shared_preferences/shared_preferences.dart';

class SettingsService {
  static const String _darkModeKey = 'dark_mode';
  static const String _notificationsKey = 'notifications_enabled';
  static const String _dealAlertsKey = 'deal_alerts_enabled';
  static const String _searchRadiusKey = 'search_radius';
  static const String _languageKey = 'language';

  static SharedPreferences? _prefs;

  static Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static bool get isDarkMode => _prefs?.getBool(_darkModeKey) ?? false;
  static bool get notificationsEnabled => _prefs?.getBool(_notificationsKey) ?? true;
  static bool get dealAlertsEnabled => _prefs?.getBool(_dealAlertsKey) ?? true;
  static int get searchRadius => _prefs?.getInt(_searchRadiusKey) ?? 20000;
  static String get language => _prefs?.getString(_languageKey) ?? 'en';

  static Future<void> setDarkMode(bool value) async {
    await _prefs?.setBool(_darkModeKey, value);
  }

  static Future<void> setNotifications(bool value) async {
    await _prefs?.setBool(_notificationsKey, value);
  }

  static Future<void> setDealAlerts(bool value) async {
    await _prefs?.setBool(_dealAlertsKey, value);
  }

  static Future<void> setSearchRadius(int value) async {
    await _prefs?.setInt(_searchRadiusKey, value);
  }

  static Future<void> setLanguage(String value) async {
    await _prefs?.setString(_languageKey, value);
  }

  static Future<void> clearAll() async {
    await _prefs?.clear();
  }
}