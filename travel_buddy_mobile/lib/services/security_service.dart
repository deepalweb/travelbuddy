import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class SecurityService {
  static final SecurityService _instance = SecurityService._internal();
  factory SecurityService() => _instance;
  SecurityService._internal();

  final _storage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  // Encrypt and store sensitive data
  Future<void> storeSecure(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  Future<String?> getSecure(String key) async {
    return await _storage.read(key: key);
  }

  Future<void> deleteSecure(String key) async {
    await _storage.delete(key: key);
  }

  // Store user credentials securely
  Future<void> storeUserToken(String token) async {
    await storeSecure('user_token', token);
  }

  Future<String?> getUserToken() async {
    return await getSecure('user_token');
  }

  // Store API keys securely
  Future<void> storeApiKey(String keyName, String value) async {
    await storeSecure('api_key_$keyName', value);
  }

  Future<String?> getApiKey(String keyName) async {
    return await getSecure('api_key_$keyName');
  }

  // Encrypt sensitive user data
  Future<void> storeEncryptedUserData(Map<String, dynamic> userData) async {
    final jsonString = jsonEncode(userData);
    await storeSecure('encrypted_user_data', jsonString);
  }

  Future<Map<String, dynamic>?> getEncryptedUserData() async {
    final jsonString = await getSecure('encrypted_user_data');
    if (jsonString == null) return null;
    return jsonDecode(jsonString);
  }

  // Clear all secure data (logout)
  Future<void> clearAllSecureData() async {
    await _storage.deleteAll();
  }
}
