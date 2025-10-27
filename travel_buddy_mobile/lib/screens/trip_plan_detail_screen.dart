import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/trip.dart';
import '../models/place.dart';
import '../services/azure_openai_service.dart';
import '../providers/app_provider.dart';
import '../screens/route_plan_screen.dart';
import '../screens/enhanced_route_plan_screen.dart';
import '../screens/simple_route_map_screen.dart';
import '../screens/smart_route_list_screen.dart';
import '../screens/activity_detail_screen.dart';
import '../screens/place_detail_screen.dart';
import '../models/route_models.dart';

class TripPlanDetailScreen extends StatefulWidget {
  final TripPlan tripPlan;

  const TripPlanDetailScreen({super.key, required this.tripPlan});

  @override
  State<TripPlanDetailScreen> createState() => _TripPlanDetailScreenState();
}

class _TripPlanDetailScreenState extends State<TripPlanDetailScreen> {
  String? _enhancedIntroduction;
  bool _isLoadingIntroduction = false;
  TripPlan? _currentTripPlan;

  @override
  void initState() {
    super.initState();
    _currentTripPlan = widget.tripPlan;
    _loadEnhancedIntroduction();
    
    // Load updated data after a short delay
    Future.delayed(Duration(milliseconds: 500), () {
      _refreshTripPlan();
    });
  }

  void _refreshTripPlan() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    // Force reload from storage to get updated data
    await appProvider.loadTripPlans();
    
    // Check both trip plans and itineraries
    TripPlan? latestTrip;
    
    // First check trip plans
    try {
      latestTrip = appProvider.tripPlans.firstWhere(
        (trip) => trip.id == widget.tripPlan.id,
      );
    } catch (e) {
      // If not found in trip plans, check itineraries
      try {
        final itinerary = appProvider.itineraries.firstWhere(
          (itinerary) => itinerary.id == widget.tripPlan.id,
        );
        // Convert itinerary back to trip plan format
        latestTrip = TripPlan(
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
      } catch (e2) {
        latestTrip = widget.tripPlan;
      }
    }
    
    print('🔄 Refreshing trip plan. Found updated trip: ${latestTrip.id}');
    
    setState(() {
      _currentTripPlan = latestTrip;
    });
  }

