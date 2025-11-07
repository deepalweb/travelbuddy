import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/ai_trip_service.dart';
import '../providers/app_provider.dart';
import '../models/trip.dart';
import '../models/place.dart';
import '../screens/enhanced_route_plan_screen.dart';

class AIPlanScreen extends StatefulWidget {
  @override
  _AIPlanScreenState createState() => _AIPlanScreenState();
}

class _AIPlanScreenState extends State<AIPlanScreen> {
  final _destinationController = TextEditingController();
  final _durationController = TextEditingController();
  final _interestsController = TextEditingController();
  
  String _pace = 'Moderate';
  String _budget = 'Mid-Range';
  bool _isLoading = false;
  Map<String, dynamic>? _tripPlan;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('🤖 AI Trip Planner'),
        backgroundColor: Colors.deepPurple,
      ),
      body: _isLoading 
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.deepPurple),
                ),
                SizedBox(height: 16),
                Text(
                  'AI is crafting your perfect trip...',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'This may take a few moments',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ),
          )
        : _tripPlan == null 
          ? _buildInputForm()
          : _buildTripPlan(),
    );
  }

  Widget _buildInputForm() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.auto_awesome, color: Colors.deepPurple),
                      SizedBox(width: 8),
                      Text(
                        'AI Trip Planner',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Let AI create a personalized itinerary for your perfect trip!',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: 24),
          TextField(
            controller: _destinationController,
            decoration: InputDecoration(
              labelText: 'Destination',
              hintText: 'e.g., Tokyo, Paris, New York',
              prefixIcon: Icon(Icons.location_on),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _durationController,
            decoration: InputDecoration(
              labelText: 'Duration',
              hintText: 'e.g., 2 days, 1 week',
              prefixIcon: Icon(Icons.schedule),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _interestsController,
            decoration: InputDecoration(
              labelText: 'Interests',
              hintText: 'e.g., culture, food, nature',
              prefixIcon: Icon(Icons.favorite),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
          ),
          SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _pace,
            decoration: InputDecoration(
              labelText: 'Pace',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            items: ['Relaxed', 'Moderate', 'Fast'].map((pace) =>
              DropdownMenuItem(value: pace, child: Text(pace))
            ).toList(),
            onChanged: (value) => setState(() => _pace = value!),
          ),
          SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _budget,
            decoration: InputDecoration(
              labelText: 'Budget',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            items: ['Budget', 'Mid-Range', 'Luxury'].map((budget) =>
              DropdownMenuItem(value: budget, child: Text(budget))
            ).toList(),
            onChanged: (value) => setState(() => _budget = value!),
          ),
          SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: _destinationController.text.isEmpty ? null : _generateAIPlan,
            icon: Icon(Icons.auto_awesome),
            label: Text('Generate AI Plan'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple,
              foregroundColor: Colors.white,
              minimumSize: Size(double.infinity, 56),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Tip: Be specific about your interests for better recommendations!',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildTripPlan() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _tripPlan!['tripTitle'] ?? 'Your AI Trip Plan',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(_tripPlan!['introduction'] ?? ''),
                ],
              ),
            ),
          ),
          SizedBox(height: 16),
          ..._buildDailyPlans(),
          SizedBox(height: 16),
          Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _saveTripPlan,
                      icon: Icon(Icons.save),
                      label: Text('Save Plan'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _openSmartRoute,
                      icon: Icon(Icons.auto_awesome),
                      label: Text('Smart Route'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => setState(() => _tripPlan = null),
                  child: Text('Create New Plan'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildDailyPlans() {
    final dailyPlans = _tripPlan!['dailyPlans'] as List? ?? [];
    return dailyPlans.map<Widget>((day) {
      return Card(
        margin: EdgeInsets.only(bottom: 16),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                day['title'] ?? 'Day ${day['day']}',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(day['theme'] ?? ''),
              SizedBox(height: 16),
              ...((day['activities'] as List? ?? []).map<Widget>((activity) {
                return _buildActivityCard(activity);
              }).toList()),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget _buildActivityCard(Map<String, dynamic> activity) {
    return Card(
      margin: EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Text(activity['icon'] ?? '📍'),
        title: Text(activity['activityTitle'] ?? 'Activity'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(activity['timeOfDay'] ?? ''),
            SizedBox(height: 4),
            Text(
              activity['description'] ?? '',
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        trailing: Chip(
          label: Text(activity['category'] ?? 'Activity'),
          backgroundColor: Colors.deepPurple.withOpacity(0.1),
        ),
      ),
    );
  }

  Future<void> _generateAIPlan() async {
    if (_destinationController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter a destination'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final duration = _durationController.text.isEmpty ? '2 days' : _durationController.text;
      print('🤖 AI Plan Screen: Generating plan for $duration');
      
      final tripPlan = await AITripService.generateTripPlan(
        destination: _destinationController.text,
        duration: duration,
        interests: _interestsController.text,
        pace: _pace,
        budget: _budget,
      );

      print('🤖 AI Plan Screen: Received plan with ${(tripPlan['dailyPlans'] as List?)?.length ?? 0} days');
      
      setState(() {
        _tripPlan = tripPlan;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate plan: $e')),
      );
    }
  }

  Future<void> _saveTripPlan() async {
    if (_tripPlan == null) return;

    try {
      // Convert AI response to TripPlan model
      final tripPlan = TripPlan(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        tripTitle: _tripPlan!['tripTitle'] ?? 'AI Generated Trip',
        destination: _tripPlan!['destination'] ?? _destinationController.text,
        duration: _tripPlan!['duration'] ?? _durationController.text,
        introduction: _tripPlan!['introduction'] ?? '',
        conclusion: _tripPlan!['conclusion'] ?? 'Enjoy your trip!',
        dailyPlans: (_tripPlan!['dailyPlans'] as List? ?? []).map((dayData) {
          return DailyTripPlan(
            day: dayData['day'] ?? 1,
            title: dayData['title'] ?? 'Day ${dayData['day']}',
            theme: dayData['theme'],
            activities: (dayData['activities'] as List? ?? []).map((activityData) {
              return ActivityDetail(
                timeOfDay: activityData['timeOfDay'] ?? '09:00',
                activityTitle: activityData['activityTitle'] ?? 'Activity',
                description: activityData['description'] ?? '',
                category: activityData['category'],
                icon: activityData['icon'],
                location: activityData['location'],
                estimatedDuration: activityData['estimatedDuration'],
                notes: activityData['notes'],
              );
            }).toList(),
          );
        }).toList(),
      );

      // Save using AppProvider
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      await appProvider.saveTripPlan(tripPlan);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Trip plan saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Navigate back to planner
      Navigator.of(context).pop();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to save plan: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _openSmartRoute() {
    if (_tripPlan == null) return;

    // Convert AI trip plan to places for route planning
    final places = <Place>[];
    
    final dailyPlans = _tripPlan!['dailyPlans'] as List? ?? [];
    for (final dayPlan in dailyPlans) {
      final activities = dayPlan['activities'] as List? ?? [];
      for (final activity in activities) {
        places.add(Place(
          id: 'ai_${activity['activityTitle'].hashCode}',
          name: activity['activityTitle'] ?? 'Activity',
          address: activity['location'] ?? '',
          latitude: null, // Will be resolved by enhanced route planning
          longitude: null,
          rating: 4.0, // Default rating for AI generated places
          type: activity['category'] ?? 'attraction',
          photoUrl: '',
          description: activity['description'] ?? '',
          localTip: '',
          handyPhrase: '',
        ));
      }
    }

    if (places.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No places found to create route'),
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
          title: '${_tripPlan!['tripTitle']} - Smart Route',
        ),
      ),
    );
  }
}