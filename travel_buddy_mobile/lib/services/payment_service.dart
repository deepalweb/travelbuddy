import 'package:flutter/material.dart';
import 'package:flutter_paypal_payment/flutter_paypal_payment.dart';
import '../models/user.dart';

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
      
      // Real PayPal payment processing for paid subscriptions
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
        await _updateUserSubscription(tier);
        return true;
      } else {
        throw Exception('Payment was not completed');
      }
    } catch (e) {
      throw Exception('Payment processing failed: $e');
    }
  }

  Future<void> _updateUserSubscription(SubscriptionTier tier) async {
    // Update subscription in app provider
    // Note: In production, you'd also update your backend here
    print('✅ Subscription updated to: ${tier.toString().split('.').last}');
  }

  Future<void> _startFreeTrial(SubscriptionTier tier) async {
    // Start 7-day free trial
    final trialEndDate = DateTime.now().add(const Duration(days: 7));
    
    // In production, you would:
    // 1. Create trial subscription in your backend
    // 2. Set up automatic billing after trial ends
    // 3. Send confirmation email to user
    
    print('✅ Started 7-day free trial for ${tier.toString().split('.').last}');
    print('📅 Trial ends: ${trialEndDate.toString()}');
    
    await _updateUserSubscription(tier);
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
      await Future.delayed(const Duration(seconds: 1)); // Simulate API call
      
      // Update user to free tier
      await _updateUserSubscription(SubscriptionTier.free);
      return true;
    } catch (e) {
      throw Exception('Failed to cancel subscription: $e');
    }
  }

  Future<Map<String, dynamic>> getSubscriptionStatus() async {
    // This would fetch subscription status from backend
    return {
      'active': true,
      'tier': 'premium',
      'nextBilling': DateTime.now().add(const Duration(days: 30)),
      'autoRenew': true,
    };
  }

  // Payment history
  Future<List<Map<String, dynamic>>> getPaymentHistory() async {
    // Mock payment history
    return [
      {
        'id': 'PAY001',
        'date': DateTime.now().subtract(const Duration(days: 30)),
        'amount': 9.99,
        'plan': 'Premium',
        'status': 'completed',
      },
      {
        'id': 'PAY002',
        'date': DateTime.now().subtract(const Duration(days: 60)),
        'amount': 9.99,
        'plan': 'Premium',
        'status': 'completed',
      },
    ];
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