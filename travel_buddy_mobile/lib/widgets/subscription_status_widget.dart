import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/user.dart';
import '../screens/subscription_plans_screen.dart';

class SubscriptionStatusWidget extends StatelessWidget {
  const SubscriptionStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final user = appProvider.currentUser;
        if (user == null) return const SizedBox.shrink();

        // Show trial expiry warning
        if (user.subscriptionStatus == SubscriptionStatus.trial) {
          final trialEnd = DateTime.tryParse(user.trialEndDate ?? '');
          if (trialEnd != null) {
            final daysLeft = trialEnd.difference(DateTime.now()).inDays;
            
            if (daysLeft <= 2) {
              return Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  border: Border.all(color: Colors.orange),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange[700]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Trial expires in $daysLeft days',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.orange[700],
                            ),
                          ),
                          const Text('Upgrade to continue premium features'),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const SubscriptionPlansScreen(),
                        ),
                      ),
                      child: const Text('Upgrade'),
                    ),
                  ],
                ),
              );
            }
          }
        }

        // Show expired trial
        if (appProvider.isTrialExpired) {
          return Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red[50],
              border: Border.all(color: Colors.red),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.error, color: Colors.red[700]),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trial Expired',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text('Upgrade to continue using premium features'),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SubscriptionPlansScreen(),
                    ),
                  ),
                  child: const Text('Upgrade Now'),
                ),
              ],
            ),
          );
        }

        return const SizedBox.shrink();
      },
    );
  }
}