import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../services/storage_service.dart';
import '../models/trip.dart';
import 'my_trips_screen.dart';
import 'trip_plan_detail_screen.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  int _displayCount = 5;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadTripPlans();
    });
  }
  
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<AppProvider>().loadTripPlans();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('My Trip Plans'),
            actions: [
              IconButton(
                icon: const Icon(Icons.info_outline),
                onPressed: () => _showHowToCreatePlans(),
              ),
            ],
          ),
          body: _buildHomeView(appProvider),
        );
      },
    );
  }

  Widget _buildHomeView(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with stats
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(AppConstants.colors['primary']!), Colors.purple[400]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('My Trip Plans', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text('Plans created from places you love', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('SIMPLE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildHomeStatItem('${appProvider.tripPlans.length + appProvider.itineraries.length}', 'Total Plans', Icons.map),
                    const SizedBox(width: 20),
                    _buildHomeStatItem(_calculateTotalDistance(appProvider), 'Total KMs', Icons.directions_walk),
                    const SizedBox(width: 20),
                    _buildHomeStatItem(_calculateTotalTime(appProvider), 'Total Time', Icons.schedule),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // How to create plans info
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              children: [
                Icon(Icons.lightbulb_outline, color: Colors.blue[600], size: 32),
                const SizedBox(height: 12),
                Text(
                  'How to Create Trip Plans',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[800],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '1. Browse places in the Places tab\n2. Tap on any place you like\n3. Click "Add Trip" button\n4. Create new plan or add to existing',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.blue[700],
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () => _navigateToPlaces(),
                  icon: const Icon(Icons.explore),
                  label: const Text('Browse Places'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // My plans section
          const Text('My Trip Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _buildRecentPlansList(appProvider),
        ],
      ),
    );
  }
  
  Widget _buildHomeStatItem(String value, String label, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }
  
  Widget _buildRecentPlansList(AppProvider appProvider) {
    final List<Widget> planWidgets = [];
    
    // Add trip plans (limit to display count)
    for (final plan in appProvider.tripPlans.take(_displayCount)) {
      final statusInfo = _calculatePlanStatus(plan);
      
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.purple[100],
            child: Icon(Icons.map, color: Colors.purple[700]),
          ),
          title: Row(
            children: [
              Expanded(child: Text(plan.tripTitle ?? 'Trip Plan')),
              _buildStatusBadge(statusInfo),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${plan.destination} • ${plan.duration}'),
              const SizedBox(height: 4),
              _buildProgressBar(statusInfo),
            ],
          ),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) => _handlePlanAction(value, plan, appProvider),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'view',
                child: Row(
                  children: [
                    Icon(Icons.visibility, size: 16),
                    SizedBox(width: 8),
                    Text('View'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 16, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
          onTap: () => _showTripPlanDetails(plan),
        ),
      ));
    }
    
    // Add day itineraries (limit to display count)
    for (final itinerary in appProvider.itineraries.take(_displayCount)) {
      final statusInfo = _calculateItineraryStatus(itinerary);
      
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.today, color: Colors.blue[700]),
          ),
          title: Row(
            children: [
              Expanded(child: Text(itinerary.title)),
              _buildStatusBadge(statusInfo),
            ],
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Day itinerary • ${itinerary.dailyPlan.length} activities'),
              const SizedBox(height: 4),
              _buildProgressBar(statusInfo),
            ],
          ),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) => _handlePlanAction(value, itinerary, appProvider),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'view',
                child: Row(
                  children: [
                    Icon(Icons.visibility, size: 16),
                    SizedBox(width: 8),
                    Text('View'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 16, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
          onTap: () => _showItineraryDetails(itinerary),
        ),
      ));
    }
    
    if (planWidgets.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('No plans created yet.', 
                       style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
            const SizedBox(height: 8),
            const Text('Browse places and tap "Add Trip" to create your first plan!', 
                       style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      );
    }
    
    final totalPlans = appProvider.tripPlans.length + appProvider.itineraries.length;
    final hasMore = totalPlans > _displayCount;
    
    return Column(
      children: [
        ...planWidgets,
        if (hasMore)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: OutlinedButton(
              onPressed: () {
                setState(() {
                  _displayCount += 5;
                });
              },
              child: const Text('Show More'),
            ),
          ),
      ],
    );
  }
  
  void _handlePlanAction(String action, dynamic plan, AppProvider appProvider) {
    switch (action) {
      case 'view':
        if (plan is TripPlan) {
          _showTripPlanDetails(plan);
        } else if (plan is OneDayItinerary) {
          _showItineraryDetails(plan);
        }
        break;
      case 'delete':
        _confirmDeletePlan(plan, appProvider);
        break;
    }
  }
  
  void _confirmDeletePlan(dynamic plan, AppProvider appProvider) {
    final planName = plan is TripPlan ? plan.tripTitle : plan.title;
    final planType = plan is TripPlan ? 'trip plan' : 'day itinerary';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete $planType?'),
        content: Text('Are you sure you want to delete "$planName"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deletePlan(plan, appProvider);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  void _deletePlan(dynamic plan, AppProvider appProvider) async {
    try {
      if (plan is TripPlan) {
        await appProvider.deleteTripPlan(plan.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Trip plan deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (plan is OneDayItinerary) {
        appProvider.itineraries.removeWhere((itinerary) => itinerary.id == plan.id);
        final storageService = StorageService();
        await storageService.deleteItinerary(plan.id);
        appProvider.notifyListeners();
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Day itinerary deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to delete: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showTripPlanDetails(TripPlan tripPlan) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TripPlanDetailScreen(tripPlan: tripPlan),
      ),
    );
  }
  
  void _showItineraryDetails(OneDayItinerary itinerary) {
    final tripPlan = TripPlan(
      id: itinerary.id,
      tripTitle: itinerary.title,
      destination: 'Day Trip',
      duration: '1 Day',
      introduction: itinerary.introduction,
      dailyPlans: [
        DailyTripPlan(
          day: 1,
          title: itinerary.title,
          activities: itinerary.dailyPlan,
        ),
      ],
      conclusion: itinerary.conclusion,
    );
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => TripPlanDetailScreen(tripPlan: tripPlan),
      ),
    );
  }

  void _navigateToPlaces() {
    final navigator = Navigator.of(context);
    navigator.popUntil((route) => route.isFirst);
  }
  
  String _calculateTotalDistance(AppProvider appProvider) {
    double totalKm = 0;
    
    // Calculate from trip plans
    for (final plan in appProvider.tripPlans) {
      if (plan.estimatedWalkingDistance.isNotEmpty && plan.estimatedWalkingDistance != '0 km') {
        final match = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(plan.estimatedWalkingDistance);
        if (match != null) {
          totalKm += double.parse(match.group(1)!);
        }
      } else {
        // Default estimate per trip plan
        totalKm += 8; // 8km average per trip
      }
    }
    
    // Calculate from day itineraries
    for (final itinerary in appProvider.itineraries) {
      totalKm += 5; // 5km average per day plan
    }
    
    if (totalKm >= 1000) {
      return '${(totalKm / 1000).toStringAsFixed(1)}K';
    }
    return '${totalKm.toInt()}';
  }

  String _calculateTotalTime(AppProvider appProvider) {
    int totalHours = 0;
    
    // Calculate from trip plans
    for (final plan in appProvider.tripPlans) {
      for (final day in plan.dailyPlans) {
        for (final activity in day.activities) {
          final duration = activity.duration;
          if (duration.contains('hr')) {
            final match = RegExp(r'(\d+)').firstMatch(duration);
            if (match != null) {
              totalHours += int.parse(match.group(1)!);
            }
          }
        }
      }
    }
    
    // Calculate from day itineraries
    for (final itinerary in appProvider.itineraries) {
      for (final activity in itinerary.dailyPlan) {
        final duration = activity.duration;
        if (duration.contains('hr')) {
          final match = RegExp(r'(\d+)').firstMatch(duration);
          if (match != null) {
            totalHours += int.parse(match.group(1)!);
          }
        }
      }
    }
    
    // Default estimates if no data
    if (totalHours == 0) {
      totalHours = (appProvider.tripPlans.length * 12) + (appProvider.itineraries.length * 6);
    }
    
    if (totalHours >= 24) {
      final days = totalHours ~/ 24;
      final hours = totalHours % 24;
      return hours > 0 ? '${days}d ${hours}h' : '${days}d';
    }
    return '${totalHours}h';
  }

  Map<String, dynamic> _calculatePlanStatus(TripPlan plan) {
    int totalActivities = 0;
    int visitedActivities = 0;
    
    for (final day in plan.dailyPlans) {
      for (final activity in day.activities) {
        totalActivities++;
        if (activity.isVisited) {
          visitedActivities++;
        }
      }
    }
    
    final progress = totalActivities > 0 ? visitedActivities / totalActivities : 0.0;
    String status;
    Color statusColor;
    
    if (progress == 0) {
      status = 'Not Started';
      statusColor = Colors.grey;
    } else if (progress < 1.0) {
      status = 'In Progress';
      statusColor = Colors.orange;
    } else {
      status = 'Completed';
      statusColor = Colors.green;
    }
    
    return {
      'total': totalActivities,
      'visited': visitedActivities,
      'progress': progress,
      'status': status,
      'color': statusColor,
    };
  }
  
  Map<String, dynamic> _calculateItineraryStatus(OneDayItinerary itinerary) {
    int totalActivities = itinerary.dailyPlan.length;
    int visitedActivities = 0;
    
    for (final activity in itinerary.dailyPlan) {
      if (activity.isVisited) {
        visitedActivities++;
      }
    }
    
    final progress = totalActivities > 0 ? visitedActivities / totalActivities : 0.0;
    String status;
    Color statusColor;
    
    if (progress == 0) {
      status = 'Not Started';
      statusColor = Colors.grey;
    } else if (progress < 1.0) {
      status = 'In Progress';
      statusColor = Colors.orange;
    } else {
      status = 'Completed';
      statusColor = Colors.green;
    }
    
    return {
      'total': totalActivities,
      'visited': visitedActivities,
      'progress': progress,
      'status': status,
      'color': statusColor,
    };
  }
  
  Widget _buildStatusBadge(Map<String, dynamic> statusInfo) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: statusInfo['color'].withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusInfo['color'], width: 1),
      ),
      child: Text(
        statusInfo['status'],
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: statusInfo['color'],
        ),
      ),
    );
  }
  
  Widget _buildProgressBar(Map<String, dynamic> statusInfo) {
    return Row(
      children: [
        Expanded(
          child: LinearProgressIndicator(
            value: statusInfo['progress'],
            backgroundColor: Colors.grey[300],
            valueColor: AlwaysStoppedAnimation<Color>(statusInfo['color']),
            minHeight: 4,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '${statusInfo['visited']}/${statusInfo['total']}',
          style: TextStyle(
            fontSize: 11,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  void _showHowToCreatePlans() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('How to Create Plans'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('📍 Step 1: Go to Places tab'),
            SizedBox(height: 8),
            Text('👆 Step 2: Tap on any place you like'),
            SizedBox(height: 8),
            Text('➕ Step 3: Click "Add Trip" button'),
            SizedBox(height: 8),
            Text('✨ Step 4: Create new plan or add to existing'),
            SizedBox(height: 16),
            Text('Your plans will appear here automatically!', 
                 style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToPlaces();
            },
            child: const Text('Browse Places'),
          ),
        ],
      ),
    );
  }
  

}