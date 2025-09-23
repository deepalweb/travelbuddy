import 'package:flutter/material.dart';
import '../models/place.dart';
import '../constants/app_constants.dart';
import '../services/currency_service.dart';
import '../widgets/premium_deal_overlay.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class DealCard extends StatelessWidget {
  final Deal deal;
  final VoidCallback onTap;

  const DealCard({
    super.key,
    required this.deal,
    required this.onTap,
  });

  void _showPaymentDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Purchase ${deal.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Original Price: \$100'),
            Text('Deal Price: \$75'),
            const SizedBox(height: 16),
            const Text('This feature requires a subscription plan.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Purchase feature coming soon!'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = Provider.of<AppProvider>(context);
    final hasAccess = !deal.isPremium || appProvider.hasActiveSubscription;
    
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Stack(
        children: [
          InkWell(
            onTap: hasAccess ? onTap : null,
            child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Deal Badge
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Color(AppConstants.colors['primary']!),
                    Color(AppConstants.colors['primary']!).withOpacity(0.8),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (deal.isPremium)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'PREMIUM',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    deal.discount,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            
            // Deal Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      deal.title,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'at ${deal.placeName}',
                      style: TextStyle(
                        color: Color(AppConstants.colors['textSecondary']!),
                        fontSize: 12,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Expanded(
                      child: Text(
                        deal.description,
                        style: TextStyle(
                          color: Color(AppConstants.colors['textSecondary']!),
                          fontSize: 11,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Price
                    if (deal.price != null)
                      Row(
                        children: [
                          Text(
                            '${deal.price!.amount.toStringAsFixed(2)} ${deal.price!.currencyCode}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                              fontSize: 12,
                            ),
                          ),
                          const Spacer(),
                          GestureDetector(
                            onTap: () => _showPaymentDialog(context),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Color(AppConstants.colors['primary']!),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'GET DEAL',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 4),
                    // Stats
                    Row(
                      children: [
                        Icon(Icons.visibility, size: 12, color: Colors.grey[600]),
                        const SizedBox(width: 2),
                        Text(
                          '${deal.views}',
                          style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.local_offer, size: 12, color: Colors.grey[600]),
                        const SizedBox(width: 2),
                        Text(
                          '${deal.claims}',
                          style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            ],
          ),
          ),
          
          // Premium Overlay
          if (deal.isPremium && !hasAccess)
            Positioned.fill(
              child: PremiumDealOverlay(
                onUpgrade: () {
                  Navigator.pushNamed(context, '/subscription');
                },
              ),
            ),
        ],
      ),
    );
  }
}