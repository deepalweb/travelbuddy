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

        final tier = user.tier;
        final status = user.subscriptionStatus;
        final maxFavorites = appProvider.maxFavorites;
        final currentFavorites = appProvider.favoriteIds.length;
        
        // Get tier colors and info
        final tierInfo = _getTierInfo(tier);
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: tierInfo['gradient'] as List<Color>,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  tierInfo['icon'] as IconData,
                  color: Colors.white,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${tierInfo['name']} Plan',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      maxFavorites == -1 
                          ? 'Unlimited favorites'
                          : '$currentFavorites/$maxFavorites favorites used',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (tier == SubscriptionTier.free)
                ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SubscriptionPlansScreen(),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: tierInfo['gradient'][0],
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  child: const Text('Upgrade'),
                ),
            ],
          ),
        );
      },
    );
  }
  
  Map<String, dynamic> _getTierInfo(SubscriptionTier tier) {
    switch (tier) {
      case SubscriptionTier.free:
        return {
          'name': 'Free',
          'icon': Icons.person,
          'gradient': [Colors.grey[400]!, Colors.grey[600]!],
        };
      case SubscriptionTier.basic:
        return {
          'name': 'Basic',
          'icon': Icons.star,
          'gradient': [Colors.blue[400]!, Colors.blue[600]!],
        };
      case SubscriptionTier.premium:
        return {
          'name': 'Premium',
          'icon': Icons.diamond,
          'gradient': [Colors.purple[400]!, Colors.purple[600]!],
        };
      case SubscriptionTier.pro:
        return {
          'name': 'Pro',
          'icon': Icons.workspace_premium,
          'gradient': [Colors.amber[400]!, Colors.amber[600]!],
        };
    }
  }
}