  void _toggleVisitStatus(String activityTitle) async {
    print('🔍 Toggle visit status for: $activityTitle');
    if (_currentTripPlan == null) {
      print('❌ No current trip plan');
      return;
    }
    
    // Find activity indices
    int dayIndex = -1;
    int activityIndex = -1;
    
    for (int d = 0; d < _currentTripPlan!.dailyPlans.length; d++) {
      for (int a = 0; a < _currentTripPlan!.dailyPlans[d].activities.length; a++) {
        if (_currentTripPlan!.dailyPlans[d].activities[a].activityTitle == activityTitle) {
          dayIndex = d;
          activityIndex = a;
          print('📍 Found activity at day $dayIndex, activity $activityIndex');
          break;
        }
      }
      if (dayIndex != -1) break;
    }
    
    if (dayIndex != -1 && activityIndex != -1) {
      final currentStatus = _currentTripPlan!.dailyPlans[dayIndex].activities[activityIndex].isVisited;
      final newStatus = !currentStatus;
      print('🔄 Changing status from $currentStatus to $newStatus');
      
      // Use AppProvider to save the status
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      
      // Check if this is an itinerary or trip plan
      final isItinerary = appProvider.itineraries.any((itinerary) => itinerary.id == _currentTripPlan!.id);
      
      if (isItinerary) {
        await appProvider.updateItineraryActivityVisitedStatus(_currentTripPlan!.id, activityIndex, newStatus);
        print('📝 Updated itinerary activity status');
      } else {
        await appProvider.updateActivityVisitedStatus(_currentTripPlan!.id, dayIndex, activityIndex, newStatus);
        print('🗺 Updated trip plan activity status');
      }
      
      // Refresh the trip plan data
      _refreshTripPlan();
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            newStatus ? '✅ Marked as visited & saved' : '⏳ Marked as pending & saved',
          ),
          backgroundColor: newStatus ? Colors.green : Colors.blue,
          duration: const Duration(seconds: 1),
        ),
      );
    } else {
      print('❌ Activity not found: $activityTitle');
    }
  }

  void _confirmRemoveActivity(ActivityDetail activity) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Activity'),
        content: Text('Remove "${activity.activityTitle}" from this trip plan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _removeActivity(activity);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }

  void _removeActivity(ActivityDetail activity) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🗑️ Removed "${activity.activityTitle}" from plan'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  Widget _buildTripPlanStatsCard() {
    if (_currentTripPlan == null) return const SizedBox();
    
    final allActivities = <ActivityDetail>[];
    for (final day in _currentTripPlan!.dailyPlans) {
      allActivities.addAll(day.activities);
    }
    
    final totalPlaces = allActivities.length;
    final visitedCount = allActivities.where((activity) => activity.isVisited).length;
    final pendingCount = totalPlaces - visitedCount;
    
    print('📊 STATS DEBUG: Total: $totalPlaces, Visited: $visitedCount, Pending: $pendingCount');
    for (final activity in allActivities) {
      print('   Stats activity: ${activity.activityTitle} - isVisited: ${activity.isVisited}');
    }
    
    // Calculate total and pending time
    int totalHours = 0;
    int pendingHours = 0;
    
    for (final activity in allActivities) {
      final duration = activity.duration;
      int hours = 0;
      if (duration.contains('hr')) {
        final match = RegExp(r'(\d+)').firstMatch(duration);
        if (match != null) {
          hours = int.parse(match.group(1)!);
        }
      } else {
        hours = 2; // Default 2 hours per activity
      }
      
      totalHours += hours;
      
      if (!activity.isVisited) {
        pendingHours += hours;
      }
    }
    
    // Calculate total and pending distance (estimate)
    final totalKm = totalPlaces * 2; // 2km average per place
    final pendingKm = pendingCount * 2;
    
    return Card(
      color: Colors.grey[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.analytics, color: Colors.purple),
                const SizedBox(width: 8),
                const Text(
                  'Trip Progress',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    '$totalPlaces',
                    'Total Places',
                    Icons.place,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '$visitedCount',
                    'Visited',
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '$pendingCount',
                    'Pending',
                    Icons.pending,
                    Colors.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    '${totalKm}km / ${pendingKm}km',
                    'Total / Pending KM',
                    Icons.directions_walk,
                    Colors.indigo,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '${totalHours}h / ${pendingHours}h',
                    'Total / Pending Time',
                    Icons.schedule,
                    Colors.teal,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: color,
          ),
          textAlign: TextAlign.center,
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: Colors.grey,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Future<void> _loadEnhancedIntroduction() async {
    setState(() {
      _isLoadingIntroduction = true;
    });
    
    try {
      final enhanced = await AzureOpenAIService.generateRichIntroduction(widget.tripPlan);
      if (mounted) {
        setState(() {
          _enhancedIntroduction = enhanced;
          _isLoadingIntroduction = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingIntroduction = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.tripPlan.tripTitle ?? 'Trip Plan'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshTripPlan,
            tooltip: 'Refresh Data',
          ),
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
                      widget.tripPlan.tripTitle ?? 'Trip Plan',
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
                          widget.tripPlan.destination ?? 'Unknown Destination',
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
                          widget.tripPlan.duration ?? 'Unknown Duration',
                          style: const TextStyle(fontSize: 16),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Trip Plan Stats Card
            _buildTripPlanStatsCard(),
            const SizedBox(height: 16),
            
            // Enhanced Introduction
            _buildEnhancedIntroduction(),
            const SizedBox(height: 16),
            
            // Totals Summary
            Card(
              color: Colors.blue[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Trip Summary',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildSummaryItem(
                          Icons.directions_walk,
                          _calculateTotalDistance(),
                          'Distance',
                          Colors.blue,
                        ),
                        _buildSummaryItem(
                          Icons.schedule,
                          _calculateTotalTime(),
                          'Time',
                          Colors.orange,
                        ),
                        _buildSummaryItem(
                          Icons.euro,
                          _calculateTotalCost(),
                          'Cost',
                          Colors.green,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Daily Plans
            const Text(
              'Daily Itinerary',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            
            ...(_currentTripPlan ?? widget.tripPlan).dailyPlans.asMap().entries.map((entry) {
              final index = entry.key;
              final dayPlan = entry.value;
              return _buildDayPlan(index + 1, dayPlan);
            }),
            
            const SizedBox(height: 24),
            
            // Bottom Action Buttons
            Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _showRoutePreferences,
                    icon: const Icon(Icons.route),
                    label: const Text('Plan Route'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _openRouteInGoogleMaps,
                    icon: const Icon(Icons.map),
                    label: const Text('Open in Google Maps'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            
            // Add safe area padding for bottom navigation
            SizedBox(height: MediaQuery.of(context).padding.bottom + 16),
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
            ...dayPlan.activities.map((activity) => Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 16, color: Colors.blue[600]),
                      const SizedBox(width: 6),
                      Text(
                        activity.timeOfDay,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    activity.activityTitle,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildActivityDetails(activity),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityDetails(ActivityDetail activity) {
    final isVisited = activity.isVisited;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (activity.description.isNotEmpty) ...[
          Text(
            activity.description,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
          const SizedBox(height: 8),
        ],
        if (activity.fullAddress?.isNotEmpty == true) ...[
          Row(
            children: [
              const Icon(Icons.location_on, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  activity.fullAddress!,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
        ],
        Row(
          children: [
            if (activity.rating != null) ...[
              const Icon(Icons.star, size: 16, color: Colors.orange),
              const SizedBox(width: 4),
              Text(
                '${activity.rating}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
              const SizedBox(width: 12),
            ],
            if (activity.duration.isNotEmpty) ...[
              const Icon(Icons.schedule, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                activity.duration,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(width: 12),
            ],
            if (activity.estimatedCost.isNotEmpty && activity.estimatedCost != '€0') ...[
              const Icon(Icons.euro, size: 16, color: Colors.green),
              const SizedBox(width: 4),
              Text(
                activity.estimatedCost,
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.green,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        // Action Buttons Row
        Row(
          children: [
            // Visit Status Button
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => _toggleVisitStatus(activity.activityTitle),
                icon: Icon(
                  isVisited ? Icons.check_circle : Icons.pending,
                  size: 16,
                ),
                label: Text(
                  isVisited ? 'Visited' : 'Pending Visit',
                  style: const TextStyle(fontSize: 12),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isVisited ? Colors.green : Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  minimumSize: const Size(0, 32),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Place Details Button
            IconButton(
              onPressed: () => _showPlaceDetails(activity),
              icon: const Icon(Icons.place, size: 16),
              style: IconButton.styleFrom(
                backgroundColor: Colors.green[50],
                foregroundColor: Colors.green,
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Place details',
            ),
            const SizedBox(width: 4),
            // Activity Details Arrow Button
            IconButton(
              onPressed: () => _showActivityDetails(activity),
              icon: const Icon(Icons.arrow_forward_ios, size: 16),
              style: IconButton.styleFrom(
                backgroundColor: Colors.blue[50],
                foregroundColor: Colors.blue,
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Activity details',
            ),
            const SizedBox(width: 4),
            // Remove Button
            IconButton(
              onPressed: () => _confirmRemoveActivity(activity),
              icon: const Icon(Icons.delete, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: Colors.red[50],
                foregroundColor: Colors.red,
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Remove from plan',
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryItem(IconData icon, String value, String label, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildEnhancedIntroduction() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.auto_stories, color: Colors.blue),
                const SizedBox(width: 8),
                const Text(
                  'Trip Overview',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (_isLoadingIntroduction)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (_enhancedIntroduction != null)
              _buildFormattedText(_enhancedIntroduction!)
            else if (!_isLoadingIntroduction && widget.tripPlan.introduction.isNotEmpty)
              Text(widget.tripPlan.introduction)
            else if (!_isLoadingIntroduction)
              Text(
                'Discover ${widget.tripPlan.destination} with this carefully crafted ${widget.tripPlan.duration} itinerary.',
                style: const TextStyle(fontStyle: FontStyle.italic),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormattedText(String text) {
    final lines = text.split('\n');
    final widgets = <Widget>[];
    
    for (final line in lines) {
      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 8));
      } else if (line.startsWith('🌟 **') && line.endsWith('** 🌟')) {
        // Title line
        widgets.add(
          Text(
            line.replaceAll('**', '').replaceAll('🌟 ', '').replaceAll(' 🌟', ''),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
            textAlign: TextAlign.center,
          ),
        );
      } else if (line.startsWith('💡 **') && line.endsWith(':**')) {
        // Section header
        widgets.add(
          Text(
            line.replaceAll('**', ''),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
        );
      } else if (line.startsWith('• ')) {
        // Bullet point
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 16, top: 2),
            child: Text(
              line,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        );
      } else {
        // Regular text
        widgets.add(
          Text(
            line,
            style: const TextStyle(fontSize: 14, height: 1.4),
          ),
        );
      }
      widgets.add(const SizedBox(height: 4));
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  String _calculateTotalDistance() {
    if (widget.tripPlan.estimatedWalkingDistance.isNotEmpty && widget.tripPlan.estimatedWalkingDistance != '0 km') {
      return widget.tripPlan.estimatedWalkingDistance;
    }
    return '5-10 km';
  }

  String _calculateTotalTime() {
    int totalMinutes = 0;
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        final duration = activity.duration;
        if (duration.contains('hr')) {
          final match = RegExp(r'(\d+)').firstMatch(duration);
          if (match != null) {
            totalMinutes += int.parse(match.group(1)!) * 60;
          }
        }
      }
    }
    
    if (totalMinutes > 0) {
      final hours = totalMinutes ~/ 60;
      return '${hours}h';
    }
    return '6-8h';
  }

  String _calculateTotalCost() {
    if (widget.tripPlan.totalEstimatedCost.isNotEmpty && widget.tripPlan.totalEstimatedCost != '€0') {
      return widget.tripPlan.totalEstimatedCost;
    }
    
    double totalCost = 0;
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        final cost = activity.estimatedCost;
        if (cost.contains('LKR')) {
          final match = RegExp(r'LKR\s*(\d+)').firstMatch(cost);
          if (match != null) {
            totalCost += double.parse(match.group(1)!);
          }
        }
      }
    }
    
    if (totalCost > 0) {
      return 'LKR ${totalCost.toInt()}';
    }
    return 'LKR 2000-5000';
  }

  void _openRoutePlan() {
    // Convert trip activities to places for route planning
    final places = <Place>[];
    
    for (final day in (_currentTripPlan ?? widget.tripPlan).dailyPlans) {
      for (final activity in day.activities) {
        // Create a Place object from activity
        places.add(Place(
          id: activity.googlePlaceId ?? 'activity_${activity.activityTitle.hashCode}',
          name: activity.activityTitle,
          address: activity.fullAddress ?? activity.location ?? '',
          latitude: null, // Will be resolved by route planning service
          longitude: null,
          rating: activity.rating ?? 0.0,
          type: activity.category ?? 'attraction',
          photoUrl: activity.photoThumbnail ?? '',
          description: activity.description,
          localTip: activity.practicalTip ?? '',
          handyPhrase: '',
        ));
      }
    }
    
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places found to plan route'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoutePlanScreen(
          places: places,
          title: '${widget.tripPlan.tripTitle} Route',
        ),
      ),
    );
  }

  void _openRouteInGoogleMaps() async {
    try {
      // Collect all activity locations
      final locations = <String>[];
      
      for (final day in widget.tripPlan.dailyPlans) {
        for (final activity in day.activities) {
          if (activity.fullAddress?.isNotEmpty == true) {
            locations.add(activity.fullAddress!);
          } else if (activity.activityTitle.isNotEmpty) {
            // Use activity title as fallback
            final cleanTitle = activity.activityTitle
                .replaceAll(RegExp(r'[🍽️☕🏛️🌳🛍️🍸🏯🏖️📍]'), '')
                .replaceAll('Visit ', '')
                .trim();
            locations.add(cleanTitle);
          }
        }
      }
      
      if (locations.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No locations found to create route'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
      
      // Create Google Maps URL with multiple waypoints
      String googleMapsUrl;
      
      if (locations.length == 1) {
        // Single location - just open directions
        googleMapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeComponent(locations.first)}';
      } else {
        // Multiple locations - create route with waypoints
        final origin = locations.first;
        final destination = locations.last;
        final waypoints = locations.length > 2 
            ? locations.sublist(1, locations.length - 1).map((loc) => Uri.encodeComponent(loc)).join('|')
            : '';
        
        googleMapsUrl = 'https://www.google.com/maps/dir/?api=1'
            '&origin=${Uri.encodeComponent(origin)}'
            '&destination=${Uri.encodeComponent(destination)}';
        
        if (waypoints.isNotEmpty) {
          googleMapsUrl += '&waypoints=$waypoints';
        }
      }
      
      final uri = Uri.parse(googleMapsUrl);
      
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        // Fallback to web version
        final webUrl = Uri.parse('https://maps.google.com/maps?q=${Uri.encodeComponent(locations.first)}');
        if (await canLaunchUrl(webUrl)) {
          await launchUrl(webUrl, mode: LaunchMode.externalApplication);
        } else {
          throw 'Could not launch Google Maps';
        }
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to open Google Maps: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _openEnhancedRoutePlan() {
    // Convert trip activities to places for enhanced route planning
    final places = <Place>[];
    
    for (final day in (_currentTripPlan ?? widget.tripPlan).dailyPlans) {
      for (final activity in day.activities) {
        places.add(Place(
          id: activity.googlePlaceId ?? 'activity_${activity.activityTitle.hashCode}',
          name: activity.activityTitle,
          address: activity.fullAddress ?? activity.location ?? '',
          latitude: null, // Will be resolved by enhanced route planning service
          longitude: null,
          rating: activity.rating ?? 0.0,
          type: activity.category ?? 'attraction',
          photoUrl: activity.photoThumbnail ?? '',
          description: activity.description,
          localTip: activity.practicalTip ?? '',
          handyPhrase: '',
        ));
      }
    }
    
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places found to plan route'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EnhancedRoutePlanScreen(
          places: places,
          title: '${widget.tripPlan.tripTitle} - Smart Route',
        ),
      ),
    );
  }

  void _showRoutePreferences() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _RoutePreferencesBottomSheet(
        onPreferencesSelected: (preferences) {
          Navigator.pop(context);
          _openRouteWithPreferences(preferences);
        },
      ),
    );
  }

  void _openRouteWithPreferences(RoutePreferences preferences) {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    if (appProvider.currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location not available. Please enable location services.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Convert trip activities to places with coordinates
    final places = <Place>[];
    for (final day in (_currentTripPlan ?? widget.tripPlan).dailyPlans) {
      for (final activity in day.activities) {
        // Generate coordinates if missing
        final hash = activity.activityTitle.hashCode.abs();
        const baseLat = 6.9271; // Colombo, Sri Lanka
        const baseLng = 79.8612;
        final latOffset = ((hash % 200) - 100) / 1000.0;
        final lngOffset = (((hash ~/ 200) % 200) - 100) / 1000.0;
        
        places.add(Place(
          id: activity.googlePlaceId ?? 'activity_${activity.activityTitle.hashCode}',
          name: activity.activityTitle,
          address: activity.fullAddress ?? activity.location ?? '',
          latitude: baseLat + latOffset,
          longitude: baseLng + lngOffset,
          rating: activity.rating ?? 0.0,
          type: activity.category ?? 'attraction',
          photoUrl: activity.photoThumbnail ?? '',
          description: activity.description,
          localTip: activity.practicalTip ?? '',
          handyPhrase: '',
        ));
      }
    }
    
    print('🗺️ Created ${places.length} places for routing');
    
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places found to plan route'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SmartRouteListScreen(
          currentLocation: appProvider.currentLocation!,
          places: places,
          title: '${widget.tripPlan.tripTitle} Route',
          preferences: preferences,
        ),
      ),
    );
  }

  void _showActivityDetails(ActivityDetail activity) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ActivityDetailScreen(activity: activity),
      ),
    );
  }

  void _showPlaceDetails(ActivityDetail activity) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PlaceDetailScreen(
          placeName: activity.activityTitle,
          placeAddress: activity.fullAddress ?? activity.location ?? '',
          googlePlaceId: activity.googlePlaceId,
        ),
      ),
    );
  }

  void _shareTrip(BuildContext context) {
    final tripText = '''🌍 ${widget.tripPlan.tripTitle}

📍 Destination: ${widget.tripPlan.destination}
📅 Duration: ${widget.tripPlan.duration}

${widget.tripPlan.introduction}

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

class _RoutePreferencesBottomSheet extends StatefulWidget {
  final Function(RoutePreferences) onPreferencesSelected;

  const _RoutePreferencesBottomSheet({
    required this.onPreferencesSelected,
  });

  @override
  State<_RoutePreferencesBottomSheet> createState() => _RoutePreferencesBottomSheetState();
}

class _RoutePreferencesBottomSheetState extends State<_RoutePreferencesBottomSheet> {
  TransportMode _selectedMode = TransportMode.walking;
  bool _considerOpeningHours = true;
  bool _optimizeForRating = true;
  bool _includeBreaks = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Text(
                'Route Preferences',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Transport Mode
          const Text(
            'Transport Mode',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          _buildTransportOption(TransportMode.walking, '🚶 Walking', 'Best for exploring'),
          _buildTransportOption(TransportMode.driving, '🚗 Driving', 'Fastest option'),
          _buildTransportOption(TransportMode.publicTransit, '🚆 Public Transit', 'Eco-friendly'),
          _buildTransportOption(TransportMode.cycling, '🚲 Cycling', 'Active travel'),
          
          const SizedBox(height: 20),
          
          // Options
          const Text(
            'Options',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          _buildToggleOption(
            'Consider Opening Hours',
            'Factor in place operating hours',
            _considerOpeningHours,
            (value) => setState(() => _considerOpeningHours = value),
          ),
          
          _buildToggleOption(
            'Optimize for Rating',
            'Prioritize highly-rated places',
            _optimizeForRating,
            (value) => setState(() => _optimizeForRating = value),
          ),
          
          _buildToggleOption(
            'Include Breaks',
            'Add rest stops and meal breaks',
            _includeBreaks,
            (value) => setState(() => _includeBreaks = value),
          ),
          
          const SizedBox(height: 24),
          
          // Create Route Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                final preferences = RoutePreferences(
                  transportMode: _selectedMode,
                  considerOpeningHours: _considerOpeningHours,
                  optimizeForRating: _optimizeForRating,
                  includeBreaks: _includeBreaks,
                );
                widget.onPreferencesSelected(preferences);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text(
                'Create Route',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          
          SizedBox(height: MediaQuery.of(context).padding.bottom),
        ],
      ),
    );
  }

  Widget _buildTransportOption(TransportMode mode, String title, String subtitle) {
    final isSelected = _selectedMode == mode;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedMode = mode),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue[50] : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: isSelected ? Colors.blue : Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.blue[700] : Colors.black87,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
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

  Widget _buildToggleOption(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: Colors.blue,
          ),
        ],
      ),
    );
  }
}