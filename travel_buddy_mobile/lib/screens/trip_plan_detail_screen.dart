import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/trip.dart';
import '../services/azure_openai_service.dart';

class TripPlanDetailScreen extends StatefulWidget {
  final TripPlan tripPlan;

  const TripPlanDetailScreen({super.key, required this.tripPlan});

  @override
  State<TripPlanDetailScreen> createState() => _TripPlanDetailScreenState();
}

class _TripPlanDetailScreenState extends State<TripPlanDetailScreen> {
  String? _enhancedIntroduction;
  bool _isLoadingIntroduction = false;
  final Map<String, bool> _visitedActivities = {};

  @override
  void initState() {
    super.initState();
    _loadEnhancedIntroduction();
    _loadVisitStatus();
  }

  void _loadVisitStatus() {
    // Initialize all activities as pending (false)
    for (final day in widget.tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        _visitedActivities[activity.activityTitle] = false;
      }
    }
  }

  void _toggleVisitStatus(String activityTitle) {
    setState(() {
      _visitedActivities[activityTitle] = !(_visitedActivities[activityTitle] ?? false);
    });
    
    final isVisited = _visitedActivities[activityTitle] ?? false;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          isVisited ? '✅ Marked as visited' : '⏳ Marked as pending',
        ),
        backgroundColor: isVisited ? Colors.green : Colors.blue,
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

  void _removeActivity(ActivityDetail activity) {
    setState(() {
      // Remove from all days
      for (final day in widget.tripPlan.dailyPlans) {
        day.activities.removeWhere((a) => a.activityTitle == activity.activityTitle);
      }
      // Remove from visit status tracking
      _visitedActivities.remove(activity.activityTitle);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🗑️ Removed "${activity.activityTitle}" from plan'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  Widget _buildTripPlanStatsCard() {
    final allActivities = <ActivityDetail>[];
    for (final day in widget.tripPlan.dailyPlans) {
      allActivities.addAll(day.activities);
    }
    
    final totalPlaces = allActivities.length;
    final visitedCount = _visitedActivities.values.where((visited) => visited).length;
    final pendingCount = totalPlaces - visitedCount;
    
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
      
      final isVisited = _visitedActivities[activity.activityTitle] ?? false;
      if (!isVisited) {
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
            
            ...widget.tripPlan.dailyPlans.asMap().entries.map((entry) {
              final index = entry.key;
              final dayPlan = entry.value;
              return _buildDayPlan(index + 1, dayPlan);
            }),
            
            const SizedBox(height: 24),
            
            // Bottom Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _openRouteInGoogleMaps,
                    icon: const Icon(Icons.map),
                    label: const Text('Open Route Plan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.exit_to_app),
                    label: const Text('Exit'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 16),
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
    final isVisited = _visitedActivities[activity.activityTitle] ?? false;
    
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