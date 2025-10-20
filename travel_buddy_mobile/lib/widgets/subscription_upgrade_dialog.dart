import 'package:flutter/material.dart';

class SubscriptionUpgradeDialog extends StatelessWidget {
  final String currentTier;
  final int usedCalls;
  final int limitCalls;

  const SubscriptionUpgradeDialog({
    Key? key,
    required this.currentTier,
    required this.usedCalls,
    required this.limitCalls,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('🚀 Upgrade Your Plan'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('You\'ve used $usedCalls/$limitCalls daily API calls.'),
          const SizedBox(height: 16),
          const Text('Upgrade for more searches:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          _buildTierOption('Basic', '50 calls/day', '\$2.99/month'),
          _buildTierOption('Premium', '200 calls/day', '\$9.99/month'),
          _buildTierOption('Pro', '500 calls/day', '\$19.99/month'),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Later'),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            _showUpgradeOptions(context);
          },
          child: const Text('Upgrade Now'),
        ),
      ],
    );
  }

  Widget _buildTierOption(String name, String calls, String price) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text('$name: $calls'),
          Text(price, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showUpgradeOptions(BuildContext context) {
    // TODO: Navigate to subscription/payment screen
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Redirecting to upgrade options...')),
    );
  }

  static void showIfNeeded(BuildContext context, Map<String, dynamic> stats) {
    final percentage = stats['percentage'] as int;
    if (percentage >= 90) {
      showDialog(
        context: context,
        builder: (context) => SubscriptionUpgradeDialog(
          currentTier: stats['tier'],
          usedCalls: stats['used'],
          limitCalls: stats['limit'],
        ),
      );
    }
  }
}