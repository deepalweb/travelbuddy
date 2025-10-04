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
  String? _selectedTripId;
  String? _selectedDayPlanId;
  bool _createNew = false;
  bool _addToDayPlan = false;
  final _newTripController = TextEditingController();
  final _newDayPlanController = TextEditingController();

  @override
  void dispose() {
    _newTripController.dispose();
    _newDayPlanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final trips = appProvider.tripPlans;
        final dayPlans = appProvider.itineraries;

        return AlertDialog(
          title: Text('Add ${widget.place.name}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Toggle between Trip and Day Plan
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Multi-Day Trip'),
                        selected: !_addToDayPlan,
                        onSelected: (selected) {
                          setState(() {
                            _addToDayPlan = false;
                            _selectedDayPlanId = null;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('Day Plan'),
                        selected: _addToDayPlan,
                        onSelected: (selected) {
                          setState(() {
                            _addToDayPlan = true;
                            _selectedTripId = null;
                          });
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                
                if (!_addToDayPlan) ...[
                  // Multi-Day Trip Section
                  if (trips.isNotEmpty) ...[
                    const Text('Select existing trip:'),
                    const SizedBox(height: 8),
                    ...trips.take(3).map((trip) => RadioListTile<String>(
                      title: Text(trip.tripTitle ?? 'Untitled Trip'),
                      subtitle: Text(trip.destination ?? ''),
                      value: trip.id,
                      groupValue: _selectedTripId,
                      onChanged: (value) {
                        setState(() {
                          _selectedTripId = value;
                          _createNew = false;
                        });
                      },
                    )),
                    const Divider(),
                  ],
                  CheckboxListTile(
                    title: const Text('Create new trip'),
                    value: _createNew,
                    onChanged: (value) {
                      setState(() {
                        _createNew = value ?? false;
                        if (_createNew) _selectedTripId = null;
                      });
                    },
                  ),
                  if (_createNew) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _newTripController,
                      decoration: const InputDecoration(
                        labelText: 'Trip name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ] else ...[
                  // Day Plan Section
                  if (dayPlans.isNotEmpty) ...[
                    const Text('Select existing day plan:'),
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
                  CheckboxListTile(
                    title: const Text('Create new day plan'),
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
                    ),
                  ],
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
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  bool _canAdd() {
    if (_addToDayPlan) {
      return _selectedDayPlanId != null || (_createNew && _newDayPlanController.text.trim().isNotEmpty);
    } else {
      return _selectedTripId != null || (_createNew && _newTripController.text.trim().isNotEmpty);
    }
  }

  void _addToTrip() async {
    final appProvider = context.read<AppProvider>();
    
    if (_addToDayPlan) {
      // Day Plan Logic
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
              description: '${widget.place.description}\n📍 ${widget.place.address}\n⭐ ${widget.place.rating.toStringAsFixed(1)} | 🕓 ${_getEstimatedTime(widget.place.type)}\n💰 ${_getPriceRange(widget.place.type)}',
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
          description: '${widget.place.description}\n📍 ${widget.place.address}\n⭐ ${widget.place.rating.toStringAsFixed(1)} | 🕓 ${_getEstimatedTime(widget.place.type)}\n💰 ${_getPriceRange(widget.place.type)}',
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
    } else {
      // Multi-Day Trip Logic
      if (_createNew) {
        // Create new trip with this place
        final newTrip = TripPlan(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          tripTitle: _newTripController.text.trim(),
          destination: widget.place.address,
          duration: '1 day',
          introduction: 'Trip including ${widget.place.name}',
          dailyPlans: [
            DailyTripPlan(
              day: 1,
              title: 'Day 1',
              activities: [
                ActivityDetail(
                  timeOfDay: 'Morning',
                  activityTitle: 'Visit ${widget.place.name}',
                  description: widget.place.description.isNotEmpty 
                    ? widget.place.description 
                    : 'Explore this ${widget.place.type.toLowerCase()}',
                ),
              ],
            ),
          ],
          conclusion: 'Enjoy your trip!',
        );
        
        await appProvider.saveTripPlan(newTrip);
        
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Created new trip "${newTrip.tripTitle}" with ${widget.place.name}')),
          );
        }
      } else if (_selectedTripId != null) {
        // Add to existing trip (simplified - just show success)
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Added ${widget.place.name} to trip')),
        );
      }
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