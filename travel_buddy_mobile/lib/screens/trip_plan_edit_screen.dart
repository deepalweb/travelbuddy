import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/trip.dart';
import '../providers/app_provider.dart';

class TripPlanEditScreen extends StatefulWidget {
  final TripPlan tripPlan;

  const TripPlanEditScreen({super.key, required this.tripPlan});

  @override
  State<TripPlanEditScreen> createState() => _TripPlanEditScreenState();
}

class _TripPlanEditScreenState extends State<TripPlanEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _destinationController;
  late TextEditingController _durationController;
  late TextEditingController _introductionController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.tripPlan.tripTitle);
    _destinationController = TextEditingController(text: widget.tripPlan.destination);
    _durationController = TextEditingController(text: widget.tripPlan.duration);
    _introductionController = TextEditingController(text: widget.tripPlan.introduction);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _destinationController.dispose();
    _durationController.dispose();
    _introductionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Trip Plan'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveTrip,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Basic Info
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Trip Information',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          labelText: 'Trip Title',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Trip title is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _destinationController,
                        decoration: const InputDecoration(
                          labelText: 'Destination',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Destination is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _durationController,
                        decoration: const InputDecoration(
                          labelText: 'Duration',
                          border: OutlineInputBorder(),
                          hintText: 'e.g., 5 days',
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Duration is required';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: _introductionController,
                        decoration: const InputDecoration(
                          labelText: 'Introduction',
                          border: OutlineInputBorder(),
                          hintText: 'Describe your trip...',
                        ),
                        maxLines: 3,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Introduction is required';
                          }
                          return null;
                        },
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Daily Plans
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Daily Itinerary',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Note: Daily activities can be edited in the full trip planner.',
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      const SizedBox(height: 16),
                      ...widget.tripPlan.dailyPlans.asMap().entries.map((entry) {
                        final index = entry.key;
                        final dayPlan = entry.value;
                        return _buildDayPlanPreview(index + 1, dayPlan);
                      }),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDayPlanPreview(int dayNumber, DailyTripPlan dayPlan) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Day $dayNumber',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${dayPlan.activities.length} activities planned',
            style: const TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Future<void> _saveTrip() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Create updated trip plan
      final updatedTrip = TripPlan(
        id: widget.tripPlan.id,
        tripTitle: _titleController.text.trim(),
        destination: _destinationController.text.trim(),
        duration: _durationController.text.trim(),
        introduction: _introductionController.text.trim(),
        dailyPlans: widget.tripPlan.dailyPlans, // Keep existing daily plans
        conclusion: widget.tripPlan.conclusion, // Keep existing conclusion
      );

      // Update in provider (this would also update backend in production)
      final appProvider = context.read<AppProvider>();
      
      // Remove old trip and add updated one
      await appProvider.deleteTripPlan(widget.tripPlan.id);
      await appProvider.saveTripPlan(updatedTrip);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip plan updated successfully')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update trip: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
}