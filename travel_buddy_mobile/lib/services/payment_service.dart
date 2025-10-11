import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import '../models/user.dart';
import '../config/environment.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/paypal_service.dart';

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
      final currentUser = await AuthService.getCurrentUser();
      if (currentUser == null) {
        throw Exception('User not authenticated');
      }

      // Handle free trial - no payment required
      if (isFreeTrial) {
        final hasUsedTrial = await _checkTrialUsage(currentUser.uid);
        if (hasUsedTrial) {
          throw Exception('Free trial already used');
        }
        await _createSubscription(currentUser.uid, tier, isFreeTrial: true);
        return true;
      }
      
      // TEMPORARY: Skip PayPal for testing
      print('⚠️ TESTING MODE: Skipping PayPal payment');
      final paymentResult = {'success': true, 'paymentId': 'test_${DateTime.now().millisecondsSinceEpoch}'};
      
      // TODO: Uncomment when PayPal is working
      // final paymentResult = await _processPayPalPayment(
      //   context: context,
      //   amount: amount,
      //   planName: planName,
      //   tier: tier,
      // );
      
      if (paymentResult['success'] == true) {
        await _createSubscription(
          currentUser.uid,
          tier,
          paymentId: paymentResult['paymentId'] as String?,
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
      final paypalService = PayPalService();
      
      // Create PayPal payment
      final payment = await paypalService.createPayment(
        amount: amount,
        description: "Travel Buddy $planName subscription",
        returnUrl: "${Environment.backendUrl}/api/payments/paypal/success",
        cancelUrl: "${Environment.backendUrl}/api/payments/paypal/cancel",
      );
      
      if (payment == null) {
        throw Exception('Failed to create PayPal payment');
      }
      
      // Get approval URL
      final approvalUrl = payment['links']?.firstWhere(
        (link) => link['rel'] == 'approval_url',
        orElse: () => null,
      )?['href'];
      
      if (approvalUrl == null) {
        throw Exception('No approval URL found');
      }
      
      // Launch PayPal approval URL
      final result = await _launchPayPalApproval(context, approvalUrl, payment['id']);
      
      if (result['success'] == true) {
        await _verifyPayment(result['paymentId'], amount);
        return {'success': true, 'paymentId': result['paymentId']};
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
      final user = await AuthService.getCurrentUser();
      return user?.uid;
    } catch (e) {
      print('❌ Error getting current user ID: $e');
      return null;
    }
  }

  // Free trial is now handled by AppProvider.updateSubscription()
  


  // Launch PayPal approval URL and handle response
  Future<Map<String, dynamic>> _launchPayPalApproval(
    BuildContext context, 
    String approvalUrl, 
    String paymentId
  ) async {
    try {
      // Show PayPal approval dialog
      final result = await showDialog<Map<String, dynamic>>(
        context: context,
        builder: (context) => PayPalApprovalDialog(
          approvalUrl: approvalUrl,
          paymentId: paymentId,
        ),
      );
      
      return result ?? {'success': false};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
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

// PayPal Approval Dialog for real PayPal integration
class PayPalApprovalDialog extends StatefulWidget {
  final String approvalUrl;
  final String paymentId;

  const PayPalApprovalDialog({
    super.key,
    required this.approvalUrl,
    required this.paymentId,
  });

  @override
  State<PayPalApprovalDialog> createState() => _PayPalApprovalDialogState();
}

class _PayPalApprovalDialogState extends State<PayPalApprovalDialog> {
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('PayPal Payment'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'You will be redirected to PayPal to complete your payment.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          if (_isProcessing)
            const CircularProgressIndicator()
          else
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _launchPayPal,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0070BA),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.launch, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          'Open PayPal',
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
                  onPressed: () => Navigator.pop(context, {'success': false}),
                  child: const Text('Cancel'),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Future<void> _launchPayPal() async {
    setState(() => _isProcessing = true);
    
    try {
      final uri = Uri.parse(widget.approvalUrl);
      
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
        
        // Show completion dialog
        if (mounted) {
          final completed = await _showCompletionDialog();
          if (completed) {
            // Simulate successful payment for sandbox testing
            Navigator.pop(context, {
              'success': true,
              'paymentId': widget.paymentId,
            });
          } else {
            Navigator.pop(context, {'success': false});
          }
        }
      } else {
        throw Exception('Could not launch PayPal URL');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
        Navigator.pop(context, {'success': false});
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<bool> _showCompletionDialog() async {
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Payment Status'),
        content: const Text(
          'Did you complete the payment on PayPal?\n\n'
          'Note: In sandbox mode, use test credentials:\n'
          'Email: sb-test@personal.example.com\n'
          'Password: testpassword',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelled'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Completed'),
          ),
        ],
      ),
    ) ?? false;
  }
}