import 'package:flutter/material.dart';
import '../constants/app_constants.dart';

class PremiumDealOverlay extends StatelessWidget {
  final VoidCallback onUpgrade;

  const PremiumDealOverlay({
    super.key,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock,
              size: 48,
              color: Colors.amber,
            ),
            const SizedBox(height: 16),
            const Text(
              'Premium Deal',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Upgrade to access\nexclusive premium deals',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onUpgrade,
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(AppConstants.colors['primary']!),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: const Text('Upgrade Now'),
            ),
          ],
        ),
      ),
    );
  }
}