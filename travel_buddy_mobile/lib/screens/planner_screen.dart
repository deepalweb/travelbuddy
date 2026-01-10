import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../services/storage_service.dart';
import '../config/environment.dart';

import '../models/trip.dart';
import '../services/trip_analytics_service.dart';
import 'trip_plan_detail_screen.dart';
import 'trip_sharing_screen.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  int _displayCount = 5;
  String _searchQuery = '';
  String _filterStatus = 'all';
  String _sortBy = 'recent';
  final TextEditingController _searchController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadTripPlans();
    });
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
          body: Column(
            children: [
              _buildSearchAndFilters(),
              Expanded(child: _buildHomeView(appProvider)),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => _showCreatePlanOptions(),
            icon: const Icon(Icons.add),
            label: const Text('Create Plan'),
          ),
        );
      },
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search plans...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() {
                        _searchController.clear();
                        _searchQuery = '';
                      }),
                    )
                  : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (value) => setState(() => _searchQuery = value),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: PopupMenuButton<String>(
                  initialValue: _filterStatus,
                  onSelected: (value) => setState(() => _filterStatus = value),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.filter_list, size: 18),
                            const SizedBox(width: 6),
                            Text(_filterStatus == 'all' ? 'All Status' : _filterStatus),
                          ],
                        ),
                        const Icon(Icons.arrow_drop_down, size: 20),
                      ],
                    ),
                  ),
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'all', child: Text('All Status')),
                    const PopupMenuItem(value: 'Not Started', child: Text('Not Started')),
                    const PopupMenuItem(value: 'In Progress', child: Text('In Progress')),
                    const PopupMenuItem(value: 'Completed', child: Text('Completed')),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: PopupMenuButton<String>(
                  initialValue: _sortBy,
                  onSelected: (value) => setState(() => _sortBy = value),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.sort, size: 18),
                            const SizedBox(width: 6),
                            Text(_sortBy == 'recent' ? 'Recent' : _sortBy == 'progress' ? 'Progress' : 'A-Z'),
                          ],
                        ),
                        const Icon(Icons.arrow_drop_down, size: 20),
                      ],
                    ),
                  ),
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'recent', child: Text('Most Recent')),
                    const PopupMenuItem(value: 'progress', child: Text('By Progress')),
                    const PopupMenuItem(value: 'name', child: Text('By Name (A-Z)')),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
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
    List<dynamic> allPlans = [
      ...appProvider.tripPlans.map((p) => {'type': 'trip', 'data': p}),
      ...appProvider.itineraries.map((i) => {'type': 'itinerary', 'data': i}),
    ];
    
    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      allPlans = allPlans.where((item) {
        final name = item['type'] == 'trip' 
            ? (item['data'] as TripPlan).tripTitle ?? ''
            : (item['data'] as OneDayItinerary).title;
        final destination = item['type'] == 'trip' 
            ? (item['data'] as TripPlan).destination
            : 'Day Trip';
        return name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               destination.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }
    
    // Apply status filter
    if (_filterStatus != 'all') {
      allPlans = allPlans.where((item) {
        final statusInfo = item['type'] == 'trip'
            ? _calculatePlanStatus(item['data'] as TripPlan)
            : _calculateItineraryStatus(item['data'] as OneDayItinerary);
        return statusInfo['status'] == _filterStatus;
      }).toList();
    }
    
    // Apply sorting
    allPlans.sort((a, b) {
      if (_sortBy == 'name') {
        final nameA = a['type'] == 'trip' 
            ? (a['data'] as TripPlan).tripTitle ?? ''
            : (a['data'] as OneDayItinerary).title;
        final nameB = b['type'] == 'trip' 
            ? (b['data'] as TripPlan).tripTitle ?? ''
            : (b['data'] as OneDayItinerary).title;
        return nameA.compareTo(nameB);
      } else if (_sortBy == 'progress') {
        final progressA = a['type'] == 'trip'
            ? _calculatePlanStatus(a['data'] as TripPlan)['progress']
            : _calculateItineraryStatus(a['data'] as OneDayItinerary)['progress'];
        final progressB = b['type'] == 'trip'
            ? _calculatePlanStatus(b['data'] as TripPlan)['progress']
            : _calculateItineraryStatus(b['data'] as OneDayItinerary)['progress'];
        return progressB.compareTo(progressA);
      }
      return 0; // recent (default order)
    });
    
    final List<Widget> planWidgets = [];
    
    for (final item in allPlans.take(_displayCount)) {
      if (item['type'] == 'trip') {
        final plan = item['data'] as TripPlan;
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
                  value: 'share',
                  child: Row(
                    children: [
                      Icon(Icons.share, size: 16),
                      SizedBox(width: 8),
                      Text('Share'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'duplicate',
                  child: Row(
                    children: [
                      Icon(Icons.copy, size: 16),
                      SizedBox(width: 8),
                      Text('Duplicate'),
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
      } else {
        final itinerary = item['data'] as OneDayItinerary;
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
                  value: 'duplicate',
                  child: Row(
                    children: [
                      Icon(Icons.copy, size: 16),
                      SizedBox(width: 8),
                      Text('Duplicate'),
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
    }
    
    if (planWidgets.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              _searchQuery.isNotEmpty || _filterStatus != 'all'
                  ? 'No plans match your filters.'
                  : 'No plans created yet.',
              style: const TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 8),
            const Text('Browse places and tap "Add Trip" to create your first plan!', 
                       style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      );
    }
    
    final hasMore = allPlans.length > _displayCount;
    
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
      case 'share':
        if (plan is TripPlan) {
          _shareTripPlan(plan);
        }
        break;
      case 'duplicate':
        _duplicatePlan(plan, appProvider);
        break;
      case 'delete':
        _confirmDeletePlan(plan, appProvider);
        break;
    }
  }
  
  void _shareTripPlan(TripPlan tripPlan) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TripSharingScreen(tripPlan: tripPlan),
      ),
    );
    
    // Track sharing analytics
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentUser?.mongoId != null) {
      TripAnalyticsService.trackTripShared(
        userId: appProvider.currentUser!.mongoId!,
        tripPlanId: tripPlan.id,
        shareMethod: 'menu',
      );
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
  
  void _duplicatePlan(dynamic plan, AppProvider appProvider) async {
    try {
      if (plan is TripPlan) {
        final duplicated = TripPlan(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          tripTitle: '${plan.tripTitle} (Copy)',
          destination: plan.destination,
          duration: plan.duration,
          introduction: plan.introduction,
          dailyPlans: plan.dailyPlans,
          conclusion: plan.conclusion,
          estimatedWalkingDistance: plan.estimatedWalkingDistance,
        );
        await appProvider.saveTripPlan(duplicated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Plan duplicated successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (plan is OneDayItinerary) {
        final duplicated = OneDayItinerary(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: '${plan.title} (Copy)',
          introduction: plan.introduction,
          dailyPlan: plan.dailyPlan,
          conclusion: plan.conclusion,
        );
        appProvider.itineraries.add(duplicated);
        final storageService = StorageService();
        await storageService.saveItinerary(duplicated);
        appProvider.notifyListeners();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Itinerary duplicated successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to duplicate: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
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

  void _showCreatePlanOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Container(
          padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Create New Plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (Environment.enableAIPlanner)
              ListTile(
                leading: const Icon(Icons.smart_toy, color: Colors.purple),
                title: const Text('AI Trip Planner'),
                subtitle: const Text('Generate plans with AI'),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'AI',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.purple,
                    ),
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.pushNamed(context, '/ai-plan');
                },
              ),

          ],
        ),
        ),
      ),
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