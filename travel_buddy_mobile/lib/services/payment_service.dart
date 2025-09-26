import 'package:flutter/material.dart';
import 'package:flutter_paypal_payment/flutter_paypal_payment.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/user.dart';
import '../constants/app_constants.dart';
import '../config/environment.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  // PayPal configuration from environment
  static String get _paypalClientId => Environment.paypalClientId;
  static String get _paypalSecret => Environment.paypalSecret;
  static bool get _isProduction => Environment.isProduction;
  
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  Future<bool> processPayment({
    required double amount,
    required String planName,
    required SubscriptionTier tier,
    required BuildContext context,
    bool isFreeTrial = true,
  }) async {
    try {
      final currentUser = await _authService.getCurrentUser();
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      // Handle free trial - no payment required
      if (isFreeTrial) {
        final hasUsedTrial = await _checkTrialUsage(currentUser.mongoId!);
        if (hasUsedTrial) {
          throw Exception('Free trial already used');
        }
        await _createSubscription(currentUser.mongoId!, tier, isFreeTrial: true);
        return true;
      }
      
      // Process PayPal payment
      final paymentResult = await _processPayPalPayment(
        context: context,
        amount: amount,
        planName: planName,
        tier: tier,
      );
      
      if (paymentResult['success'] == true) {
        await _createSubscription(
          currentUser.mongoId!,
          tier,
          paymentId: paymentResult['paymentId'],
        );
        return true;
      }
      
      throw Exception('Payment failed');
    } catch (e) {
      throw Exception('Payment processing failed: $e');
    }
  }

  Future<Map<String, dynamic>> _processPayPalPayment({
    required BuildContext context,
    required double amount,
    required String planName,
    required SubscriptionTier tier,
  }) async {
    try {
      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PaypalCheckoutView(
            sandboxMode: !_isProduction,
            clientId: _paypalClientId,
            secretKey: _paypalSecret,
            transactions: [_buildPayPalTransaction(amount, planName)],
            note: "Travel Buddy $planName subscription",
            onSuccess: (params) => Navigator.pop(context, {'success': true, 'data': params}),
            onError: (error) => Navigator.pop(context, {'success': false, 'error': error}),
            onCancel: () => Navigator.pop(context, {'success': false, 'cancelled': true}),
          ),
        ),
      );
      
      if (result != null && result['success'] == true) {
        final paymentId = result['data']?['paymentId'] ?? 'unknown';
        await _verifyPayment(paymentId, amount);
        return {'success': true, 'paymentId': paymentId};
      }
      
      return {'success': false};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Map<String, dynamic> _buildPayPalTransaction(double amount, String planName) {
    return {
      "amount": {
        "total": amount.toStringAsFixed(2),
        "currency": "USD",
        "details": {
          "subtotal": amount.toStringAsFixed(2),
          "tax": "0",
          "shipping": "0",
        }
      },
      "description": "Travel Buddy $planName Subscription",
      "item_list": {
        "items": [{
          "name": "$planName Plan",
          "quantity": 1,
          "price": amount.toStringAsFixed(2),
          "currency": "USD"
        }]
      }
    };
  }

  Future<bool> _checkTrialUsage(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/users/$userId/trial-history'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['hasUsedTrial'] == true;
      }
      return false;
    } catch (e) {
      print('❌ Error checking trial usage: $e');
      return false; // Allow trial on error
    }
  }

  Future<bool> checkTrialUsage(String userId) async {
    return await _checkTrialUsage(userId);
  }

  Future<void> _createSubscription(String userId, SubscriptionTier tier, {
    bool isFreeTrial = false,
    String? paymentId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/subscriptions'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': userId,
          'tier': tier.name,
          'status': isFreeTrial ? 'trial' : 'active',
          'paymentId': paymentId,
          'startDate': DateTime.now().toIso8601String(),
          'endDate': isFreeTrial 
              ? DateTime.now().add(const Duration(days: 7)).toIso8601String()
              : DateTime.now().add(const Duration(days: 30)).toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode != 201) {
        throw Exception('Backend subscription creation failed: ${response.statusCode}');
      }
      
      // Store subscription locally
      await _storageService.saveSubscription({
        'tier': tier.name,
        'status': isFreeTrial ? 'trial' : 'active',
        'startDate': DateTime.now().toIso8601String(),
        'endDate': isFreeTrial 
            ? DateTime.now().add(const Duration(days: 7)).toIso8601String()
            : DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      });
      
    } catch (e) {
      throw Exception('Subscription creation failed: $e');
    }
  }

  Future<void> _verifyPayment(String paymentId, double amount) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/payments/verify'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'paymentId': paymentId,
          'expectedAmount': amount,
          'provider': 'paypal',
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode != 200) {
        throw Exception('Payment verification failed');
      }
    } catch (e) {
      throw Exception('Payment verification error: $e');
    }
  }
  
  Future<String?> _getCurrentUserId() async {
    try {
      final user = await _authService.getCurrentUser();
      return user?.mongoId ?? user?.uid;
    } catch (e) {
      print('❌ Error getting current user ID: $e');
      return null;
    }
  }

  // Free trial is now handled by AppProvider.updateSubscription()
  


  // PayPal payment methods (would use actual PayPal SDK)
  Future<Map<String, dynamic>> _createPayPalPayment({
    required double amount,
    required String currency,
    required String description,
  }) async {
    // This would create a PayPal payment using their API
    return {
      'id': 'PAYID-${DateTime.now().millisecondsSinceEpoch}',
      'state': 'created',
      'amount': amount,
      'currency': currency,
    };
  }

  Future<bool> _executePayPalPayment(String paymentId, String payerId) async {
    // This would execute the PayPal payment
    await Future.delayed(const Duration(seconds: 1));
    return true;
  }

  // Subscription management
  Future<bool> cancelSubscription() async {
    try {
      final userId = await _getCurrentUserId();
      if (userId == null) throw Exception('User not authenticated');
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/subscriptions/$userId/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'cancelAtPeriodEnd': true,
          'reason': 'user_requested',
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        await _storageService.updateSubscriptionStatus('cancelled');
        return true;
      }
      
      throw Exception('Cancellation failed: ${response.statusCode}');
    } catch (e) {
      throw Exception('Failed to cancel subscription: $e');
    }
  }
  


  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    try {
      final userId = await _getCurrentUserId();
      if (userId == null) return {'active': false, 'tier': 'free'};
      
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/subscriptions/$userId'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Cache locally
        await _storageService.saveSubscription(data);
        
        return {
          'active': data['status'] == 'active' || data['status'] == 'trial',
          'tier': data['tier'] ?? 'free',
          'status': data['status'] ?? 'none',
          'endDate': data['endDate'] != null ? DateTime.parse(data['endDate']) : null,
          'autoRenew': data['autoRenew'] ?? false,
        };
      }
      
      // Fallback to local cache
      final cached = await _storageService.getSubscription();
      return cached ?? {'active': false, 'tier': 'free'};
    } catch (e) {
      print('❌ Error fetching subscription: $e');
      final cached = await _storageService.getSubscription();
      return cached ?? {'active': false, 'tier': 'free'};
    }
  }

  // Payment history
  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    try {
      final userId = await _getCurrentUserId();
      if (userId == null) return [];
      
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/payments/$userId/history'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final payments = data['payments'] as List? ?? [];
        
        return payments.map((payment) => {
          'id': payment['id'],
          'date': DateTime.parse(payment['createdAt']),
          'amount': (payment['amount'] as num).toDouble(),
          'plan': payment['planName'],
          'status': payment['status'],
          'paymentMethod': payment['provider'] ?? 'PayPal',
        }).toList();
      }
      
      return [];
    } catch (e) {
      print('❌ Error fetching payment history: $e');
      return [];
    }
  }
}

