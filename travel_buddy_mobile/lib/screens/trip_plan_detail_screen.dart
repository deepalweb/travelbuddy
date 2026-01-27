import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math' show sin, cos, sqrt, atan2, pi;
import '../models/trip.dart';
import '../models/place.dart';
import '../services/azure_openai_service.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
import '../config/environment.dart';
import '../providers/app_provider.dart';
import '../screens/route_plan_screen.dart';
import '../screens/enhanced_route_plan_screen.dart';
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
  final Map<String, bool> _visitStatus = {};
  bool _isIntroductionExpanded = false;

  @override
  void initState() {
    super.initState();
    _currentTripPlan = widget.tripPlan;
    _loadVisitStatus();
    _loadEnhancedIntroduction();
    // Refresh AFTER loading initial status
    Future.microtask(() => _refreshTripPlan());
  }
  
  void _loadVisitStatus() {
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        _visitStatus[activity.activityTitle] = activity.isVisited;
      }
    }
  }

  Future<void> _refreshTripPlan() async {
    final tripId = widget.tripPlan.id;
    
    // Load from LOCAL storage only
    final storageService = StorageService();
    final localTrips = await storageService.getTripPlans();
    
    TripPlan? latestTrip;
    
    try {
      latestTrip = localTrips.firstWhere((trip) => trip.id == tripId);
      print('✅ Found trip plan in storage: ${latestTrip.tripTitle}');
    } catch (e) {
      try {
        final localItineraries = await storageService.getItineraries();
        final itinerary = localItineraries.firstWhere((it) => it.id == tripId);
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
        print('✅ Found itinerary in storage: ${latestTrip.tripTitle}');
      } catch (e2) {
        latestTrip = _currentTripPlan ?? widget.tripPlan;
        print('⚠️ Using current trip plan as fallback');
      }
    }
    
    if (mounted) {
      setState(() {
        _currentTripPlan = latestTrip;
        // DON'T clear - merge with existing status
        for (final day in latestTrip!.dailyPlans) {
          for (final activity in day.activities) {
            _visitStatus[activity.activityTitle] = activity.isVisited;
            print('🔄 Loaded visit status: ${activity.activityTitle} = ${activity.isVisited}');
          }
        }
      });
      print('✅ Refreshed trip plan with ${_visitStatus.length} activities');
    }
  }

  void _toggleVisitStatus(String activityTitle) async {
    if (_currentTripPlan == null) return;
    
    final currentStatus = _visitStatus[activityTitle] ?? false;
    final newStatus = !currentStatus;
    
    print('🔄 Toggling visit status for: $activityTitle');
    print('   Current: $currentStatus → New: $newStatus');
    
    // Find indices for saving
    int dayIndex = -1;
    int activityIndex = -1;
    
    for (int d = 0; d < _currentTripPlan!.dailyPlans.length; d++) {
      for (int a = 0; a < _currentTripPlan!.dailyPlans[d].activities.length; a++) {
        if (_currentTripPlan!.dailyPlans[d].activities[a].activityTitle == activityTitle) {
          dayIndex = d;
          activityIndex = a;
          break;
        }
      }
      if (dayIndex != -1) break;
    }
    
    if (dayIndex == -1 || activityIndex == -1) {
      print('❌ Activity not found in trip plan');
      return;
    }
    
    print('   Found at: Day $dayIndex, Activity $activityIndex');
    
    // Update UI immediately
    setState(() {
      _visitStatus[activityTitle] = newStatus;
    });
    
    // Save to storage
    final activity = _currentTripPlan!.dailyPlans[dayIndex].activities[activityIndex];
    final updatedActivity = activity.copyWith(
      isVisited: newStatus,
      visitedDate: newStatus ? DateTime.now().toIso8601String() : null,
    );
      
    final updatedActivities = List<ActivityDetail>.from(_currentTripPlan!.dailyPlans[dayIndex].activities);
    updatedActivities[activityIndex] = updatedActivity;
    
    final updatedDailyPlan = DailyTripPlan(
      day: _currentTripPlan!.dailyPlans[dayIndex].day,
      title: _currentTripPlan!.dailyPlans[dayIndex].title,
      theme: _currentTripPlan!.dailyPlans[dayIndex].theme,
      activities: updatedActivities,
      photoUrl: _currentTripPlan!.dailyPlans[dayIndex].photoUrl,
    );
    
    final updatedDailyPlans = List<DailyTripPlan>.from(_currentTripPlan!.dailyPlans);
    updatedDailyPlans[dayIndex] = updatedDailyPlan;
    
    _currentTripPlan = TripPlan(
      id: _currentTripPlan!.id,
      tripTitle: _currentTripPlan!.tripTitle,
      destination: _currentTripPlan!.destination,
      duration: _currentTripPlan!.duration,
      introduction: _currentTripPlan!.introduction,
      dailyPlans: updatedDailyPlans,
      conclusion: _currentTripPlan!.conclusion,
      accommodationSuggestions: _currentTripPlan!.accommodationSuggestions,
      transportationTips: _currentTripPlan!.transportationTips,
      budgetConsiderations: _currentTripPlan!.budgetConsiderations,
    );
    
    // Save to storage
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    final isItinerary = appProvider.itineraries.any((itinerary) => itinerary.id == _currentTripPlan!.id);
    
    print('💾 Saving to storage...');
    if (isItinerary) {
      await appProvider.updateItineraryActivityVisitedStatus(_currentTripPlan!.id, activityIndex, newStatus);
      print('✅ Saved to itinerary storage');
    } else {
      await appProvider.updateActivityVisitedStatus(_currentTripPlan!.id, dayIndex, activityIndex, newStatus);
      print('✅ Saved to trip plan storage');
    }
    
    // Show feedback
    final allActivitiesCount = _currentTripPlan!.dailyPlans.fold<int>(0, (sum, day) => sum + day.activities.length);
    final newVisitedCount = _visitStatus.values.where((v) => v).length;
    final completionPercent = allActivitiesCount > 0 ? ((newVisitedCount / allActivitiesCount) * 100).toInt() : 0;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(newStatus ? '✅ Visited! $completionPercent%' : '⏳ Pending'),
        backgroundColor: newStatus ? Colors.green : Colors.blue,
        duration: const Duration(seconds: 1),
      ),
    );
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
    // Use _visitStatus map as source of truth for UI state
    final visitedCount = allActivities.where((activity) => 
      _visitStatus[activity.activityTitle] ?? activity.isVisited
    ).length;
    final pendingCount = totalPlaces - visitedCount;
    
    print('📊 STATS DEBUG: Total: $totalPlaces, Visited: $visitedCount, Pending: $pendingCount');
    for (final activity in allActivities) {
      final status = _visitStatus[activity.activityTitle] ?? activity.isVisited;
      print('   Stats activity: ${activity.activityTitle} - status: $status (stored: ${activity.isVisited})');
    }
    
    // Calculate total trip distance (start to end)
    double totalTripDistance = 0;
    if (allActivities.length >= 2) {
      final startActivity = allActivities.first;
      final endActivity = allActivities.last;
      
      final startLat = _extractLatitude(startActivity);
      final startLng = _extractLongitude(startActivity);
      final endLat = _extractLatitude(endActivity);
      final endLng = _extractLongitude(endActivity);
      
      if (startLat != null && startLng != null && endLat != null && endLng != null) {
        totalTripDistance = _calculateDistanceInKm(startLat, startLng, endLat, endLng);
        print('🗺️ Total trip distance (start to end): ${totalTripDistance.toStringAsFixed(1)}km');
      }
    }
    
    // Calculate total and pending time
    int totalMinutes = 0;
    int pendingMinutes = 0;
    bool hasRealTimeData = false;
    
    for (final activity in allActivities) {
      int minutes = 0;
      
      // Try estimatedVisitDurationMin first (most accurate)
      if (activity.estimatedVisitDurationMin > 0) {
        minutes = activity.estimatedVisitDurationMin;
        hasRealTimeData = true;
      } else {
        // Parse duration string - handles "2hr", "2h", "90min", "1.5h", "2-3h"
        final duration = activity.duration.toLowerCase();
        if (duration.contains('hr') || duration.contains('h')) {
          final match = RegExp(r'(\d+\.?\d*)').firstMatch(duration);
          if (match != null) {
            minutes = (double.parse(match.group(1)!) * 60).toInt();
            hasRealTimeData = true;
          }
        } else if (duration.contains('min')) {
          final match = RegExp(r'(\d+)').firstMatch(duration);
          if (match != null) {
            minutes = int.parse(match.group(1)!);
            hasRealTimeData = true;
          }
        }
      }
      
      totalMinutes += minutes;
      
      if (!(_visitStatus[activity.activityTitle] ?? activity.isVisited)) {
        pendingMinutes += minutes;
      }
    }
    
    final totalHours = (totalMinutes / 60).ceil();
    final pendingHours = (pendingMinutes / 60).ceil();
    
    // Calculate total and pending distance
    double totalKm = 0;
    double pendingKm = 0;
    bool hasRealDistanceData = false;
    
    // Calculate distance between consecutive activities
    ActivityDetail? previousActivity;
    for (final activity in allActivities) {
      double km = 0;
      
      // If we have coordinates, calculate real distance from previous activity
      if (previousActivity != null) {
        final prevLat = _extractLatitude(previousActivity);
        final prevLng = _extractLongitude(previousActivity);
        final currLat = _extractLatitude(activity);
        final currLng = _extractLongitude(activity);
        
        if (prevLat != null && prevLng != null && currLat != null && currLng != null) {
          km = _calculateDistanceInKm(prevLat, prevLng, currLat, currLng);
          hasRealDistanceData = true;
        }
      }
      
      // Fallback: check if activity has distance data
      if (km == 0 && activity.estimatedDuration != null && activity.estimatedDuration!.contains('km')) {
        final match = RegExp(r'(\d+\.?\d*)').firstMatch(activity.estimatedDuration!);
        if (match != null) {
          km = double.parse(match.group(1)!);
          hasRealDistanceData = true;
        }
      } else if (km == 0 && activity.travelTimeMin > 0) {
        // Calculate: walking speed ~5km/h
        km = (activity.travelTimeMin / 60) * 5;
        hasRealDistanceData = true;
      }
      
      totalKm += km;
      
      if (!(_visitStatus[activity.activityTitle] ?? activity.isVisited)) {
        pendingKm += km;
      }
      
      previousActivity = activity;
    }
    
    // If no real data, estimate: ~1.5km between activities
    if (!hasRealDistanceData && allActivities.length > 1) {
      totalKm = (allActivities.length - 1) * 1.5;
      pendingKm = (pendingCount > 0 ? pendingCount - 1 : 0) * 1.5;
      hasRealDistanceData = true; // We have an estimate
    }
    
    final totalKmStr = totalKm > 0 
        ? '${totalKm.toStringAsFixed(1)}km' 
        : '0km';
    final pendingKmStr = pendingKm > 0 
        ? '${pendingKm.toStringAsFixed(1)}km' 
        : '0km';
    
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
                const Spacer(),
                Text(
                  '${((visitedCount / totalPlaces) * 100).toInt()}%',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: visitedCount == totalPlaces ? Colors.green : Colors.purple,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: totalPlaces > 0 ? visitedCount / totalPlaces : 0,
                minHeight: 8,
                backgroundColor: Colors.grey[200],
                valueColor: AlwaysStoppedAnimation<Color>(
                  visitedCount == totalPlaces ? Colors.green : Colors.purple,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              visitedCount == totalPlaces 
                  ? '🎉 Trip Complete! Amazing journey!' 
                  : '$visitedCount of $totalPlaces places visited',
              style: TextStyle(
                fontSize: 12,
                color: visitedCount == totalPlaces ? Colors.green : Colors.grey[600],
                fontWeight: visitedCount == totalPlaces ? FontWeight.bold : FontWeight.normal,
              ),
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
                    '$totalKmStr / $pendingKmStr',
                    'Total / Pending KM',
                    Icons.directions_walk,
                    Colors.indigo,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    hasRealTimeData ? '${totalHours}h / ${pendingHours}h' : '${totalPlaces}h / ${pendingCount}h',
                    'Total / Pending Time',
                    Icons.schedule,
                    Colors.teal,
                  ),
                ),
              ],
            ),
            if (totalTripDistance > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.route, color: Colors.blue[700], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Trip Distance (Start to End): ',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[700],
                      ),
                    ),
                    Text(
                      '${totalTripDistance.toStringAsFixed(1)}km',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[700],
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
            icon: const Icon(Icons.save),
            onPressed: _saveProgress,
            tooltip: 'Save Progress',
          ),
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
            
            // Trip Summary Card
            Card(
              elevation: 2,
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.blue[50]!, Colors.cyan[50]!],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.assessment, color: Colors.blue, size: 20),
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Trip Summary',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildSummaryItem(
                              Icons.directions_walk,
                              _calculateTotalDistance(),
                              'Walking',
                              Colors.blue,
                            ),
                            Container(
                              width: 1,
                              height: 50,
                              color: Colors.grey[300],
                            ),
                            _buildSummaryItem(
                              Icons.schedule,
                              _calculateTotalTime(),
                              'Duration',
                              Colors.orange,
                            ),
                            Container(
                              width: 1,
                              height: 50,
                              color: Colors.grey[300],
                            ),
                            _buildSummaryItem(
                              Icons.payments,
                              _calculateTotalCost(),
                              'Budget',
                              Colors.green,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
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
            Row(
              children: [
                Text(
                  'Day $dayNumber',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => _showAddPlaceDialog(dayNumber - 1),
                  icon: const Icon(Icons.add_location_alt, size: 20),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.blue[50],
                    foregroundColor: Colors.blue[700],
                    padding: const EdgeInsets.all(8),
                  ),
                  tooltip: 'Add Place',
                ),
              ],
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
                        activity.startTime.isNotEmpty ? activity.startTime : activity.timeOfDay,
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
    final isVisited = _visitStatus[activity.activityTitle] ?? activity.isVisited;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (activity.description.isNotEmpty) ...[
          Text(
            activity.description,
            style: TextStyle(
              fontSize: 14,
              color: isVisited ? Colors.grey[600] : Colors.black87,
              decoration: isVisited ? TextDecoration.lineThrough : null,
            ),
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
        if (isVisited && activity.visitedDate != null) ...[
          const SizedBox(height: 4),
          Text(
            'Visited on ${_formatVisitedDate(activity.visitedDate!)}',
            style: TextStyle(
              fontSize: 11,
              color: Colors.green[700],
              fontStyle: FontStyle.italic,
            ),
          ),
        ],
        const SizedBox(height: 12),
        // Action Buttons Row
        Row(
          children: [
            // Visit Status Checkbox
            Expanded(
              child: InkWell(
                onTap: () => _toggleVisitStatus(activity.activityTitle),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isVisited ? Colors.green[50] : Colors.blue[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isVisited ? Colors.green : Colors.blue[300]!,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isVisited ? Icons.check_circle : Icons.radio_button_unchecked,
                        color: isVisited ? Colors.green : Colors.blue[700],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          isVisited ? '✓ Visited' : 'Mark visited',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: isVisited ? Colors.green[700] : Colors.blue[700],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Place Details Button
            IconButton(
              onPressed: () => _showPlaceDetails(activity),
              icon: const Icon(Icons.info_outline, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: Colors.blue[50],
                foregroundColor: Colors.blue[700],
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Details',
            ),
            const SizedBox(width: 4),
            // Remove Button
            IconButton(
              onPressed: () => _confirmRemoveActivity(activity),
              icon: const Icon(Icons.delete_outline, size: 18),
              style: IconButton.styleFrom(
                backgroundColor: Colors.red[50],
                foregroundColor: Colors.red,
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Remove',
            ),
          ],
        ),
      ],
    );
  }

  String _formatVisitedDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inDays == 0) return 'today';
      if (diff.inDays == 1) return 'yesterday';
      if (diff.inDays < 7) return '${diff.inDays} days ago';
      
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return '';
    }
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
      elevation: 2,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.blue[50]!, Colors.purple[50]!],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.auto_awesome, color: Colors.purple, size: 20),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AI Trip Overview',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Powered by Azure OpenAI',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.purple,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  if (_isLoadingIntroduction)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.purple),
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'Generating...',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.purple,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: _isLoadingIntroduction
                    ? Column(
                        children: [
                          const SizedBox(height: 8),
                          Icon(Icons.psychology, size: 48, color: Colors.purple[200]),
                          const SizedBox(height: 12),
                          Text(
                            'AI is crafting your personalized trip overview...',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _enhancedIntroduction != null
                              ? _buildCollapsibleText(_enhancedIntroduction!)
                              : widget.tripPlan.introduction.isNotEmpty
                                  ? _buildCollapsibleText(widget.tripPlan.introduction)
                                  : Text(
                                      'Discover ${widget.tripPlan.destination} with this carefully crafted ${widget.tripPlan.duration} itinerary.',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontStyle: FontStyle.italic,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                        ],
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCollapsibleText(String text) {
    final lines = text.split('\n');
    final shouldCollapse = lines.length > 5 || text.length > 300;
    
    if (!shouldCollapse) {
      return _buildFormattedText(text);
    }
    
    final displayText = _isIntroductionExpanded 
        ? text 
        : lines.take(3).join('\n') + '...';
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildFormattedText(displayText),
        const SizedBox(height: 8),
        InkWell(
          onTap: () {
            setState(() {
              _isIntroductionExpanded = !_isIntroductionExpanded;
            });
          },
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _isIntroductionExpanded ? 'Show Less' : 'Read More',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.purple[700],
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(
                _isIntroductionExpanded ? Icons.expand_less : Icons.expand_more,
                color: Colors.purple[700],
                size: 18,
              ),
            ],
          ),
        ),
      ],
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
    // Try trip-level data first
    if (widget.tripPlan.estimatedWalkingDistance.isNotEmpty && 
        widget.tripPlan.estimatedWalkingDistance != '0 km') {
      return widget.tripPlan.estimatedWalkingDistance;
    }
    
    // Calculate from activities with real coordinates
    double totalKm = 0;
    ActivityDetail? previousActivity;
    
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        if (previousActivity != null) {
          final prevLat = _extractLatitude(previousActivity);
          final prevLng = _extractLongitude(previousActivity);
          final currLat = _extractLatitude(activity);
          final currLng = _extractLongitude(activity);
          
          if (prevLat != null && prevLng != null && currLat != null && currLng != null) {
            totalKm += _calculateDistanceInKm(prevLat, prevLng, currLat, currLng);
          }
        }
        previousActivity = activity;
      }
    }
    
    if (totalKm > 0) {
      return '${totalKm.toStringAsFixed(1)} km';
    }
    
    return 'N/A';
  }

  String _calculateTotalTime() {
    int totalMinutes = 0;
    
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        // Use estimatedVisitDurationMin if available (most accurate)
        if (activity.estimatedVisitDurationMin > 0) {
          totalMinutes += activity.estimatedVisitDurationMin;
          continue;
        }
        
        // Parse duration string
        final duration = activity.duration.toLowerCase();
        if (duration.contains('hr') || duration.contains('h')) {
          final match = RegExp(r'(\d+\.?\d*)').firstMatch(duration);
          if (match != null) {
            totalMinutes += (double.parse(match.group(1)!) * 60).toInt();
          }
        } else if (duration.contains('min')) {
          final match = RegExp(r'(\d+)').firstMatch(duration);
          if (match != null) {
            totalMinutes += int.parse(match.group(1)!);
          }
        }
      }
    }
    
    if (totalMinutes > 0) {
      final hours = totalMinutes ~/ 60;
      final mins = totalMinutes % 60;
      return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
    }
    
    return 'N/A';
  }

  String _calculateTotalCost() {
    // Try trip-level data first
    if (widget.tripPlan.totalEstimatedCost.isNotEmpty && 
        widget.tripPlan.totalEstimatedCost != '€0') {
      return widget.tripPlan.totalEstimatedCost;
    }
    
    // Calculate from activities
    double totalCost = 0;
    String? currency;
    
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        final cost = activity.estimatedCost;
        
        // Parse LKR
        if (cost.contains('LKR')) {
          final match = RegExp(r'LKR\s*(\d+\.?\d*)').firstMatch(cost);
          if (match != null) {
            totalCost += double.parse(match.group(1)!);
            currency = 'LKR';
          }
        }
        // Parse EUR/€
        else if (cost.contains('€') || cost.contains('EUR')) {
          final match = RegExp(r'[€EUR]\s*(\d+\.?\d*)').firstMatch(cost);
          if (match != null) {
            totalCost += double.parse(match.group(1)!);
            currency = '€';
          }
        }
        // Parse USD/$
        else if (cost.contains(r'$') || cost.contains('USD')) {
          final match = RegExp(r'[\$USD]\s*(\d+\.?\d*)').firstMatch(cost);
          if (match != null) {
            totalCost += double.parse(match.group(1)!);
            currency = r'$';
          }
        }
      }
    }
    
    if (totalCost > 0 && currency != null) {
      return '$currency ${totalCost.toStringAsFixed(0)}';
    }
    
    return 'N/A';
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

  void _openRouteWithPreferences(RoutePreferences preferences) async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text('Getting coordinates with AI...'),
              ],
            ),
          ),
        ),
      ),
    );
    
    // Collect all activities
    final allActivities = <ActivityDetail>[];
    for (final day in (_currentTripPlan ?? widget.tripPlan).dailyPlans) {
      allActivities.addAll(day.activities);
    }
    
    // Use Azure OpenAI to get ALL coordinates at once
    final places = await _getCoordinatesWithAI(allActivities);
    
    // Close loading
    if (mounted) Navigator.pop(context);
    
    print('🗺️ Created ${places.length} places with coordinates');
    
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('❌ Could not get coordinates for any activities'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }
    
    if (places.length < allActivities.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚠️ Got coordinates for ${places.length} of ${allActivities.length} activities'),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 3),
        ),
      );
    }

    // Determine start location
    Position startLocation;
    if (preferences.startFromCurrentLocation) {
      if (appProvider.currentLocation == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location not available. Please enable location services.'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
      startLocation = appProvider.currentLocation!;
    } else {
      // Use first trip location as start point
      final firstPlace = places.first;
      startLocation = Position(
        latitude: firstPlace.latitude!,
        longitude: firstPlace.longitude!,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SmartRouteListScreen(
          currentLocation: startLocation,
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

  double? _extractLatitude(ActivityDetail activity) {
    // Try location field (format: "lat,lng")
    if (activity.location != null && activity.location!.contains(',')) {
      final parts = activity.location!.split(',');
      if (parts.length == 2) {
        return double.tryParse(parts[0].trim());
      }
    }
    return null;
  }
  
  double? _extractLongitude(ActivityDetail activity) {
    // Try location field (format: "lat,lng")
    if (activity.location != null && activity.location!.contains(',')) {
      final parts = activity.location!.split(',');
      if (parts.length == 2) {
        return double.tryParse(parts[1].trim());
      }
    }
    return null;
  }
  
  double _calculateDistanceInKm(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371; // km
    final dLat = _toRadians(lat2 - lat1);
    final dLon = _toRadians(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
        sin(dLon / 2) * sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return earthRadius * c;
  }
  
  double _toRadians(double degrees) => degrees * pi / 180;

  Future<Map<String, double>?> _getCoordinatesFromPlaceId(String placeId) async {
    try {
      // Use your API service to get place details
      final apiService = ApiService();
      final place = await apiService.getPlaceDetails(placeId);
      if (place != null && place.latitude != null && place.longitude != null) {
        return {'lat': place.latitude!, 'lng': place.longitude!};
      }
    } catch (e) {
      print('❌ Error getting coordinates from place ID: $e');
    }
    return null;
  }
  
  Future<Map<String, double>?> _geocodeAddress(String address) async {
    try {
      // Simple geocoding using nominatim (free, no API key needed)
      final uri = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(address)}&format=json&limit=1');
      final response = await http.get(uri, headers: {'User-Agent': 'TravelBuddy'});
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) {
          return {
            'lat': double.parse(data[0]['lat']),
            'lng': double.parse(data[0]['lon']),
          };
        }
      }
    } catch (e) {
      print('❌ Error geocoding address: $e');
    }
    return null;
  }
  
  String _extractPlaceName(String activityTitle) {
    String cleaned = activityTitle
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll(RegExp(r'^(Visit|Explore|Walk|Climb|Train to|Chill at|Stroll|Train|Walk the|Scenic|Private|Fine Dining|Sunset|Breakfast|Lunch|Dinner)\s+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+(Beach|Town|Fort|Market|Dinner|Lunch|Street Food|Local|Eats|Café|Tasting|Tour|Bike|Hike|Falls|Ride|Walk|Show|Cocktail)\s*$', caseSensitive: false), '')
        .replaceAll(RegExp(r'[🍽️☕🏛️🌳🛍️🍸🏯🏖️📍]'), '')
        .replaceAll(RegExp(r'\s*\([^)]*\)'), '')  // Remove parentheses content
        .replaceAll(RegExp(r'\s+(at|near|in|overlooking|or similar)\s+.*', caseSensitive: false), '')  // Remove location descriptors
        .trim();
    
    final parts = cleaned.split(RegExp(r'\s*(&|and|,)\s*'));
    if (parts.isNotEmpty && parts[0].trim().isNotEmpty) {
      cleaned = parts[0].trim();
    }
    
    // If still empty or too short, try to extract key location name
    if (cleaned.isEmpty || cleaned.length < 3) {
      // Look for capitalized words that might be place names
      final matches = RegExp(r'[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*').allMatches(activityTitle);
      if (matches.isNotEmpty) {
        cleaned = matches.first.group(0) ?? activityTitle;
      } else {
        cleaned = activityTitle;
      }
    }
    
    return cleaned;
  }
  
  Future<Map<String, double>?> _searchPlaceByName(String name) async {
    try {
      await Future.delayed(Duration(milliseconds: 1000));
      final destination = (_currentTripPlan ?? widget.tripPlan).destination;
      final searchQuery = '$name, $destination';
      final uri = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(searchQuery)}&format=json&limit=1');
      final response = await http.get(uri, headers: {'User-Agent': 'TravelBuddy'});
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty) {
          return {
            'lat': double.parse(data[0]['lat']),
            'lng': double.parse(data[0]['lon']),
          };
        }
      }
    } catch (e) {
      print('❌ Geocode error for $name: $e');
    }
    return null;
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

  Future<void> _saveProgress() async {
    if (_currentTripPlan == null) return;
    
    try {
      // Update all activities with current visit status
      final updatedDailyPlans = <DailyTripPlan>[];
      
      for (final day in _currentTripPlan!.dailyPlans) {
        final updatedActivities = <ActivityDetail>[];
        
        for (final activity in day.activities) {
          final currentStatus = _visitStatus[activity.activityTitle] ?? activity.isVisited;
          updatedActivities.add(activity.copyWith(
            isVisited: currentStatus,
            visitedDate: currentStatus && activity.visitedDate == null 
                ? DateTime.now().toIso8601String() 
                : activity.visitedDate,
          ));
        }
        
        updatedDailyPlans.add(DailyTripPlan(
          day: day.day,
          title: day.title,
          theme: day.theme,
          activities: updatedActivities,
          photoUrl: day.photoUrl,
        ));
      }
      
      final updatedTrip = TripPlan(
        id: _currentTripPlan!.id,
        tripTitle: _currentTripPlan!.tripTitle,
        destination: _currentTripPlan!.destination,
        duration: _currentTripPlan!.duration,
        introduction: _currentTripPlan!.introduction,
        dailyPlans: updatedDailyPlans,
        conclusion: _currentTripPlan!.conclusion,
        accommodationSuggestions: _currentTripPlan!.accommodationSuggestions,
        transportationTips: _currentTripPlan!.transportationTips,
        budgetConsiderations: _currentTripPlan!.budgetConsiderations,
      );
      
      // Save to storage
      final storageService = StorageService();
      await storageService.saveTripPlan(updatedTrip);
      
      setState(() {
        _currentTripPlan = updatedTrip;
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('💾 Progress saved successfully!'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to save: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showAddPlaceDialog(int dayIndex) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Add Place to Day ${dayIndex + 1}',
                  style: const TextStyle(
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
            ListTile(
              leading: const Icon(Icons.edit, color: Colors.green),
              title: const Text('Add Custom Activity'),
              subtitle: const Text('Create a custom place or activity'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () {
                Navigator.pop(context);
                _showCustomActivityDialog(dayIndex);
              },
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
          ],
        ),
      ),
    );
  }

  void _showCustomActivityDialog(int dayIndex) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final timeController = TextEditingController(text: '09:00');
    final durationController = TextEditingController(text: '1h');
    final costController = TextEditingController(text: '0');
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Custom Activity'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Activity Name *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: timeController,
                      decoration: const InputDecoration(
                        labelText: 'Time',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: durationController,
                      decoration: const InputDecoration(
                        labelText: 'Duration',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: costController,
                decoration: const InputDecoration(
                  labelText: 'Estimated Cost',
                  border: OutlineInputBorder(),
                  prefixText: 'LKR ',
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (titleController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter activity name'),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }
              
              Navigator.pop(context);
              _addCustomActivity(
                dayIndex,
                titleController.text.trim(),
                descriptionController.text.trim(),
                timeController.text.trim(),
                durationController.text.trim(),
                costController.text.trim(),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _addCustomActivity(
    int dayIndex,
    String title,
    String description,
    String time,
    String duration,
    String cost,
  ) async {
    if (_currentTripPlan == null) return;
    
    final newActivity = ActivityDetail(
      timeOfDay: time,
      activityTitle: title,
      description: description.isEmpty ? 'Custom activity' : description,
      startTime: time,
      duration: duration,
      estimatedCost: 'LKR $cost',
    );
    
    final updatedActivities = List<ActivityDetail>.from(
      _currentTripPlan!.dailyPlans[dayIndex].activities,
    )..add(newActivity);
    
    final updatedDailyPlan = DailyTripPlan(
      day: _currentTripPlan!.dailyPlans[dayIndex].day,
      title: _currentTripPlan!.dailyPlans[dayIndex].title,
      theme: _currentTripPlan!.dailyPlans[dayIndex].theme,
      activities: updatedActivities,
      photoUrl: _currentTripPlan!.dailyPlans[dayIndex].photoUrl,
    );
    
    final updatedDailyPlans = List<DailyTripPlan>.from(_currentTripPlan!.dailyPlans);
    updatedDailyPlans[dayIndex] = updatedDailyPlan;
    
    _currentTripPlan = TripPlan(
      id: _currentTripPlan!.id,
      tripTitle: _currentTripPlan!.tripTitle,
      destination: _currentTripPlan!.destination,
      duration: _currentTripPlan!.duration,
      introduction: _currentTripPlan!.introduction,
      dailyPlans: updatedDailyPlans,
      conclusion: _currentTripPlan!.conclusion,
      accommodationSuggestions: _currentTripPlan!.accommodationSuggestions,
      transportationTips: _currentTripPlan!.transportationTips,
      budgetConsiderations: _currentTripPlan!.budgetConsiderations,
    );
    
    final storageService = StorageService();
    await storageService.saveTripPlan(_currentTripPlan!);
    
    setState(() {});
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Added "$title" to Day ${dayIndex + 1}'),
        backgroundColor: Colors.green,
      ),
    );
  }

  Future<List<Place>> _getCoordinatesWithAI(List<ActivityDetail> activities) async {
    try {
      final destination = (_currentTripPlan ?? widget.tripPlan).destination;
      
      // Build request for backend
      final activitiesData = activities.map((a) => {
        'title': a.activityTitle,
        'address': a.fullAddress,
      }).toList();
      
      print('🤖 Requesting coordinates from backend AI...');
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/ai/coordinates'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'activities': activitiesData,
          'destination': destination,
        }),
      );
      
      if (response.statusCode != 200) {
        print('❌ Backend error: ${response.statusCode}');
        return _fallbackCoordinateResolution(activities);
      }
      
      final data = json.decode(response.body);
      
      if (!data['success'] || data['coordinates'] == null) {
        print('❌ No coordinates from backend');
        return _fallbackCoordinateResolution(activities);
      }
      
      final List<dynamic> coordsList = data['coordinates'];
      print('✅ Backend returned ${coordsList.length} coordinates');
      
      final places = <Place>[];
      for (int i = 0; i < activities.length && i < coordsList.length; i++) {
        final activity = activities[i];
        final coords = coordsList[i];
        
        final lat = coords['lat'] is int ? (coords['lat'] as int).toDouble() : coords['lat'] as double;
        final lng = coords['lng'] is int ? (coords['lng'] as int).toDouble() : coords['lng'] as double;
        
        places.add(Place(
          id: activity.googlePlaceId ?? 'activity_${activity.activityTitle.hashCode}',
          name: activity.activityTitle,
          address: activity.fullAddress ?? activity.location ?? '',
          latitude: lat,
          longitude: lng,
          rating: activity.rating ?? 0.0,
          type: activity.category ?? 'attraction',
          photoUrl: activity.photoThumbnail ?? '',
          description: activity.description,
          localTip: activity.practicalTip ?? '',
          handyPhrase: '',
        ));
        
        print('✅ AI coords: ${activity.activityTitle} = $lat, $lng');
      }
      
      return places;
      
    } catch (e) {
      print('❌ AI coordinate error: $e');
      return _fallbackCoordinateResolution(activities);
    }
  }
  
  Future<List<Place>> _fallbackCoordinateResolution(List<ActivityDetail> activities) async {
    print('⚠️ Using fallback coordinate resolution');
    final places = <Place>[];
    
    for (final activity in activities) {
      double? lat;
      double? lng;
      
      if (activity.location != null && activity.location!.contains(',')) {
        final parts = activity.location!.split(',');
        if (parts.length == 2) {
          lat = double.tryParse(parts[0].trim());
          lng = double.tryParse(parts[1].trim());
        }
      }
      
      if (lat == null && activity.googlePlaceId != null && activity.googlePlaceId!.isNotEmpty) {
        final coords = await _getCoordinatesFromPlaceId(activity.googlePlaceId!);
        lat = coords?['lat'];
        lng = coords?['lng'];
      }
      
      if (lat == null && activity.fullAddress != null && activity.fullAddress!.isNotEmpty) {
        final coords = await _geocodeAddress(activity.fullAddress!);
        lat = coords?['lat'];
        lng = coords?['lng'];
      }
      
      if (lat == null) {
        final placeName = _extractPlaceName(activity.activityTitle);
        if (placeName.isNotEmpty && placeName.length >= 3) {
          final coords = await _searchPlaceByName(placeName);
          lat = coords?['lat'];
          lng = coords?['lng'];
        }
      }
      
      if (lat != null && lng != null) {
        places.add(Place(
          id: activity.googlePlaceId ?? 'activity_${activity.activityTitle.hashCode}',
          name: activity.activityTitle,
          address: activity.fullAddress ?? activity.location ?? '',
          latitude: lat,
          longitude: lng,
          rating: activity.rating ?? 0.0,
          type: activity.category ?? 'attraction',
          photoUrl: activity.photoThumbnail ?? '',
          description: activity.description,
          localTip: activity.practicalTip ?? '',
          handyPhrase: '',
        ));
      }
    }
    
    return places;
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
  bool _startFromCurrentLocation = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
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
          
          const SizedBox(height: 20),
          
          // Start Point
          const Text(
            'Start Point',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          _buildToggleOption(
            'Start from Current Location',
            'Begin route from where you are now',
            _startFromCurrentLocation,
            (value) => setState(() => _startFromCurrentLocation = value),
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
                  startFromCurrentLocation: _startFromCurrentLocation,
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