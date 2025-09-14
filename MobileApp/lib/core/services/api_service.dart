import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final http.Client _client = http.Client();

  Future<Map<String, dynamic>> get(String endpoint, {Map<String, String>? headers}) async {
    final response = await _client.get(
      Uri.parse('${AppConfig.baseUrl}$endpoint'),
      headers: _buildHeaders(headers),
    ).timeout(const Duration(milliseconds: AppConfig.requestTimeout));

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> post(String endpoint, {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    final response = await _client.post(
      Uri.parse('${AppConfig.baseUrl}$endpoint'),
      headers: _buildHeaders(headers),
      body: body != null ? jsonEncode(body) : null,
    ).timeout(const Duration(milliseconds: AppConfig.requestTimeout));

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> put(String endpoint, {Map<String, dynamic>? body, Map<String, String>? headers}) async {
    final response = await _client.put(
      Uri.parse('${AppConfig.baseUrl}$endpoint'),
      headers: _buildHeaders(headers),
      body: body != null ? jsonEncode(body) : null,
    ).timeout(const Duration(milliseconds: AppConfig.requestTimeout));

    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(String endpoint, {Map<String, String>? headers}) async {
    final response = await _client.delete(
      Uri.parse('${AppConfig.baseUrl}$endpoint'),
      headers: _buildHeaders(headers),
    ).timeout(const Duration(milliseconds: AppConfig.requestTimeout));

    return _handleResponse(response);
  }

  Map<String, String> _buildHeaders(Map<String, String>? customHeaders) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (customHeaders != null) {
      headers.addAll(customHeaders);
    }
    
    return headers;
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: response.body,
      );
    }
  }

  void dispose() {
    _client.close();
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException: $statusCode - $message';
}