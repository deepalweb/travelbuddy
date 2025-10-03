import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/subscription.dart';
import '../services/subscription_service.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  bool _isAnnual = false;
  final SubscriptionService _subscriptionService = SubscriptionService();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Subscription Plans'),
            backgroundColor: Color(AppConstants.colors['primary']!),
            foregroundColor: Colors.white,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Color(AppConstants.colors['primary']!),
                        Color(AppConstants.colors['primary']!).withOpacity(0.8),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.workspace_premium, size: 48, color: Colors.white),
                      const SizedBox(height: 12),
                      const Text(
                        'Unlock Premium Features',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Get AI trip planning, unlimited favorites, and more!',
                        style: TextStyle(color: Colors.white70),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Billing Toggle
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isAnnual = false),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: !_isAnnual ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: !_isAnnual ? [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ] : null,
                            ),
                            child: Text(
                              'Monthly',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontWeight: !_isAnnual ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _isAnnual = true),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: _isAnnual ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: _isAnnual ? [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ] : null,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Annual',
                                  style: TextStyle(
                                    fontWeight: _isAnnual ? FontWeight.bold : FontWeight.normal,
                                  ),
                                ),
                                if (_isAnnual) ...[
                                  const SizedBox(width: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: Colors.green,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'Save 17%',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Plans Grid
                ...SubscriptionService.plans.map((plan) => _buildPlanCard(plan, appProvider)),
                
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
                
                // Features Comparison
                _buildFeaturesComparison(),
                
                const SizedBox(height: 24),
                
                // Cancel Subscription Section
                _buildCancelSubscriptionSection(appProvider),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCancelSubscriptionSection(AppProvider appProvider) {
    final currentTier = appProvider.currentUser?.tier ?? SubscriptionTier.free;
    
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
                onPressed: () => _showCancelDialog(appProvider),
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

  void _showCancelDialog(AppProvider appProvider) {
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
            onPressed: () => _cancelSubscription(appProvider),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelSubscription(AppProvider appProvider) async {
    Navigator.pop(context);
    
    try {
      final paymentService = PaymentService();
      final success = await paymentService.cancelSubscription();
      if (success) {
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
    }
  }

  Widget _buildPlanCard(SubscriptionPlan plan, AppProvider appProvider) {
    final isCurrentPlan = appProvider.currentUser?.tier == plan.tier;
    final price = _isAnnual && plan.annualPrice != null ? plan.annualPrice! : plan.monthlyPrice;
    final suffix = _isAnnual ? '/year' : '/month';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        border: Border.all(
          color: plan.isRecommended 
              ? Color(AppConstants.colors['primary']!) 
              : Colors.grey[300]!,
          width: plan.isRecommended ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(16),
        color: isCurrentPlan ? Colors.blue[50] : Colors.white,
      ),
      child: Stack(
        children: [
          if (plan.isRecommended)
            Positioned(
              top: 0,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Color(AppConstants.colors['primary']!),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  ),
                ),
                child: const Text(
                  'RECOMMENDED',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          if (plan.badge != null)
            Positioned(
              top: 0,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: const BoxDecoration(
                  color: Colors.amber,
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(8),
                    bottomRight: Radius.circular(8),
                  ),
                ),
                child: Text(
                  plan.badge!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                Text(
                  plan.name,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '\$${price.toStringAsFixed(price == price.toInt() ? 0 : 2)}',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      suffix,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                ...plan.features.map((feature) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: Color(AppConstants.colors['primary']!),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(feature),
                      ),
                    ],
                  ),
                )),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isCurrentPlan ? null : () => _handlePlanSelection(plan, appProvider),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCurrentPlan 
                          ? Colors.grey 
                          : Color(AppConstants.colors['primary']!),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      isCurrentPlan 
                          ? 'Current Plan' 
                          : plan.tier == SubscriptionTier.free 
                              ? 'Downgrade' 
                              : 'Start Free Trial',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesComparison() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Feature Comparison',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildFeatureRow('Basic place discovery', [true, true, true, true]),
            _buildFeatureRow('AI trip planning', [false, false, true, true]),
            _buildFeatureRow('Premium deals', [false, true, true, true]),
            _buildFeatureRow('Favorites', [false, true, true, true]),
            _buildFeatureRow('Community posts', [false, true, true, true]),
            _buildFeatureRow('Priority support', [false, false, false, true]),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(String feature, List<bool> availability) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(feature, style: const TextStyle(fontSize: 14)),
          ),
          ...availability.map((available) => Expanded(
            child: Icon(
              available ? Icons.check : Icons.close,
              color: available ? Colors.green : Colors.red,
              size: 20,
            ),
          )),
        ],
      ),
    );
  }

  void _handlePlanSelection(SubscriptionPlan plan, AppProvider appProvider) async {
    if (appProvider.currentUser == null) return;

    try {
      if (plan.tier == SubscriptionTier.free) {
        // Cancel subscription - downgrade to free
        final success = await appProvider.updateSubscription(SubscriptionTier.free, isFreeTrial: false);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Downgraded to free plan')),
          );
        }
      } else {
        // Start trial for paid tier
        final success = await appProvider.updateSubscription(plan.tier, isFreeTrial: true);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Started ${plan.name} 7-day free trial!')),
          );
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
}