import 'package:flutter/material.dart';
import '../models/enhanced_activity.dart';
import '../services/location_alert_service.dart';

class LocationAlertWidget extends StatefulWidget {
  final List<EnhancedActivity> dayPlan;
  final Function(EnhancedActivity) onAddActivity;

  const LocationAlertWidget({
    super.key,
    required this.dayPlan,
    required this.onAddActivity,
  });

  @override
  State<LocationAlertWidget> createState() => _LocationAlertWidgetState();
}

class _LocationAlertWidgetState extends State<LocationAlertWidget> {
  String? _currentAlert;
  List<Map<String, dynamic>> _nearbyPlaces = [];
  bool _isMonitoring = false;

  @override
  void initState() {
    super.initState();
    _startLocationMonitoring();
  }

  void _startLocationMonitoring() {
    setState(() {
      _isMonitoring = true;
    });

    LocationAlertService.startLocationMonitoring(
      dayPlan: widget.dayPlan,
      onDestinationReached: (destination) {
        setState(() {
          _currentAlert = destination;
        });
        _showDestinationAlert(destination);
      },
      onNearbyPlacesFound: (title, places) {
        setState(() {
          _nearbyPlaces = places;
        });
        _showNearbyPlacesAlert(title, places);
      },
    );
  }

  void _showDestinationAlert(String destination) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.location_on, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                destination.startsWith('Approaching') 
                  ? '🚶 $destination'
                  : '🎯 Arrived at $destination',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        backgroundColor: destination.startsWith('Approaching') 
          ? Colors.orange 
          : Colors.green,
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'View',
          textColor: Colors.white,
          onPressed: () => _showDestinationDetails(destination),
        ),
      ),
    );
  }

  void _showNearbyPlacesAlert(String title, List<Map<String, dynamic>> places) {
    if (!mounted || places.isEmpty) return;

    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Row(
              children: [
                const Icon(Icons.explore, color: Colors.blue, size: 24),
                const SizedBox(width: 12),
                Text(
                  '🔍 $title',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Found ${places.length} interesting places nearby while you travel:',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            ...places.take(3).map((place) => _buildNearbyPlaceCard(place)),
            const SizedBox(height: 16),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[300],
                            foregroundColor: Colors.black87,
                          ),
                          child: const Text('Continue Plan'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _showAddToItineraryDialog(places);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Add to Plan'),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNearbyPlaceCard(Map<String, dynamic> place) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue[100],
          child: Icon(
            _getIconForPlace(place['types']),
            color: Colors.blue[700],
            size: 20,
          ),
        ),
        title: Text(
          place['name'],
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '${(place['distance'] as double).round()}m away • ${place['rating']}/5 ⭐',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.add_circle, color: Colors.green),
          onPressed: () => _addQuickStop(place),
        ),
      ),
    );
  }

  IconData _getIconForPlace(List<dynamic> types) {
    for (final type in types) {
      switch (type.toString()) {
        case 'restaurant':
          return Icons.restaurant;
        case 'museum':
          return Icons.museum;
        case 'park':
          return Icons.park;
        case 'shopping_mall':
          return Icons.shopping_bag;
        default:
          continue;
      }
    }
    return Icons.place;
  }

  void _addQuickStop(Map<String, dynamic> place) {
    final quickActivity = LocationAlertService.createQuickActivity(
      place,
      'Quick Stop',
    );
    
    widget.onAddActivity(quickActivity);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Added ${place['name']} as quick stop'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showAddToItineraryDialog(List<Map<String, dynamic>> places) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add to Your Day Plan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Select places to add as quick stops:'),
            const SizedBox(height: 16),
            ...places.map((place) => CheckboxListTile(
              title: Text(place['name']),
              subtitle: Text('${(place['distance'] as double).round()}m away'),
              value: false,
              onChanged: (value) {
                if (value == true) {
                  _addQuickStop(place);
                  Navigator.pop(context);
                }
              },
            )),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showDestinationDetails(String destination) {
    final activity = widget.dayPlan.firstWhere(
      (a) => destination.contains(a.title),
      orElse: () => widget.dayPlan.first,
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('🎯 ${activity.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              activity.description,
              style: const TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 12),
            Text(
              '⏰ ${activity.timeSlot}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              '💰 ${activity.costInfo.currency}${activity.costInfo.entryFee}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              '💡 Local Tips:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ...activity.contextInfo.localTips.take(2).map(
              (tip) => Text('• $tip', style: const TextStyle(fontSize: 12)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it!'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isMonitoring) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(
          bottom: BorderSide(color: Colors.blue[200]!),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.my_location,
            color: Colors.blue[700],
            size: 16,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _currentAlert ?? 'Monitoring your location for smart alerts...',
              style: TextStyle(
                color: Colors.blue[700],
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, size: 16, color: Colors.blue[700]),
            onPressed: () {
              LocationAlertService.stopLocationMonitoring();
              setState(() {
                _isMonitoring = false;
              });
            },
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    LocationAlertService.stopLocationMonitoring();
    super.dispose();
  }
}