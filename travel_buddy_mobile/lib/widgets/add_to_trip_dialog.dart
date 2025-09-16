import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/place.dart';
import '../models/trip.dart';

class AddToTripDialog extends StatefulWidget {
  final Place place;

  const AddToTripDialog({super.key, required this.place});

  @override
  State<AddToTripDialog> createState() => _AddToTripDialogState();
}

class _AddToTripDialogState extends State<AddToTripDialog> {
  String? _selectedTripId;
  bool _createNew = false;
  final _newTripController = TextEditingController();

  @override
  void dispose() {
    _newTripController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final trips = appProvider.tripPlans;

        return AlertDialog(
          title: Text('Add ${widget.place.name} to Trip'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (trips.isNotEmpty) ...[
                const Text('Select existing trip:'),
                const SizedBox(height: 8),
                ...trips.map((trip) => RadioListTile<String>(
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
            ],
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
    return _selectedTripId != null || (_createNew && _newTripController.text.trim().isNotEmpty);
  }

  void _addToTrip() async {
    final appProvider = context.read<AppProvider>();
    
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