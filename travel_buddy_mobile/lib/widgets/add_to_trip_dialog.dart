import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../services/storage_service.dart';

class AddToTripDialog extends StatefulWidget {
  final Place place;

  const AddToTripDialog({super.key, required this.place});

  @override
  State<AddToTripDialog> createState() => _AddToTripDialogState();
}

class _AddToTripDialogState extends State<AddToTripDialog> {
  String? _selectedDayPlanId;
  bool _createNew = true; // Default to create new
  final _newDayPlanController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    // Set default day plan name
    _newDayPlanController.text = 'Day at ${widget.place.name}';
  }

  @override
  void dispose() {
    _newDayPlanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final dayPlans = appProvider.itineraries;

        return AlertDialog(
          title: Text('Add ${widget.place.name}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Add this place to a day plan:',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                // Day Plan Section
                if (dayPlans.isNotEmpty) ...[
                  const Text('Select existing day plan:', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...dayPlans.take(3).map((dayPlan) => RadioListTile<String>(
                    title: Text(dayPlan.title),
                    subtitle: Text('${dayPlan.dailyPlan.length} activities'),
                    value: dayPlan.id,
                    groupValue: _selectedDayPlanId,
                    onChanged: (value) {
                      setState(() {
                        _selectedDayPlanId = value;
                        _createNew = false;
                      });
                    },
                  )),
                  const Divider(),
                ],
                // Always show create new option
                CheckboxListTile(
                  title: Text(dayPlans.isEmpty ? 'Create new day plan' : 'Create new day plan'),
                  subtitle: dayPlans.isEmpty 
                      ? const Text('Start your first day itinerary') 
                      : const Text('Create a new single-day plan'),
                  value: _createNew,
                  onChanged: (value) {
                    setState(() {
                      _createNew = value ?? false;
                      if (_createNew) _selectedDayPlanId = null;
                    });
                  },
                ),
                if (_createNew) ...[
                  const SizedBox(height: 8),
                  TextField(
                    controller: _newDayPlanController,
                    decoration: const InputDecoration(
                      labelText: 'Day plan name',
                      hintText: 'e.g., Exploring Downtown',
                      border: OutlineInputBorder(),
                    ),
                    autofocus: true,
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: _canAdd() ? _addToTrip : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  bool _canAdd() {
    return _selectedDayPlanId != null || (_createNew && _newDayPlanController.text.trim().isNotEmpty);
  }

  void _addToTrip() async {
    final appProvider = context.read<AppProvider>();
    
    if (_createNew) {
      // Create new day plan with this place
      final newDayPlan = OneDayItinerary(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: _newDayPlanController.text.trim(),
        introduction: 'Day plan featuring ${widget.place.name}',
        dailyPlan: [
          ActivityDetail(
            timeOfDay: '10:00 – 12:00',
            activityTitle: '${_getPlaceEmoji(widget.place.type)} Visit ${widget.place.name}',
            description: widget.place.description,
            fullAddress: widget.place.address,
            rating: widget.place.rating,
            duration: _getEstimatedTime(widget.place.type),
            estimatedCost: _getPriceRange(widget.place.type),
          ),
        ],
        conclusion: 'Enjoy exploring ${widget.place.name}!',
      );
      
      appProvider.itineraries.add(newDayPlan);
      final storageService = StorageService();
      await storageService.saveItinerary(newDayPlan);
      appProvider.notifyListeners();
      
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✨ Created day plan "${newDayPlan.title}" with ${widget.place.name}'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else if (_selectedDayPlanId != null) {
      // Add to existing day plan
      final dayPlan = appProvider.itineraries.firstWhere((plan) => plan.id == _selectedDayPlanId);
      
      final newActivity = ActivityDetail(
        timeOfDay: '${12 + dayPlan.dailyPlan.length}:00 – ${13 + dayPlan.dailyPlan.length}:00',
        activityTitle: '${_getPlaceEmoji(widget.place.type)} Visit ${widget.place.name}',
        description: widget.place.description,
        fullAddress: widget.place.address,
        rating: widget.place.rating,
        duration: _getEstimatedTime(widget.place.type),
        estimatedCost: _getPriceRange(widget.place.type),
      );
      
      dayPlan.dailyPlan.add(newActivity);
      appProvider.notifyListeners();
      
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Added ${widget.place.name} to "${dayPlan.title}"'),
          backgroundColor: Colors.blue,
        ),
      );
    }
  }
  
  String _getPlaceEmoji(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant': return '🍽️';
      case 'cafe': return '☕';
      case 'museum': return '🏛️';
      case 'park': return '🌳';
      case 'shopping': return '🛍️';
      case 'bar': return '🍸';
      case 'temple': return '🏯';
      case 'beach': return '🏖️';
      default: return '📍';
    }
  }
  
  String _getEstimatedTime(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant': return '1-2 hrs';
      case 'cafe': return '1 hr';
      case 'museum': return '2-3 hrs';
      case 'park': return '1-3 hrs';
      case 'shopping': return '1-2 hrs';
      default: return '1-2 hrs';
    }
  }
  
  String _getPriceRange(String type) {
    switch (type.toLowerCase()) {
      case 'restaurant': return 'LKR 1500-3000';
      case 'cafe': return 'LKR 500-1000';
      case 'museum': return 'LKR 200-500';
      case 'park': return 'Free';
      case 'shopping': return 'LKR 1000+';
      default: return 'LKR 500-1500';
    }
  }
}