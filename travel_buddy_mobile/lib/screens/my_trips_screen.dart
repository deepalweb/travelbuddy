import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/trip.dart';
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
                child: _buildEnhancedTripCard(tripPlan, appProvider),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEnhancedTripCard(TripPlan tripPlan, AppProvider appProvider) {
    return Card(
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Enhanced header with theme
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        tripPlan.tripTitle ?? 'Trip Plan',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (tripPlan.dailyPlans.isNotEmpty && tripPlan.dailyPlans.first.theme != null && tripPlan.dailyPlans.first.theme!.isNotEmpty)
                        Text(
                          tripPlan.dailyPlans.first.theme!,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.purple[600],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue[400]!, Colors.purple[400]!],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${tripPlan.dailyPlans.length} days',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Enhanced trip info
            Row(
              children: [
                Icon(Icons.location_on, size: 16, color: Colors.red[600]),
                const SizedBox(width: 4),
                Text(tripPlan.destination, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 16),
                Icon(Icons.euro, size: 16, color: Colors.green[600]),
                const SizedBox(width: 4),
                Text(tripPlan.totalEstimatedCost, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(width: 16),
                Icon(Icons.directions_walk, size: 16, color: Colors.blue[600]),
                const SizedBox(width: 4),
                Text(tripPlan.estimatedWalkingDistance, style: const TextStyle(fontSize: 14)),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Enhanced description with better formatting
            if (tripPlan.introduction.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Text(
                  tripPlan.introduction,
                  style: const TextStyle(fontSize: 13, height: 1.4),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            
            const SizedBox(height: 16),
            
            // Enhanced action buttons
            // Action buttons - using Builder to get context
            Builder(
              builder: (context) => Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => TripPlanDetailScreen(tripPlan: tripPlan),
                          ),
                        );
                      },
                      icon: const Icon(Icons.visibility, size: 16),
                      label: const Text('View'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue[600],
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => TripPlanEditScreen(tripPlan: tripPlan),
                          ),
                        );
                      },
                      icon: const Icon(Icons.edit, size: 16),
                      label: const Text('Edit'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => _showDeleteConfirmation(context, appProvider, tripPlan),
                    icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.red[50],
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showDeleteConfirmation(BuildContext context, AppProvider appProvider, TripPlan tripPlan) {
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
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('"${tripPlan.tripTitle}" deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}