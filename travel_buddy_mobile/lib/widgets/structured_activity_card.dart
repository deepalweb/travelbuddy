import 'package:flutter/material.dart';
import '../models/trip.dart';

class StructuredActivityCard extends StatelessWidget {
  final ActivityDetail activity;
  final VoidCallback? onReplace;
  final VoidCallback? onAddBreak;
  final VoidCallback? onMoreDetails;

  const StructuredActivityCard({
    super.key,
    required this.activity,
    this.onReplace,
    this.onAddBreak,
    this.onMoreDetails,
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
            // Time and Title Row
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${activity.startTime} – ${activity.endTime}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _getCategoryEmoji(activity.category ?? ''),
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    activity.activityTitle,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Category and Rating
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    activity.category ?? 'Activity',
                    style: const TextStyle(fontSize: 10),
                  ),
                ),
                const SizedBox(width: 8),
                if (activity.rating != null) ...[
                  const Icon(Icons.star, size: 14, color: Colors.amber),
                  const SizedBox(width: 2),
                  Text(
                    '${activity.rating!.toStringAsFixed(1)} (${_formatReviews(activity.userRatingsTotal)})',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Travel and Duration Info
            Row(
              children: [
                _buildInfoChip(
                  _getTravelIcon(activity.travelMode),
                  '${activity.travelMode.capitalize()} ${activity.travelTimeMin}m',
                  Colors.blue,
                ),
                const SizedBox(width: 8),
                _buildInfoChip(
                  Icons.schedule,
                  '${activity.estimatedVisitDurationMin}m visit',
                  Colors.green,
                ),
                const SizedBox(width: 8),
                _buildInfoChip(
                  Icons.euro,
                  activity.estimatedCost,
                  Colors.orange,
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            // Highlight/Tip
            if (activity.highlight?.isNotEmpty == true)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('💡', style: TextStyle(fontSize: 14)),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        activity.highlight!,
                        style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
                      ),
                    ),
                  ],
                ),
              ),
            
            const SizedBox(height: 8),
            
            // Tags
            if (activity.tags.isNotEmpty)
              Wrap(
                spacing: 4,
                children: activity.tags.map((tag) => 
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getTagColor(tag).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      tag,
                      style: TextStyle(fontSize: 10, color: _getTagColor(tag)),
                    ),
                  )
                ).toList(),
              ),
            
            const SizedBox(height: 12),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReplace,
                    child: const Text('Replace', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: onAddBreak,
                    child: const Text('Add Break', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: onMoreDetails,
                    child: const Text('Details', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: color),
        const SizedBox(width: 2),
        Text(
          text,
          style: TextStyle(fontSize: 10, color: color),
        ),
      ],
    );
  }

  IconData _getTravelIcon(String mode) {
    switch (mode.toLowerCase()) {
      case 'walking': return Icons.directions_walk;
      case 'metro': return Icons.train;
      case 'taxi': return Icons.local_taxi;
      case 'bus': return Icons.directions_bus;
      default: return Icons.directions;
    }
  }

  String _getCategoryEmoji(String category) {
    switch (category.toLowerCase()) {
      case 'food & drink': return '🍽️';
      case 'landmarks & attractions': return '🏛️';
      case 'culture & museums': return '🎨';
      case 'outdoor & nature': return '🌳';
      case 'shopping & markets': return '🛍️';
      default: return '📍';
    }
  }

  Color _getTagColor(String tag) {
    switch (tag.toLowerCase()) {
      case 'family-friendly': return Colors.green;
      case 'wheelchair accessible': return Colors.blue;
      case 'romantic': return Colors.pink;
      case 'budget-friendly': return Colors.orange;
      default: return Colors.grey;
    }
  }

  String _formatReviews(int? count) {
    if (count == null) return '';
    if (count < 1000) return '${count}';
    return '${(count / 1000).toStringAsFixed(1)}k';
  }
}

extension StringCapitalize on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }
}