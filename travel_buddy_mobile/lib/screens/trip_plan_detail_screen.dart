import 'package:flutter/material.dart';
import '../models/trip.dart';

class TripPlanDetailScreen extends StatelessWidget {
  final TripPlan tripPlan;

  const TripPlanDetailScreen({super.key, required this.tripPlan});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(tripPlan.tripTitle ?? 'Trip Plan'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () => _shareTrip(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip Header
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tripPlan.tripTitle ?? 'Trip Plan',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.location_on, color: Colors.blue[600], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          tripPlan.destination ?? 'Unknown Destination',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.calendar_today, color: Colors.blue[600], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          tripPlan.duration ?? 'Unknown Duration',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Introduction
            if (tripPlan.introduction.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Introduction',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(tripPlan.introduction),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            
            // Daily Plans
            const Text(
              'Daily Itinerary',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            ...tripPlan.dailyPlans.asMap().entries.map((entry) {
              final index = entry.key;
              final dayPlan = entry.value;
              return _buildDayPlan(index + 1, dayPlan);
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildDayPlan(int dayNumber, DailyTripPlan dayPlan) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Day $dayNumber',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.blue,
              ),
            ),
            const SizedBox(height: 8),
            ...dayPlan.activities.map((activity) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(top: 6, right: 12),
                    decoration: BoxDecoration(
                      color: Colors.blue[600],
                      shape: BoxShape.circle,
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${activity.timeOfDay}: ${activity.activityTitle}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        if (activity.description.isNotEmpty)
                          Text(
                            activity.description,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  void _shareTrip(BuildContext context) {
    final tripText = '''🌍 ${tripPlan.tripTitle}

📍 Destination: ${tripPlan.destination}
📅 Duration: ${tripPlan.duration}

${tripPlan.introduction}

Created with Travel Buddy - Plan your perfect trip!''';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Share Trip Plan'),
        content: Text(tripText),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Trip plan copied to share!')),
              );
            },
            child: const Text('Share'),
          ),
        ],
      ),
    );
  }
}