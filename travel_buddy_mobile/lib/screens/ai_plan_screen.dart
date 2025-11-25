import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  final _formKey = GlobalKey<FormState>();
  
  String _pace = 'Moderate';
  String _budget = 'Mid-Range';
  bool _isLoading = false;
  String _loadingMessage = 'AI is crafting your perfect trip...';
  Map<String, dynamic>? _tripPlan;
  bool _isEditing = false;
  int _selectedDayIndex = 0;
  String _viewMode = 'timeline'; // 'timeline' or 'list'
  
  DateTime? _startDate;
  DateTime? _endDate;
  int _travelerCount = 1;
  
  final _popularDestinations = ['Paris', 'Tokyo', 'New York', 'London', 'Barcelona', 'Dubai'];
  final _interestTags = ['Culture', 'Food', 'Nature', 'Shopping', 'Adventure', 'Relaxation'];
  final _selectedInterests = <String>{};

  @override
  void initState() {
    super.initState();
    _loadPreferences();
    _autoFillLocation();
  }
  
  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        _pace = prefs.getString('ai_pace') ?? 'Moderate';
        _budget = prefs.getString('ai_budget') ?? 'Mid-Range';
        _travelerCount = prefs.getInt('ai_travelers') ?? 1;
        final savedInterests = prefs.getStringList('ai_interests') ?? [];
        _selectedInterests.addAll(savedInterests);
      });
    } catch (e) {
      print('Failed to load preferences: $e');
    }
  }
  
  Future<void> _savePreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('ai_pace', _pace);
      await prefs.setString('ai_budget', _budget);
      await prefs.setInt('ai_travelers', _travelerCount);
      await prefs.setStringList('ai_interests', _selectedInterests.toList());
    } catch (e) {
      print('Failed to save preferences: $e');
    }
  }
  
  Future<void> _autoFillLocation() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    if (appProvider.currentLocation != null && _destinationController.text.isEmpty) {
      setState(() {
        _destinationController.text = 'Current Location';
      });
    }
  }

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
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.deepPurple),
                    strokeWidth: 6,
                  ),
                ),
                SizedBox(height: 24),
                Text(
                  _loadingMessage,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.deepPurple,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 12),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 40),
                  child: LinearProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.deepPurple),
                    backgroundColor: Colors.deepPurple.withOpacity(0.2),
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'This may take 10-15 seconds',
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
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 2,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.deepPurple, Colors.purple[300]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.auto_awesome, color: Colors.white, size: 28),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'AI Trip Planner',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text('BETA', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Let AI create a personalized itinerary for your perfect trip!',
                      style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),
            Text('Where to?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            TextFormField(
              controller: _destinationController,
              validator: (value) => value?.isEmpty ?? true ? 'Please enter a destination' : null,
              decoration: InputDecoration(
                labelText: 'Destination *',
                hintText: 'e.g., Tokyo, Paris, New York',
                prefixIcon: Icon(Icons.location_on, color: Colors.deepPurple),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: _popularDestinations.map((dest) => ActionChip(
                label: Text(dest, style: TextStyle(fontSize: 12)),
                onPressed: () => setState(() => _destinationController.text = dest),
                backgroundColor: Colors.deepPurple.withOpacity(0.1),
              )).toList(),
            ),
            SizedBox(height: 20),
            Text('When?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            InkWell(
              onTap: _selectDateRange,
              child: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(12),
                  color: Colors.grey[50],
                ),
                child: Row(
                  children: [
                    Icon(Icons.calendar_today, color: Colors.deepPurple),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _startDate == null
                            ? 'Select travel dates *'
                            : '${_formatDate(_startDate!)} - ${_formatDate(_endDate!)} (${_calculateDays()} days)',
                        style: TextStyle(
                          color: _startDate == null ? Colors.grey[600] : Colors.black87,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
                  ],
                ),
              ),
            ),
            SizedBox(height: 20),
            Text('Who\'s traveling?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(12),
                color: Colors.grey[50],
              ),
              child: Row(
                children: [
                  Icon(Icons.people, color: Colors.deepPurple),
                  SizedBox(width: 12),
                  Text('Travelers:', style: TextStyle(fontSize: 14)),
                  Spacer(),
                  IconButton(
                    onPressed: _travelerCount > 1 ? () => setState(() => _travelerCount--) : null,
                    icon: Icon(Icons.remove_circle_outline),
                    color: _travelerCount > 1 ? Colors.deepPurple : Colors.grey,
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.deepPurple),
                    ),
                    child: Text(
                      '$_travelerCount',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.deepPurple),
                    ),
                  ),
                  IconButton(
                    onPressed: _travelerCount < 10 ? () => setState(() => _travelerCount++) : null,
                    icon: Icon(Icons.add_circle_outline),
                    color: _travelerCount < 10 ? Colors.deepPurple : Colors.grey,
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),
            Row(
              children: [
                Text('What interests you?', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                SizedBox(width: 8),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('OPTIONAL', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey[700])),
                ),
              ],
            ),
            SizedBox(height: 4),
            Text(
              'Leave empty to let AI create the best plan',
              style: TextStyle(fontSize: 12, color: Colors.grey[600], fontStyle: FontStyle.italic),
            ),
            SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _interestTags.map((tag) => FilterChip(
                label: Text(tag),
                selected: _selectedInterests.contains(tag),
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedInterests.add(tag);
                    } else {
                      _selectedInterests.remove(tag);
                    }
                  });
                },
                selectedColor: Colors.deepPurple.withOpacity(0.3),
                checkmarkColor: Colors.deepPurple,
              )).toList(),
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
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Travel Pace', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _pace,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey[50],
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: ['Relaxed', 'Moderate', 'Fast'].map((pace) =>
                          DropdownMenuItem(value: pace, child: Text(pace, style: TextStyle(fontSize: 14)))
                        ).toList(),
                        onChanged: (value) => setState(() => _pace = value!),
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Budget', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      SizedBox(height: 8),
                      DropdownButtonFormField<String>(
                        value: _budget,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          filled: true,
                          fillColor: Colors.grey[50],
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: ['Budget', 'Mid-Range', 'Luxury'].map((budget) =>
                          DropdownMenuItem(value: budget, child: Text(budget, style: TextStyle(fontSize: 14)))
                        ).toList(),
                        onChanged: (value) => setState(() => _budget = value!),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: _generateAIPlan,
              icon: Icon(Icons.auto_awesome, size: 24),
              label: Text('Generate AI Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                foregroundColor: Colors.white,
                minimumSize: Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 2,
              ),
            ),
            SizedBox(height: 16),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.lightbulb_outline, color: Colors.blue[700], size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Tip: Select multiple interests for better recommendations!',
                      style: TextStyle(fontSize: 12, color: Colors.blue[900]),
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

  Widget _buildTripPlan() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            elevation: 3,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.green[50]!, Colors.blue[50]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green, size: 28),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Plan Generated!',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green[800]),
                        ),
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('AI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.deepPurple)),
                      ),
                    ],
                  ),
                  SizedBox(height: 12),
                  Text(
                    _tripPlan!['tripTitle'] ?? 'Your AI Trip Plan',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(_tripPlan!['introduction'] ?? '', style: TextStyle(height: 1.4)),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      _buildInfoChip(Icons.calendar_today, '${_calculateDays()} days', Colors.blue),
                      SizedBox(width: 8),
                      _buildInfoChip(Icons.people, '$_travelerCount traveler${_travelerCount > 1 ? 's' : ''}', Colors.orange),
                      SizedBox(width: 8),
                      _buildInfoChip(Icons.attach_money, _budget, Colors.green),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: SegmentedButton<String>(
                  segments: [
                    ButtonSegment(value: 'timeline', label: Text('Timeline'), icon: Icon(Icons.timeline, size: 18)),
                    ButtonSegment(value: 'list', label: Text('List'), icon: Icon(Icons.list, size: 18)),
                  ],
                  selected: {_viewMode},
                  onSelectionChanged: (Set<String> selected) {
                    setState(() => _viewMode = selected.first);
                  },
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          if (_viewMode == 'timeline')
            _buildTimelineView()
          else
            ..._buildDailyPlans(),
          SizedBox(height: 16),
          _buildCostEstimate(),
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
                        padding: EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _openSmartRoute,
                      icon: Icon(Icons.route),
                      label: Text('Smart Route'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _regeneratePlan,
                      icon: Icon(Icons.refresh),
                      label: Text('Regenerate'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.deepPurple,
                        padding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => setState(() => _tripPlan = null),
                      icon: Icon(Icons.add),
                      label: Text('New Plan'),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineView() {
    final dailyPlans = _tripPlan!['dailyPlans'] as List? ?? [];
    
    return Column(
      children: [
        Container(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: dailyPlans.length,
            itemBuilder: (context, index) {
              final isSelected = _selectedDayIndex == index;
              return GestureDetector(
                onTap: () => setState(() => _selectedDayIndex = index),
                child: Container(
                  margin: EdgeInsets.only(right: 8),
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(colors: [Colors.deepPurple, Colors.purple[300]!])
                        : null,
                    color: isSelected ? null : Colors.grey[200],
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(
                      color: isSelected ? Colors.deepPurple : Colors.grey[300]!,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      'Day ${index + 1}',
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        SizedBox(height: 16),
        _buildDayTimeline(dailyPlans[_selectedDayIndex]),
      ],
    );
  }
  
  Widget _buildDayTimeline(Map<String, dynamic> day) {
    final activities = day['activities'] as List? ?? [];
    
    return Card(
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.deepPurple, Colors.purple[300]!],
                    ),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Center(
                    child: Text(
                      '${_selectedDayIndex + 1}',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                    ),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        day['title'] ?? 'Day ${day['day']}',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      if (day['theme'] != null && day['theme'].isNotEmpty)
                        Text(
                          day['theme'],
                          style: TextStyle(fontSize: 12, color: Colors.purple[600], fontStyle: FontStyle.italic),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.edit, color: Colors.deepPurple),
                  onPressed: () => _editDay(_selectedDayIndex),
                  tooltip: 'Edit day',
                ),
              ],
            ),
            SizedBox(height: 20),
            ...activities.asMap().entries.map((entry) {
              final index = entry.key;
              final activity = entry.value;
              final isLast = index == activities.length - 1;
              
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: Colors.deepPurple,
                          shape: BoxShape.circle,
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 80,
                          color: Colors.deepPurple.withOpacity(0.3),
                        ),
                    ],
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: _buildEnhancedActivityCard(activity, index),
                  ),
                ],
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
  
  Widget _buildEnhancedActivityCard(Map<String, dynamic> activity, int index) {
    return Container(
      margin: EdgeInsets.only(bottom: 16),
      child: Card(
        elevation: 1,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (activity['imageURL'] != null)
              ClipRRect(
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                child: Image.network(
                  activity['imageURL'],
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) => Container(
                    height: 120,
                    color: Colors.grey[200],
                    child: Icon(Icons.image, size: 40, color: Colors.grey),
                  ),
                ),
              ),
            Padding(
              padding: EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        activity['icon'] ?? '📍',
                        style: TextStyle(fontSize: 24),
                      ),
                      SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              activity['activityTitle'] ?? 'Activity',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            Row(
                              children: [
                                Icon(Icons.access_time, size: 12, color: Colors.grey[600]),
                                SizedBox(width: 4),
                                Text(
                                  activity['timeOfDay'] ?? '',
                                  style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                ),
                                if (activity['estimatedDuration'] != null) ...[
                                  SizedBox(width: 8),
                                  Icon(Icons.timer, size: 12, color: Colors.grey[600]),
                                  SizedBox(width: 4),
                                  Text(
                                    activity['estimatedDuration'],
                                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (activity['category'] != null)
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.deepPurple.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            activity['category'],
                            style: TextStyle(fontSize: 10, color: Colors.deepPurple, fontWeight: FontWeight.w600),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    activity['description'] ?? '',
                    style: TextStyle(fontSize: 13, height: 1.4, color: Colors.grey[700]),
                  ),
                  if (activity['estimatedCost'] != null) ...[
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.euro, size: 14, color: Colors.green[700]),
                        SizedBox(width: 4),
                        Text(
                          activity['estimatedCost'],
                          style: TextStyle(fontSize: 12, color: Colors.green[700], fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton.icon(
                        onPressed: () => _editActivity(_selectedDayIndex, index),
                        icon: Icon(Icons.edit, size: 16),
                        label: Text('Edit', style: TextStyle(fontSize: 12)),
                        style: TextButton.styleFrom(foregroundColor: Colors.deepPurple),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCostEstimate() {
    final dailyPlans = _tripPlan!['dailyPlans'] as List? ?? [];
    double totalCost = 0;
    int activitiesWithCost = 0;
    
    for (final day in dailyPlans) {
      final activities = day['activities'] as List? ?? [];
      for (final activity in activities) {
        final costStr = activity['estimatedCost'] as String?;
        if (costStr != null) {
          final match = RegExp(r'\d+').firstMatch(costStr);
          if (match != null) {
            totalCost += double.parse(match.group(0)!);
            activitiesWithCost++;
          }
        }
      }
    }
    
    if (activitiesWithCost == 0) return SizedBox.shrink();
    
    return Card(
      elevation: 2,
      color: Colors.green[50],
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.account_balance_wallet, color: Colors.green[700]),
                SizedBox(width: 8),
                Text(
                  'Estimated Cost',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green[800]),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Total Activities', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    Text('€${totalCost.toStringAsFixed(0)}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.green[700])),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Per Person', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    Text('€${(totalCost / _travelerCount).toStringAsFixed(0)}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green[600])),
                  ],
                ),
              ],
            ),
            SizedBox(height: 8),
            Text(
              'Based on $_travelerCount traveler${_travelerCount > 1 ? 's' : ''} • Excludes accommodation & transport',
              style: TextStyle(fontSize: 11, color: Colors.grey[600], fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }
  
  void _editDay(int dayIndex) {
    final day = (_tripPlan!['dailyPlans'] as List)[dayIndex];
    final titleController = TextEditingController(text: day['title']);
    final themeController = TextEditingController(text: day['theme'] ?? '');
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Day ${dayIndex + 1}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: InputDecoration(labelText: 'Title', border: OutlineInputBorder()),
            ),
            SizedBox(height: 12),
            TextField(
              controller: themeController,
              decoration: InputDecoration(labelText: 'Theme', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                day['title'] = titleController.text;
                day['theme'] = themeController.text;
              });
              Navigator.pop(context);
            },
            child: Text('Save'),
          ),
        ],
      ),
    );
  }
  
  void _editActivity(int dayIndex, int activityIndex) {
    final activity = ((_tripPlan!['dailyPlans'] as List)[dayIndex]['activities'] as List)[activityIndex];
    final titleController = TextEditingController(text: activity['activityTitle']);
    final descController = TextEditingController(text: activity['description']);
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Edit Activity'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: InputDecoration(labelText: 'Title', border: OutlineInputBorder()),
              ),
              SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: InputDecoration(labelText: 'Description', border: OutlineInputBorder()),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                activity['activityTitle'] = titleController.text;
                activity['description'] = descController.text;
              });
              Navigator.pop(context);
            },
            child: Text('Save'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInfoChip(IconData icon, String text, Color color) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          SizedBox(width: 4),
          Text(text, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
  
  List<Widget> _buildDailyPlans() {
    final dailyPlans = _tripPlan!['dailyPlans'] as List? ?? [];
    return dailyPlans.asMap().entries.map<Widget>((entry) {
      final index = entry.key;
      final day = entry.value;
      return Card(
        margin: EdgeInsets.only(bottom: 16),
        elevation: 2,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.deepPurple, Colors.purple[300]!],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          day['title'] ?? 'Day ${day['day']}',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        if (day['theme'] != null && day['theme'].isNotEmpty)
                          Text(
                            day['theme'],
                            style: TextStyle(fontSize: 12, color: Colors.purple[600], fontStyle: FontStyle.italic),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
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
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.deepPurple.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Text(
                activity['icon'] ?? '📍',
                style: TextStyle(fontSize: 20),
              ),
            ),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        activity['activityTitle'] ?? 'Activity',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ),
                    if (activity['category'] != null)
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.deepPurple.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          activity['category'],
                          style: TextStyle(fontSize: 10, color: Colors.deepPurple, fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ),
                SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                    SizedBox(width: 4),
                    Text(
                      activity['timeOfDay'] ?? '',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
                SizedBox(height: 6),
                Text(
                  activity['description'] ?? '',
                  style: TextStyle(fontSize: 13, height: 1.4),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 365)),
      initialDateRange: _startDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(primary: Colors.deepPurple),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }
  
  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
  
  int _calculateDays() {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }
  
  Future<void> _generateAIPlan() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please select travel dates'),
          backgroundColor: Colors.orange,
          action: SnackBarAction(label: 'OK', textColor: Colors.white, onPressed: () {}),
        ),
      );
      return;
    }
    
    // Interests are now optional - removed validation
    
    await _savePreferences();

    setState(() {
      _isLoading = true;
      _loadingMessage = 'Analyzing your preferences...';
    });
    
    await Future.delayed(Duration(seconds: 1));
    setState(() => _loadingMessage = 'Finding best destinations...');
    
    await Future.delayed(Duration(seconds: 1));
    setState(() => _loadingMessage = 'Creating personalized itinerary...');

    try {
      final days = _calculateDays();
      final tripPlan = await AITripService.generateTripPlan(
        destination: _destinationController.text,
        duration: '$days days',
        interests: _selectedInterests.isEmpty ? null : _selectedInterests.join(', '),
        pace: _pace,
        budget: _budget,
      );

      setState(() {
        _loadingMessage = 'Finalizing your trip plan...';
      });
      
      await Future.delayed(Duration(milliseconds: 500));
      
      setState(() {
        _tripPlan = tripPlan;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to generate plan: $e'),
          backgroundColor: Colors.red,
          action: SnackBarAction(
            label: 'Retry',
            textColor: Colors.white,
            onPressed: _generateAIPlan,
          ),
        ),
      );
    }
  }
  
  Future<void> _regeneratePlan() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Regenerate Plan?'),
        content: Text('This will create a new plan with the same preferences. Your current plan will be replaced.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.deepPurple),
            child: Text('Regenerate'),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      setState(() => _tripPlan = null);
      await _generateAIPlan();
    }
  }

  Future<void> _saveTripPlan() async {
    if (_tripPlan == null) return;

    try {
      // Calculate totals from AI data
      double totalCost = 0;
      final dailyPlansData = _tripPlan!['dailyPlans'] as List? ?? [];
      for (final day in dailyPlansData) {
        final activities = day['activities'] as List? ?? [];
        for (final activity in activities) {
          final costStr = activity['estimatedCost'] as String?;
          if (costStr != null) {
            final match = RegExp(r'\d+').firstMatch(costStr);
            if (match != null) {
              totalCost += double.parse(match.group(0)!);
            }
          }
        }
      }
      
      // Convert AI response to TripPlan model
      final tripPlan = TripPlan(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        tripTitle: (_tripPlan!['tripTitle'] as String?) ?? 'AI Generated Trip',
        destination: (_tripPlan!['destination'] as String?) ?? _destinationController.text,
        duration: (_tripPlan!['duration'] as String?) ?? '${_calculateDays()} days',
        introduction: (_tripPlan!['introduction'] as String?) ?? '',
        conclusion: (_tripPlan!['conclusion'] as String?) ?? 'Enjoy your trip!',
        totalEstimatedCost: totalCost > 0 ? '€${totalCost.toStringAsFixed(0)}' : '€0',
        estimatedWalkingDistance: '${_calculateDays() * 5} km',
        dailyPlans: (_tripPlan!['dailyPlans'] as List? ?? []).map((dayData) {
          return DailyTripPlan(
            day: (dayData['day'] as int?) ?? 1,
            title: (dayData['title'] as String?) ?? 'Day ${dayData['day']}',
            theme: (dayData['theme'] as String?) ?? '',
            activities: (dayData['activities'] as List? ?? []).map((activityData) {
              return ActivityDetail(
                timeOfDay: (activityData['timeOfDay'] as String?) ?? '09:00',
                activityTitle: (activityData['activityTitle'] as String?) ?? 'Activity',
                description: (activityData['description'] as String?) ?? '',
                category: (activityData['category'] as String?) ?? 'activity',
                icon: (activityData['icon'] as String?) ?? '📍',
                location: (activityData['location'] as String?) ?? '',
                estimatedDuration: (activityData['estimatedDuration'] as String?) ?? '2 hours',
                estimatedCost: (activityData['estimatedCost'] as String?) ?? '',
                notes: (activityData['notes'] as String?) ?? '',
                duration: (activityData['estimatedDuration'] as String?) ?? '2 hours',
                place: null,
                type: (activityData['category'] as String?) ?? 'activity',
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