// PayPal Payment Widget (would use actual PayPal SDK)
class PayPalPaymentWidget extends StatefulWidget {
  final double amount;
  final String description;
  final Function(bool success) onPaymentResult;

  const PayPalPaymentWidget({
    super.key,
    required this.amount,
    required this.description,
    required this.onPaymentResult,
  });

  @override
  State<PayPalPaymentWidget> createState() => _PayPalPaymentWidgetState();
}

class _PayPalPaymentWidgetState extends State<PayPalPaymentWidget> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'PayPal Payment',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Text(
            'Amount: \$${widget.amount.toStringAsFixed(2)}',
            style: const TextStyle(fontSize: 18),
          ),
          const SizedBox(height: 8),
          Text(
            widget.description,
            style: const TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : _processPayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0070BA), // PayPal blue
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _isProcessing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.payment, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          'Pay with PayPal',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => widget.onPaymentResult(false),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _processPayment() async {
    setState(() => _isProcessing = true);
    
    try {
      // Simulate PayPal payment process
      await Future.delayed(const Duration(seconds: 3));
      
      // Simulate success (90% success rate)
      final success = DateTime.now().millisecond % 10 != 0;
      widget.onPaymentResult(success);
    } catch (e) {
      widget.onPaymentResult(false);
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }
}