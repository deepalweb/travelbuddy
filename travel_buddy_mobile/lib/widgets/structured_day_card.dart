import 'package:flutter/material.dart';
import '../models/trip.dart';

class StructuredDayCard extends StatelessWidget {
  final DailyTripPlan dayPlan;
  final VoidCallback? onTap;

  const StructuredDayCard({
    super.key,
    required this.dayPlan,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Day Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.blue,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'DAY ${dayPlan.day}',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      dayPlan.date.isNotEmpty ? dayPlan.date : dayPlan.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Summary
              if (dayPlan.summary.isNotEmpty)
                Text(
                  dayPlan.summary,
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
              
              const SizedBox(height: 12),
              
              // Stats Row
              Row(
                children: [
                  _buildStatChip('💰', dayPlan.dayEstimatedCost, Colors.green),
                  const SizedBox(width: 8),
                  _buildStatChip('🚶', dayPlan.totalWalkingTime, Colors.blue),
                  const SizedBox(width: 8),
                  _buildStatChip('🚌', dayPlan.totalTravelTime, Colors.orange),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Activities Preview
              if (dayPlan.activities.isNotEmpty)
                Column(
                  children: dayPlan.activities.take(3).map((activity) => 
                    _buildActivityPreview(activity)
                  ).toList(),
                ),
              
              if (dayPlan.activities.length > 3)
                Text(
                  '+${dayPlan.activities.length - 3} more activities',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(String emoji, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Text(
            value,
            style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildActivityPreview(ActivityDetail activity) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            activity.startTime,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 8),
          Text(
            _getCategoryEmoji(activity.category ?? ''),
            style: const TextStyle(fontSize: 14),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              activity.activityTitle,
              style: const TextStyle(fontSize: 12),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (activity.rating != null)
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.star, size: 12, color: Colors.amber),
                Text(
                  activity.rating!.toStringAsFixed(1),
                  style: const TextStyle(fontSize: 10),
                ),
              ],
            ),
        ],
      ),
    );
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
}