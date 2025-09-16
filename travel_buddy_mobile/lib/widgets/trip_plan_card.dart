import 'package:flutter/material.dart';
import '../models/trip.dart';
import '../constants/app_constants.dart';

class TripPlanCard extends StatelessWidget {
  final TripPlan tripPlan;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const TripPlanCard({
    super.key,
    required this.tripPlan,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tripPlan.tripTitle ?? 'Trip Plan',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 14,
                            color: Color(AppConstants.colors['textSecondary']!),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            tripPlan.destination ?? 'Unknown',
                            style: TextStyle(
                              color: Color(AppConstants.colors['textSecondary']!),
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: Color(AppConstants.colors['textSecondary']!),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            tripPlan.duration ?? 'Unknown',
                            style: TextStyle(
                              color: Color(AppConstants.colors['textSecondary']!),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Color(AppConstants.colors['primary']!).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${tripPlan.dailyPlans.length ?? 0} days',
                    style: TextStyle(
                      color: Color(AppConstants.colors['primary']!),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            
            // Description
            if (tripPlan.introduction.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              Text(
                tripPlan.introduction,
                style: TextStyle(
                  color: Color(AppConstants.colors['textSecondary']!),
                  fontSize: 12,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            
            const SizedBox(height: 12),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onView,
                    icon: const Icon(Icons.visibility, size: 16),
                    label: const Text('View'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete, size: 16),
                    label: const Text('Delete'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}