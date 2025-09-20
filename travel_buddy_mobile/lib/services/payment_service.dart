import 'package:flutter/material.dart';
import 'package:flutter_paypal_payment/flutter_paypal_payment.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/user.dart';
import '../constants/app_constants.dart';

class PaymentService {
  static final PaymentService _instance = PaymentService._internal();
  factory PaymentService() => _instance;
  PaymentService._internal();

  // PayPal configuration - YOUR REAL CREDENTIALS
  static const String _paypalClientId = 'AQq4yCVTWy1j8WkcQ_c1Jr0bRdKuQcNGvkj2Q4zeMg5ti53lu5axuoG938MUL6SMIPf54koY8wzcU7LW';
  static const String _paypalSecret = 'EPFfn37B81cgi41YbswVOIC05mPW3JQLiY-MbQ48-GU2neJBvw9m1Mr05SUBuzC2eTVH79Q1fRv4P8gG';
  static const bool _isProduction = false; // Set to true for production

  Future<bool> processPayment({
    required double amount,
    required String planName,
    required SubscriptionTier tier,
    required BuildContext context,
    bool isFreeTrial = true,
  }) async {
    try {
      // Handle free trial - no payment required
      if (isFreeTrial) {
        await _startFreeTrial(tier);
        return true;
      }
      
      // Real PayPal payment processing for immediate paid subscriptions
      print('💳 Processing immediate payment for ${tier.name} - \$${amount.toStringAsFixed(2)}');
      final result = await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (BuildContext context) => PaypalCheckoutView(
            sandboxMode: !_isProduction,
            clientId: _paypalClientId,
            secretKey: _paypalSecret,
            transactions: [
              {
                "amount": {
                  "total": amount.toStringAsFixed(2),
                  "currency": "USD",
                  "details": {
                    "subtotal": amount.toStringAsFixed(2),
                    "tax": "0",
                    "shipping": "0",
                    "handling_fee": "0",
                    "shipping_discount": "0",
                    "insurance": "0"
                  }
                },
                "description": "Travel Buddy $planName Subscription",
                "item_list": {
                  "items": [
                    {
                      "name": "$planName Plan",
                      "quantity": 1,
                      "price": amount.toStringAsFixed(2),
                      "currency": "USD"
                    }
                  ],
                }
              }
            ],
            note: "Travel Buddy subscription payment",
            onSuccess: (Map params) async {
              print("PayPal payment successful: $params");
            },
            onError: (error) {
              print("PayPal payment error: $error");
            },
            onCancel: () {
              print('PayPal payment cancelled');
            },
          ),
        ),
      );
      
      if (result != null && result['status'] == 'success') {
        await _updateUserSubscription(tier, isFreeTrial: false);
        print('✅ Immediate subscription activated for ${tier.name}');
        return true;
      } else {
        throw Exception('Payment was not completed');
      }
    } catch (e) {
      throw Exception('Payment processing failed: $e');
    }
  }

  Future<void> _updateUserSubscription(SubscriptionTier tier, {bool isFreeTrial = false}) async {
    try {
      // Update backend subscription
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/subscriptions/update'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _getCurrentUserId(),
          'tier': tier.name,
          'status': isFreeTrial ? 'trial' : 'active',
          'trialEndDate': isFreeTrial ? DateTime.now().add(const Duration(days: 7)).toIso8601String() : null,
          'subscriptionEndDate': !isFreeTrial ? DateTime.now().add(const Duration(days: 30)).toIso8601String() : null,
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        print('✅ Backend subscription updated to: ${tier.toString().split('.').last}');
      } else {
        print('⚠️ Backend subscription update failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error updating backend subscription: $e');
    }
  }
  
  String? _getCurrentUserId() {
    // Get current user ID from auth service
    try {
      // You would integrate with your actual auth service here
      // For now, we'll use a method to get the current user
      return _getCurrentUserFromStorage();
    } catch (e) {
      print('❌ Error getting current user ID: $e');
      return null;
    }
  }
  
  String? _getCurrentUserFromStorage() {
    // This would get the user from your storage service
    // Implementation depends on your auth architecture
    // For now, return a placeholder that would be replaced with real user ID
    return 'mobile_user_${DateTime.now().millisecondsSinceEpoch}';
  }

  Future<void> _startFreeTrial(SubscriptionTier tier) async {
    try {
      final trialEndDate = DateTime.now().add(const Duration(days: 7));
      
      // Create trial subscription in backend
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/subscriptions/trial'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _getCurrentUserId(),
          'tier': tier.name,
          'trialEndDate': trialEndDate.toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        print('✅ Started 7-day free trial for ${tier.toString().split('.').last}');
        print('📅 Trial ends: ${trialEndDate.toString()}');
        
        // Send confirmation email via backend
        await _sendTrialConfirmationEmail(tier, trialEndDate);
      } else {
        throw Exception('Failed to create trial subscription');
      }
      
      await _updateUserSubscription(tier, isFreeTrial: true);
    } catch (e) {
      print('❌ Error starting free trial: $e');
      throw Exception('Failed to start free trial: $e');
    }
  }
  
  Future<void> _sendTrialConfirmationEmail(SubscriptionTier tier, DateTime trialEndDate) async {
    try {
      await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/notifications/trial-confirmation'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _getCurrentUserId(),
          'tier': tier.name,
          'trialEndDate': trialEndDate.toIso8601String(),
        }),
      ).timeout(const Duration(seconds: 5));
    } catch (e) {
      print('⚠️ Failed to send trial confirmation email: $e');
    }
  }

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
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/subscriptions/cancel'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _getCurrentUserId(),
          'cancelAtPeriodEnd': true, // Don't cancel immediately, wait for period end
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        print('✅ Subscription cancellation scheduled');
        
        // Send cancellation confirmation email
        await _sendCancellationConfirmationEmail();
        return true;
      } else {
        throw Exception('Backend cancellation failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to cancel subscription: $e');
    }
  }
  
  Future<void> _sendCancellationConfirmationEmail() async {
    try {
      await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/notifications/cancellation-confirmation'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userId': _getCurrentUserId(),
        }),
      ).timeout(const Duration(seconds: 5));
    } catch (e) {
      print('⚠️ Failed to send cancellation confirmation email: $e');
    }
  }

  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/subscriptions/status/${_getCurrentUserId()}'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'active': data['active'] ?? false,
          'tier': data['tier'] ?? 'free',
          'status': data['status'] ?? 'none',
          'nextBilling': data['nextBilling'] != null ? DateTime.parse(data['nextBilling']) : null,
          'trialEndDate': data['trialEndDate'] != null ? DateTime.parse(data['trialEndDate']) : null,
          'autoRenew': data['autoRenew'] ?? false,
          'cancelAtPeriodEnd': data['cancelAtPeriodEnd'] ?? false,
        };
      } else {
        print('⚠️ Failed to fetch subscription status: ${response.statusCode}');
        return {'active': false, 'tier': 'free', 'status': 'none'};
      }
    } catch (e) {
      print('❌ Error fetching subscription status: $e');
      return {'active': false, 'tier': 'free', 'status': 'none'};
    }
  }

  // Payment history
  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/payments/history/${_getCurrentUserId()}'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        return data.map((payment) => {
          'id': payment['id'],
          'date': DateTime.parse(payment['date']),
          'amount': payment['amount'].toDouble(),
          'plan': payment['plan'],
          'status': payment['status'],
          'paymentMethod': payment['paymentMethod'] ?? 'PayPal',
        }).toList();
      } else {
        print('⚠️ Failed to fetch payment history: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Error fetching payment history: $e');
      return []; // Return empty list on error
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