import 'package:flutter/material.dart';
import '../services/ai_trip_service.dart';
import '../models/enhanced_activity.dart';
import '../widgets/enhanced_day_summary_widget.dart';

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
        ? Center(child: CircularProgressIndicator())
        : _tripPlan == null 
          ? _buildInputForm()
          : _buildTripPlan(),
    );
  }

  Widget _buildInputForm() {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _destinationController,
            decoration: InputDecoration(
              labelText: 'Destination',
              hintText: 'e.g., Tokyo, Paris, New York',
              prefixIcon: Icon(Icons.location_on),
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _durationController,
            decoration: InputDecoration(
              labelText: 'Duration',
              hintText: 'e.g., 2 days, 1 week',
              prefixIcon: Icon(Icons.schedule),
            ),
          ),
          SizedBox(height: 16),
          TextField(
            controller: _interestsController,
            decoration: InputDecoration(
              labelText: 'Interests',
              hintText: 'e.g., culture, food, nature',
              prefixIcon: Icon(Icons.favorite),
            ),
          ),
          SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _pace,
            decoration: InputDecoration(labelText: 'Pace'),
            items: ['Relaxed', 'Moderate', 'Fast'].map((pace) =>
              DropdownMenuItem(value: pace, child: Text(pace))
            ).toList(),
            onChanged: (value) => setState(() => _pace = value!),
          ),
          SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _budget,
            decoration: InputDecoration(labelText: 'Budget'),
            items: ['Budget', 'Mid-Range', 'Luxury'].map((budget) =>
              DropdownMenuItem(value: budget, child: Text(budget))
            ).toList(),
            onChanged: (value) => setState(() => _budget = value!),
          ),
          SizedBox(height: 32),
          ElevatedButton(
            onPressed: _generateAIPlan,
            child: Text('🚀 Generate AI Plan'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.deepPurple,
              minimumSize: Size(double.infinity, 50),
            ),
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
          ElevatedButton(
            onPressed: () => setState(() => _tripPlan = null),
            child: Text('Create New Plan'),
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
    if (_destinationController.text.isEmpty) return;

    setState(() => _isLoading = true);

    try {
      final tripPlan = await AITripService.generateTripPlan(
        destination: _destinationController.text,
        duration: _durationController.text.isEmpty ? '2 days' : _durationController.text,
        interests: _interestsController.text,
        pace: _pace,
        budget: _budget,
      );

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
}