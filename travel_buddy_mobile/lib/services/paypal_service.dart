import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class PayPalService {
  static final PayPalService _instance = PayPalService._internal();
  factory PayPalService() => _instance;
  PayPalService._internal();

  static const String _sandboxUrl = 'https://api.sandbox.paypal.com';
  static const String _productionUrl = 'https://api.paypal.com';
  
  String get _baseUrl => Environment.isProduction ? _productionUrl : _sandboxUrl;
  
  // Get access token from PayPal
  Future<String?> getAccessToken() async {
    try {
      print('🔑 Getting PayPal access token...');
      print('🌐 Base URL: $_baseUrl');
      print('📋 Client ID: ${Environment.paypalClientId.substring(0, 10)}...');
      
      final credentials = base64Encode(
        utf8.encode('${Environment.paypalClientId}:${Environment.paypalSecret}')
      );
      
      final response = await http.post(
        Uri.parse('$_baseUrl/v1/oauth2/token'),
        headers: {
          'Authorization': 'Basic $credentials',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      );
      
      print('📊 Token response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Access token obtained');
        return data['access_token'];
      }
      
      print('❌ PayPal token error: ${response.statusCode}');
      print('📝 Response body: ${response.body}');
      return null;
    } catch (e) {
      print('❌ PayPal token exception: $e');
      return null;
    }
  }
  
  // Create payment
  Future<Map<String, dynamic>?> createPayment({
    required double amount,
    required String description,
    required String returnUrl,
    required String cancelUrl,
  }) async {
    try {
      final token = await getAccessToken();
      if (token == null) return null;
      
      final paymentData = {
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "transactions": [{
          "amount": {
            "total": amount.toStringAsFixed(2),
            "currency": "USD"
          },
          "description": description
        }],
        "redirect_urls": {
          "return_url": returnUrl,
          "cancel_url": cancelUrl
        }
      };
      
      final response = await http.post(
        Uri.parse('$_baseUrl/v1/payments/payment'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode(paymentData),
      );
      
      if (response.statusCode == 201) {
        return json.decode(response.body);
      }
      
      print('❌ PayPal payment creation error: ${response.statusCode} - ${response.body}');
      return null;
    } catch (e) {
      print('❌ PayPal payment creation exception: $e');
      return null;
    }
  }
  
  // Execute payment
  Future<Map<String, dynamic>?> executePayment({
    required String paymentId,
    required String payerId,
  }) async {
    try {
      final token = await getAccessToken();
      if (token == null) return null;
      
      final response = await http.post(
        Uri.parse('$_baseUrl/v1/payments/payment/$paymentId/execute'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({"payer_id": payerId}),
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      
      print('❌ PayPal payment execution error: ${response.statusCode} - ${response.body}');
      return null;
    } catch (e) {
      print('❌ PayPal payment execution exception: $e');
      return null;
    }
  }
}