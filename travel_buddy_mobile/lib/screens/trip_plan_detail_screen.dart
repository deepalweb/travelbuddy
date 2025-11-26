import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/trip.dart';
import '../models/place.dart';
import '../services/azure_openai_service.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';
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

  @override
  void initState() {
    super.initState();
    _currentTripPlan = widget.tripPlan;
    _loadVisitStatus();
    // Load after build completes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _refreshTripPlan();
      _loadEnhancedIntroduction();
    });
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
      } catch (e2) {
        latestTrip = _currentTripPlan ?? widget.tripPlan;
      }
    }
    
    if (mounted) {
      setState(() {
        _currentTripPlan = latestTrip;
        // Update visit status map from loaded data
        _visitStatus.clear();
        for (final day in latestTrip!.dailyPlans) {
          for (final activity in day.activities) {
            _visitStatus[activity.activityTitle] = activity.isVisited;
          }
        }
      });
    }
  }

  void _toggleVisitStatus(String activityTitle) async {
    if (_currentTripPlan == null) return;
    
    final currentStatus = _visitStatus[activityTitle] ?? false;
    final newStatus = !currentStatus;
    
    // Update UI immediately
    setState(() {
      _visitStatus[activityTitle] = newStatus;
    });
    
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
    
    if (dayIndex != -1 && activityIndex != -1) {
      
      // Save to storage
      final activity = _currentTripPlan!.dailyPlans[dayIndex].activities[activityIndex];
        final updatedActivity = ActivityDetail(
          timeOfDay: activity.timeOfDay,
          activityTitle: activity.activityTitle,
          description: activity.description,
          estimatedDuration: activity.estimatedDuration,
          location: activity.location,
          notes: activity.notes,
          icon: activity.icon,
          category: activity.category,
          startTime: activity.startTime,
          endTime: activity.endTime,
          duration: activity.duration,
          place: activity.place,
          type: activity.type,
          estimatedCost: activity.estimatedCost,
          costBreakdown: activity.costBreakdown,
          transportFromPrev: activity.transportFromPrev,
          tips: activity.tips,
          weatherBackup: activity.weatherBackup,
          crowdLevel: activity.crowdLevel,
          imageURL: activity.imageURL,
          bookingLinks: activity.bookingLinks,
          googlePlaceId: activity.googlePlaceId,
          highlight: activity.highlight,
          socialProof: activity.socialProof,
          rating: activity.rating,
          userRatingsTotal: activity.userRatingsTotal,
          practicalTip: activity.practicalTip,
          travelMode: activity.travelMode,
          travelTimeMin: activity.travelTimeMin,
          estimatedVisitDurationMin: activity.estimatedVisitDurationMin,
          photoThumbnail: activity.photoThumbnail,
          fullAddress: activity.fullAddress,
          openingHours: activity.openingHours,
          isOpenNow: activity.isOpenNow,
          weatherNote: activity.weatherNote,
          tags: activity.tags,
          bookingLink: activity.bookingLink,
          isVisited: newStatus,
          visitedDate: newStatus ? DateTime.now().toIso8601String() : activity.visitedDate,
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
      
      if (isItinerary) {
        await appProvider.updateItineraryActivityVisitedStatus(_currentTripPlan!.id, activityIndex, newStatus);
        print('✅ Saved to itinerary storage');
      } else {
        await appProvider.updateActivityVisitedStatus(_currentTripPlan!.id, dayIndex, activityIndex, newStatus);
        print('✅ Saved to trip plan storage');
      }
      
      // Verify save worked
      await Future.delayed(Duration(milliseconds: 100));
      await appProvider.loadTripPlans();
      final verified = appProvider.tripPlans.firstWhere((t) => t.id == _currentTripPlan!.id, orElse: () => _currentTripPlan!);
      final verifiedStatus = verified.dailyPlans[dayIndex].activities[activityIndex].isVisited;
      print('🔍 Verified in storage: $verifiedStatus (expected: $newStatus)');
      
      // Show feedback
      final allActivitiesCount = _currentTripPlan!.dailyPlans.fold<int>(0, (sum, day) => sum + day.activities.length);
      final newVisitedCount = _currentTripPlan!.dailyPlans.fold<int>(0, (sum, day) => sum + day.activities.where((a) => a.isVisited).length);
      final completionPercent = allActivitiesCount > 0 ? ((newVisitedCount / allActivitiesCount) * 100).toInt() : 0;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newStatus ? '✅ Visited! $completionPercent%' : '⏳ Pending'),
          backgroundColor: newStatus ? Colors.green : Colors.blue,
          duration: const Duration(seconds: 1),
        ),
      );
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
    int totalMinutes = 0;
    int pendingMinutes = 0;
    
    for (final activity in allActivities) {
      int minutes = 0;
      
      // Try estimatedVisitDurationMin first (most accurate)
      if (activity.estimatedVisitDurationMin > 0) {
        minutes = activity.estimatedVisitDurationMin;
      } else {
        // Parse duration string - handles "2hr", "2h", "90min", "1.5h", "2-3h"
        final duration = activity.duration.toLowerCase();
        if (duration.contains('hr') || duration.contains('h')) {
          final match = RegExp(r'(\d+\.?\d*)').firstMatch(duration);
          if (match != null) {
            minutes = (double.parse(match.group(1)!) * 60).toInt();
          }
        } else if (duration.contains('min')) {
          final match = RegExp(r'(\d+)').firstMatch(duration);
          if (match != null) {
            minutes = int.parse(match.group(1)!);
          }
        }
        
        // Default to 60 minutes if no valid duration found
        if (minutes == 0) {
          minutes = 60;
        }
      }
      
      totalMinutes += minutes;
      
      if (!activity.isVisited) {
        pendingMinutes += minutes;
      }
    }
    
    final totalHours = (totalMinutes / 60).ceil();
    final pendingHours = (pendingMinutes / 60).ceil();
    
    // Calculate total and pending distance (use real data if available)
    double totalKm = 0;
    double pendingKm = 0;
    
    for (final activity in allActivities) {
      // Try to parse estimatedDuration or use travelTimeMin
      double km = 0;
      
      if (activity.estimatedDuration != null && activity.estimatedDuration!.contains('km')) {
        final match = RegExp(r'(\d+\.?\d*)').firstMatch(activity.estimatedDuration!);
        if (match != null) {
          km = double.parse(match.group(1)!);
        }
      } else if (activity.travelTimeMin > 0) {
        // Estimate: walking speed ~5km/h, so km = (minutes / 60) * 5
        km = (activity.travelTimeMin / 60) * 5;
      } else {
        // Fallback: 1km average per place
        km = 1.0;
      }
      
      totalKm += km;
      
      if (!activity.isVisited) {
        pendingKm += km;
      }
    }
    
    final totalKmStr = totalKm > 0 ? '${totalKm.toStringAsFixed(1)}km' : '${totalPlaces}km';
    final pendingKmStr = pendingKm > 0 ? '${pendingKm.toStringAsFixed(1)}km' : '${pendingCount}km';
    
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
    final isVisited = _visitStatus[activity.activityTitle] ?? false;
    
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
            // Visit Status Checkbox
            Expanded(
              child: InkWell(
                onTap: () => _toggleVisitStatus(activity.activityTitle),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isVisited ? Colors.green[50] : Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isVisited ? Colors.green : Colors.grey[300]!,
                      width: 1.5,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isVisited ? Icons.check_box : Icons.check_box_outline_blank,
                        color: isVisited ? Colors.green : Colors.grey[600],
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isVisited ? 'Visited' : 'Mark as visited',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isVisited ? Colors.green[700] : Colors.grey[700],
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
              icon: const Icon(Icons.place, size: 16),
              style: IconButton.styleFrom(
                backgroundColor: Colors.green[50],
                foregroundColor: Colors.green,
                padding: const EdgeInsets.all(8),
              ),
              tooltip: 'Place details',
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
                    : _enhancedIntroduction != null
                        ? _buildFormattedText(_enhancedIntroduction!)
                        : widget.tripPlan.introduction.isNotEmpty
                            ? Text(
                                widget.tripPlan.introduction,
                                style: const TextStyle(fontSize: 14, height: 1.5),
                              )
                            : Text(
                                'Discover ${widget.tripPlan.destination} with this carefully crafted ${widget.tripPlan.duration} itinerary.',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontStyle: FontStyle.italic,
                                  color: Colors.grey[700],
                                ),
                              ),
              ),
            ],
          ),
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
                Text('Getting real coordinates...'),
              ],
            ),
          ),
        ),
      ),
    );
    
    // Convert trip activities to places with REAL coordinates
    final places = <Place>[];
    for (final day in (_currentTripPlan ?? widget.tripPlan).dailyPlans) {
      for (final activity in day.activities) {
        double? lat;
        double? lng;
        
        // Try backend coordinates first (from activity.location if it contains lat,lng)
        if (activity.location != null && activity.location!.contains(',')) {
          final parts = activity.location!.split(',');
          if (parts.length == 2) {
            lat = double.tryParse(parts[0].trim());
            lng = double.tryParse(parts[1].trim());
            if (lat != null && lng != null) {
              print('✅ Backend coords: ${activity.activityTitle} = $lat, $lng');
            }
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
          if (placeName.isNotEmpty) {
            final coords = await _searchPlaceByName(placeName);
            lat = coords?['lat'];
            lng = coords?['lng'];
          }
        }
        
        if (lat == null || lng == null) {
          print('! No coords: ${activity.activityTitle}');
          continue;
        }
        
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
    
    // Close loading
    if (mounted) Navigator.pop(context);
    
    print('🗺️ Created ${places.length} places with real coordinates');
    
    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places found to plan route'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
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
        .replaceAll(RegExp(r'^(Visit|Explore|Walk|Climb|Train to|Chill at|Stroll|Train|Walk the|Scenic)\s+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+(Beach|Town|Fort|Market|Dinner|Lunch|Street Food|Local|Eats|Café|Tasting|Tour|Bike|Hike|Falls|Ride|Walk)\s*$', caseSensitive: false), '')
        .replaceAll(RegExp(r'[🍽️☕🏛️🌳🛍️🍸🏯🏖️📍]'), '')
        .trim();
    
    final parts = cleaned.split(RegExp(r'\s*(&|and|,)\s*'));
    if (parts.isNotEmpty && parts[0].trim().isNotEmpty) {
      cleaned = parts[0].trim();
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