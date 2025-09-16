import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/trip_plan_card.dart';
import 'trip_plan_detail_screen.dart';
import 'trip_plan_edit_screen.dart';

class MyTripsScreen extends StatelessWidget {
  const MyTripsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trip Plans'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          final tripPlans = appProvider.tripPlans;

          if (tripPlans.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map_outlined, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  const Text(
                    'No Trip Plans Yet',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create your first trip plan to get started!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      // Navigate to planner
                      appProvider.setCurrentTabIndex(3);
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Create Trip Plan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tripPlans.length,
            itemBuilder: (context, index) {
              final tripPlan = tripPlans[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: TripPlanCard(
                  tripPlan: tripPlan,
                  onView: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => TripPlanDetailScreen(tripPlan: tripPlan),
                      ),
                    );
                  },
                  onEdit: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => TripPlanEditScreen(tripPlan: tripPlan),
                      ),
                    );
                  },
                  onDelete: () {
                    _showDeleteConfirmation(context, appProvider, tripPlan);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, AppProvider appProvider, tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Trip Plan'),
        content: Text(
          'Are you sure you want to delete "${tripPlan.tripTitle}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await appProvider.deleteTripPlan(tripPlan.id);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('"${tripPlan.tripTitle}" deleted successfully'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}