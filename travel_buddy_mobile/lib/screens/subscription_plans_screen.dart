import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/app_provider.dart';
import '../models/user.dart';
import '../services/payment_service.dart';
import '../config/environment.dart';

class SubscriptionPlansScreen extends StatefulWidget {
  const SubscriptionPlansScreen({super.key});

  @override
  State<SubscriptionPlansScreen> createState() => _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState extends State<SubscriptionPlansScreen> {
  final PaymentService _paymentService = PaymentService();
  bool _isLoading = false;

  final List<Map<String, dynamic>> _plans = [
    {
      'tier': SubscriptionTier.basic,
      'name': 'Globetrotter',
      'price': 9.99,
      'period': 'month',
      'popular': true,
      'features': [
        'Unlimited trips',
        '20 AI trips/month',
        'Community posting',
        'Advanced filters',
        'Basic offline mode',
        'Booking support',
      ],
      'color': Colors.blue,
    },
    {
      'tier': SubscriptionTier.premium,
      'name': 'WanderPro+',
      'price': 19.99,
      'period': 'month',
      'features': [
        'Unlimited AI trips',
        'Live AI assistant',
        'PDF export',
        'Smart packing list',
        'Full offline mode',
        'Early deals access',
      ],
      'color': Colors.purple,
    },
    {
      'tier': SubscriptionTier.pro,
      'name': 'TravelAgent Pro',
      'price': 49.99,
      'period': 'month',
      'features': [
        'Agent dashboard',
        'Transport dashboard',
        'Add services',
        'Booking requests',
        'Route planner',
        'Customer chat',
        'Analytics',
      ],
      'color': Colors.orange,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Subscription Plans'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          final currentTier = appProvider.currentUser?.tier ?? SubscriptionTier.free;
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildCurrentPlanCard(currentTier),
                const SizedBox(height: 24),
                const Text(
                  'Choose Your Plan',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Unlock premium features and enhance your travel experience',
                  style: TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ..._plans.map((plan) => _buildPlanCard(plan, currentTier)),
                const SizedBox(height: 16),
                
                // Refund Policy
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green[200]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.verified_user, color: Colors.green[600]),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Cancel anytime. Full refund within 7 days.',
                          style: TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                _buildFreePlanCard(currentTier),
                
                const SizedBox(height: 24),
                _buildCancelSubscriptionSection(currentTier),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCancelSubscriptionSection(SubscriptionTier currentTier) {
    if (currentTier == SubscriptionTier.free) {
      return const SizedBox.shrink();
    }

    return Card(
      color: Colors.red[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: Colors.red[600]),
                const SizedBox(width: 8),
                const Text(
                  'Subscription Management',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Text(
              '✅ Cancel anytime. Full refund within 7 days.',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _isLoading ? null : _showCancelDialog,
                style: OutlinedButton.styleFrom(
                  side: BorderSide(color: Colors.red[600]!),
                  foregroundColor: Colors.red[600],
                ),
                child: const Text('Cancel Subscription'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Subscription'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to cancel your subscription?'),
            SizedBox(height: 12),
            Text(
              '• You\'ll lose access to premium features\n• Full refund available within 7 days\n• You can resubscribe anytime',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep Subscription'),
          ),
          ElevatedButton(
            onPressed: _cancelSubscription,
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelSubscription() async {
    Navigator.pop(context);
    setState(() => _isLoading = true);
    
    try {
      final success = await _paymentService.cancelSubscription();
      if (success) {
        final appProvider = context.read<AppProvider>();
        await appProvider.updateSubscription(SubscriptionTier.free, isFreeTrial: false);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Subscription cancelled. You\'ll receive a refund confirmation email.'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cancellation failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildCurrentPlanCard(SubscriptionTier currentTier) {
    return Card(
      color: Colors.green[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green[600]),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Current Plan',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    currentTier.toString().split('.').last.toUpperCase(),
                    style: TextStyle(
                      color: Colors.green[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(Map<String, dynamic> plan, SubscriptionTier currentTier) {
    final isCurrentPlan = plan['tier'] == currentTier;
    final isPopular = plan['popular'] == true;
    
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: Stack(
        children: [
          Card(
            elevation: isPopular ? 8 : 2,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: isPopular ? Border.all(color: plan['color'], width: 2) : null,
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          plan['name'],
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: plan['color'],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '\$${plan['price']}',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'per ${plan['period']}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.green[100],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            '7 Days FREE Trial',
                            style: TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.blue[100],
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'or Upgrade Now',
                            style: TextStyle(
                              color: Colors.blue,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ...plan['features'].map<Widget>((feature) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.check, color: Colors.green, size: 20),
                          const SizedBox(width: 8),
                          Expanded(child: Text(feature)),
                        ],
                      ),
                    )),
                    const SizedBox(height: 20),
                    if (isCurrentPlan)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Current Plan',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey,
                          ),
                        ),
                      )
                    else ...[
                      // Free Trial Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : () => _subscribeToPlan(plan, isFreeTrial: true),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: plan['color'],
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text(
                                  'Start 7-Day Free Trial',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      // Upgrade Now Button
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: _isLoading ? null : () => _subscribeToPlan(plan, isFreeTrial: false),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: plan['color'], width: 2),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Text(
                            'Upgrade Now - \$${plan['price']}/month',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: plan['color'],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          if (isPopular)
            Positioned(
              top: 0,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: plan['color'],
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  ),
                ),
                child: const Text(
                  'POPULAR',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFreePlanCard(SubscriptionTier currentTier) {
    final isCurrentPlan = currentTier == SubscriptionTier.free;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Free',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '\$0',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.check, color: Colors.green, size: 20),
                SizedBox(width: 8),
                Text('1 trip/month'),
              ],
            ),
            const SizedBox(height: 4),
            const Row(
              children: [
                Icon(Icons.check, color: Colors.green, size: 20),
                SizedBox(width: 8),
                Text('Basic discovery (10 results)'),
              ],
            ),
            const SizedBox(height: 4),
            const Row(
              children: [
                Icon(Icons.check, color: Colors.green, size: 20),
                SizedBox(width: 8),
                Text('View-only community'),
              ],
            ),
            const SizedBox(height: 4),
            const Row(
              children: [
                Icon(Icons.check, color: Colors.green, size: 20),
                SizedBox(width: 8),
                Text('5 place searches/day'),
              ],
            ),
            const SizedBox(height: 20),
            if (isCurrentPlan)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Current Plan',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _subscribeToPlan(Map<String, dynamic> plan, {required bool isFreeTrial}) async {
    setState(() => _isLoading = true);
    
    try {
      final appProvider = context.read<AppProvider>();
      
      // For free trial, check if user has used it before
      if (isFreeTrial) {
        final hasUsedTrial = await _hasUserUsedFreeTrial(appProvider);
        if (hasUsedTrial) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You have already used your free trial. Please choose "Upgrade Now" for immediate access.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 4),
            ),
          );
          return;
        }
      }
      
      final success = await _paymentService.processPayment(
        amount: plan['price'].toDouble(),
        planName: plan['name'],
        tier: plan['tier'],
        context: context,
        isFreeTrial: isFreeTrial,
      );
      
      if (success && mounted) {
        await appProvider.updateSubscription(plan['tier'], isFreeTrial: isFreeTrial);
        
        final message = isFreeTrial 
            ? 'Started 7-day free trial for ${plan['name']} plan!'
            : 'Successfully upgraded to ${plan['name']} plan!';
            
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isFreeTrial ? 'Free trial setup failed: $e' : 'Payment failed: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<bool> _hasUserUsedFreeTrial(AppProvider appProvider) async {
    try {
      final user = appProvider.currentUser;
      if (user?.mongoId == null) return false;
      
      // Check backend for trial history
      return await _paymentService.checkTrialUsage(user!.mongoId!);
    } catch (e) {
      print('❌ Error checking trial status: $e');
      return false; // Allow trial on error
    }
  }
  
  Future<bool> checkTrialUsage(String userId) async {
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
      return false;
    }
  }
}