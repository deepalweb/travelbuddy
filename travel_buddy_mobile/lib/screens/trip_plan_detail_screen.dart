import 'package:flutter/material.dart';
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

  @override
  void initState() {
    super.initState();
    _loadEnhancedIntroduction();
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