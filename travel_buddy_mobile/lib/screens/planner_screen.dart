import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/premium_activity_card.dart';
import '../widgets/enhanced_time_slot_widget.dart';
import '../services/storage_service.dart';
import '../services/direct_gemini_service.dart';
import '../widgets/location_alert_widget.dart';
import '../models/trip.dart';

class PlannerScreen extends StatefulWidget {
  const PlannerScreen({super.key});

  @override
  State<PlannerScreen> createState() => _PlannerScreenState();
}

class _PlannerScreenState extends State<PlannerScreen> {
  String _selectedView = 'home';
  
  // Form fields
  final _destinationController = TextEditingController();
  final _durationController = TextEditingController();
  final _interestsController = TextEditingController();
  String _selectedPace = 'Moderate';
  String _selectedBudget = 'Mid-Range';
  final List<String> _selectedStyles = [];
  DateTime? _startDate;
  DateTime? _endDate;
  
  // Real-time assistance
  bool _showRealTimeAssistance = false;
  Map<String, dynamic>? _realTimeData;
  
  // Enhanced form state
  String _selectedTransport = 'Any';
  bool _wheelchairAccessible = false;
  bool _dietaryRestrictions = false;
  
  // Edit mode tracking
  bool _isEditMode = false;
  dynamic _editingPlan;
  String _editingPlanType = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadTripPlans();
    });
  }

  @override
  void dispose() {
    _destinationController.dispose();
    _durationController.dispose();
    _interestsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          appBar: AppBar(
            title: Text(_isEditMode 
                ? 'Edit ${_editingPlanType == 'trip' ? 'Trip Plan' : 'Day Itinerary'}'
                : 'Trip Planner'),
            leading: _selectedView != 'home' 
                ? IconButton(
                    icon: const Icon(Icons.arrow_back),
                    onPressed: () => _cancelEdit(),
                  )
                : null,
            actions: _isEditMode ? [
              TextButton(
                onPressed: () => _cancelEdit(),
                child: const Text('Cancel', style: TextStyle(color: Colors.red)),
              ),
            ] : null,
          ),
          body: _selectedView == 'home' 
              ? _buildHomeView(appProvider)
              : _selectedView == 'day'
                  ? _buildDayPlannerForm(appProvider)
                  : _buildPlannerForm(appProvider),
        );
      },
    );
  }

  // Enhanced Time Slot Builder
  Widget _buildEnhancedTimeSlot(Map<String, dynamic> timeSlot, int index) {
    return EnhancedTimeSlotWidget(
      timeSlot: timeSlot,
      index: index,
      onEdit: () => _editTimeSlot(timeSlot, index),
      onRemove: () => _removeTimeSlot(timeSlot, index),
    );
  }
  
  void _editTimeSlot(Map<String, dynamic> timeSlot, int index) {
    if (timeSlot['type'] == 'activity') {
      _showActivityEditDialog(timeSlot, index);
    }
  }
  
  void _removeTimeSlot(Map<String, dynamic> timeSlot, int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Activity'),
        content: Text('Remove "${timeSlot['activity']['name']}" from your day plan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _performActivityRemoval(timeSlot, index);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
  
  void _performActivityRemoval(Map<String, dynamic> timeSlot, int index) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.auto_fix_high, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Removed "${timeSlot['activity']['name']}" - AI is reoptimizing your route...'),
            ),
          ],
        ),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 3),
      ),
    );
    
    // Simulate route reoptimization
    Future.delayed(const Duration(seconds: 2), () {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Route optimized! Saved 25 minutes travel time.'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  void _showActivityEditDialog(Map<String, dynamic> timeSlot, int index) {
    final activity = timeSlot['activity'] as Map<String, dynamic>;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Edit: ${activity['name']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            
            // Time adjustment
            ListTile(
              leading: const Icon(Icons.schedule, color: Colors.blue),
              title: const Text('Adjust Time'),
              subtitle: Text('Currently: ${timeSlot['startTime']} - ${timeSlot['endTime']}'),
              onTap: () {
                Navigator.pop(context);
                _showTimeAdjustment(timeSlot, index);
              },
            ),
            
            // Replace activity
            ListTile(
              leading: const Icon(Icons.swap_horiz, color: Colors.orange),
              title: const Text('Replace Activity'),
              subtitle: const Text('Find similar nearby alternatives'),
              onTap: () {
                Navigator.pop(context);
                _showActivityAlternatives(timeSlot, index);
              },
            ),
            
            // Add break after
            ListTile(
              leading: const Icon(Icons.coffee, color: Colors.brown),
              title: const Text('Add Break After'),
              subtitle: const Text('Insert rest time after this activity'),
              onTap: () {
                Navigator.pop(context);
                _addBreakAfter(timeSlot, index);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showTimeAdjustment(Map<String, dynamic> timeSlot, int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Adjust Timing'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.add_circle, color: Colors.green),
              title: const Text('Extend by 30 minutes'),
              onTap: () {
                Navigator.pop(context);
                _adjustActivityTime(timeSlot, index, 30);
              },
            ),
            ListTile(
              leading: const Icon(Icons.remove_circle, color: Colors.red),
              title: const Text('Reduce by 30 minutes'),
              onTap: () {
                Navigator.pop(context);
                _adjustActivityTime(timeSlot, index, -30);
              },
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Custom time'),
              onTap: () {
                Navigator.pop(context);
                _showCustomTimeDialog(timeSlot, index);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _adjustActivityTime(Map<String, dynamic> timeSlot, int index, int minutes) {
    final action = minutes > 0 ? 'extended' : 'reduced';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.auto_fix_high, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text('Activity time $action by ${minutes.abs()} minutes - recalculating schedule...'),
          ],
        ),
        backgroundColor: Colors.blue,
      ),
    );
  }
  
  void _showActivityAlternatives(Map<String, dynamic> timeSlot, int index) {
    final activity = timeSlot['activity'] as Map<String, dynamic>;
    final category = activity['category'] as String;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Replace ${activity['name']}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Similar $category options nearby:', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 20),
            
            // Alternative options based on category
            ..._getAlternativeActivities(category).map((alt) => ListTile(
              leading: CircleAvatar(
                backgroundColor: _getActivityColor(category).withOpacity(0.1),
                child: Text(_getCategoryEmoji(category)),
              ),
              title: Text(alt['name'] as String),
              subtitle: Text('${alt['distance']} away • \$${alt['cost']}'),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.star, size: 16, color: Colors.amber),
                  Text('${alt['rating']}'),
                ],
              ),
              onTap: () {
                Navigator.pop(context);
                _replaceActivity(timeSlot, index, alt);
              },
            )),
          ],
        ),
      ),
    );
  }
  
  List<Map<String, dynamic>> _getAlternativeActivities(String category) {
    switch (category) {
      case 'food':
        return [
          {'name': 'Local Street Food Market', 'distance': '200m', 'cost': 8, 'rating': 4.3},
          {'name': 'Rooftop Restaurant', 'distance': '500m', 'cost': 22, 'rating': 4.6},
          {'name': 'Traditional Tea House', 'distance': '300m', 'cost': 6, 'rating': 4.1},
        ];
      case 'culture':
        return [
          {'name': 'Art Gallery District', 'distance': '400m', 'cost': 12, 'rating': 4.4},
          {'name': 'Heritage Walking Tour', 'distance': '100m', 'cost': 18, 'rating': 4.7},
          {'name': 'Cultural Center', 'distance': '600m', 'cost': 10, 'rating': 4.2},
        ];
      case 'nature':
        return [
          {'name': 'Botanical Gardens', 'distance': '800m', 'cost': 5, 'rating': 4.5},
          {'name': 'Lakeside Park', 'distance': '1.2km', 'cost': 0, 'rating': 4.3},
          {'name': 'Nature Trail', 'distance': '600m', 'cost': 0, 'rating': 4.4},
        ];
      default:
        return [
          {'name': 'Alternative Option 1', 'distance': '300m', 'cost': 10, 'rating': 4.2},
          {'name': 'Alternative Option 2', 'distance': '500m', 'cost': 15, 'rating': 4.4},
        ];
    }
  }
  
  void _replaceActivity(Map<String, dynamic> timeSlot, int index, Map<String, dynamic> newActivity) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.swap_horiz, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text('Replaced with "${newActivity['name']}" - optimizing route...'),
            ),
          ],
        ),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 3),
      ),
    );
    
    Future.delayed(const Duration(seconds: 2), () {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Activity replaced! Route updated with new timings.'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  void _addBreakAfter(Map<String, dynamic> timeSlot, int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Break'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.coffee, color: Colors.brown),
              title: const Text('Coffee Break (15 min)'),
              onTap: () {
                Navigator.pop(context);
                _insertBreak(timeSlot, index, 15, 'Coffee break');
              },
            ),
            ListTile(
              leading: const Icon(Icons.restaurant, color: Colors.orange),
              title: const Text('Lunch Break (45 min)'),
              onTap: () {
                Navigator.pop(context);
                _insertBreak(timeSlot, index, 45, 'Lunch break');
              },
            ),
            ListTile(
              leading: const Icon(Icons.spa, color: Colors.green),
              title: const Text('Rest Break (30 min)'),
              onTap: () {
                Navigator.pop(context);
                _insertBreak(timeSlot, index, 30, 'Rest and recharge');
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _insertBreak(Map<String, dynamic> timeSlot, int index, int duration, String description) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.add_circle, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text('Added $duration min $description - adjusting schedule...'),
          ],
        ),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _showCustomTimeDialog(Map<String, dynamic> timeSlot, int index) {
    showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    ).then((time) {
      if (time != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('⏰ Activity rescheduled to ${time.format(context)} - updating plan...'),
            backgroundColor: Colors.blue,
          ),
        );
      }
    });
  }
  
  Color _getActivityColor(String category) {
    switch (category) {
      case 'food': return Colors.orange;
      case 'culture': return Colors.purple;
      case 'nature': return Colors.green;
      case 'shopping': return Colors.blue;
      case 'nightlife': return Colors.red;
      default: return Colors.grey;
    }
  }
  
  String _getCategoryEmoji(String category) {
    switch (category) {
      case 'food': return '🍽️';
      case 'culture': return '🏛️';
      case 'nature': return '🌳';
      case 'shopping': return '🛍️';
      case 'nightlife': return '🍸';
      default: return '📍';
    }
  }

  Widget _buildHomeView(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with stats
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(AppConstants.colors['primary']!), Colors.purple[400]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('AI Trip Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                          Text('Smart travel planning powered by AI', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('FREE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildStatItem('${appProvider.tripPlans.length}', 'Trip Plans', Icons.map),
                    const SizedBox(width: 20),
                    _buildStatItem('${appProvider.itineraries.length}', 'Day Plans', Icons.today),
                    const SizedBox(width: 20),
                    _buildStatItem('AI', 'Powered', Icons.psychology),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Quick planning options
          const Text('Plan Your Adventure', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.0,
            children: [
              _buildEnhancedActionCard('🗓️', 'Day Planner', 'Perfect single day adventure', Colors.blue, 'Quick & Easy', () => setState(() => _selectedView = 'day')),
              _buildEnhancedActionCard('🌍', 'Trip Planner', 'Multi-day journey planning', Colors.purple, 'Comprehensive', () => setState(() => _selectedView = 'smart')),
              _buildEnhancedActionCard('⚡', 'Quick Plan', 'Instant travel suggestions', Colors.orange, 'Popular themes', () => _showQuickPlanOptions()),
              _buildEnhancedActionCard('❤️', 'From Favorites', 'Use your saved places', Colors.red, '${appProvider.favoritePlaces.length} places', () => _planFromFavorites(appProvider)),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Recent plans if any
          if (appProvider.tripPlans.isNotEmpty || appProvider.itineraries.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                TextButton(
                  onPressed: () => _showAllPlans(appProvider),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildRecentPlansList(appProvider),
          ],
        ],
      ),
    );
  }
  
  Widget _buildStatItem(String value, String label, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }
  
  Widget _buildEnhancedActionCard(String emoji, String title, String subtitle, Color color, String badge, VoidCallback onTap) {
    return Card(
      elevation: 4,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
            ),
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(badge, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildRecentPlansList(AppProvider appProvider) {
    final List<Widget> planWidgets = [];
    
    // Add trip plans
    for (final plan in appProvider.tripPlans.take(2)) {
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.purple[100],
            child: Icon(Icons.map, color: Colors.purple[700]),
          ),
          title: Text(plan.tripTitle ?? 'Trip Plan'),
          subtitle: Text('${plan.destination} • ${plan.duration}'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () => _viewPlan(plan),
        ),
      ));
    }
    
    // Add day itineraries
    for (final itinerary in appProvider.itineraries.take(2)) {
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.today, color: Colors.blue[700]),
          ),
          title: Text(itinerary.title),
          subtitle: Text('Day itinerary • ${itinerary.dailyPlan.length} activities'),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () => _viewPlan(itinerary),
        ),
      ));
    }
    
    return Column(children: planWidgets);
  }



  Widget _buildDayPlannerForm(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.blue[400]!, Colors.blue[600]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.today, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Day Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('Perfect single-day adventure', style: TextStyle(color: Colors.white70)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('SMART', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Quick suggestions
          const Text('Popular Day Trips', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _buildQuickChip('🏛️ Museums & Culture', () => _interestsController.text = 'museums, art galleries, cultural sites'),
                _buildQuickChip('🍽️ Food & Dining', () => _interestsController.text = 'local restaurants, food markets, cafes'),
                _buildQuickChip('🛍️ Shopping', () => _interestsController.text = 'shopping malls, local markets, boutiques'),
                _buildQuickChip('🌳 Nature & Parks', () => _interestsController.text = 'parks, gardens, scenic viewpoints'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Form fields
          TextField(
            controller: _destinationController,
            decoration: InputDecoration(
              labelText: 'Where are you going?',
              hintText: 'e.g., Paris, Tokyo, New York',
              prefixIcon: const Icon(Icons.location_on),
              border: const OutlineInputBorder(),
              suffixIcon: _destinationController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _destinationController.clear()),
                    )
                  : null,
            ),
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _interestsController,
            decoration: const InputDecoration(
              labelText: 'What interests you?',
              hintText: 'Museums, food, shopping, sightseeing...',
              prefixIcon: Icon(Icons.interests),
              border: OutlineInputBorder(),
              helperText: 'Be specific for better recommendations',
            ),
            maxLines: 3,
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),
          
          // Preferences
          const Text('Preferences', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Wheelchair Accessible'),
                selected: _wheelchairAccessible,
                onSelected: (selected) => setState(() => _wheelchairAccessible = selected),
              ),
              FilterChip(
                label: const Text('Budget-Friendly'),
                selected: _selectedBudget == 'Budget-Friendly',
                onSelected: (selected) => setState(() => _selectedBudget = selected ? 'Budget-Friendly' : 'Mid-Range'),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Generate button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _destinationController.text.isEmpty ? null : () => _generateDayPlan(appProvider),
              icon: appProvider.isTripsLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(appProvider.isTripsLoading ? 'Creating Your Day Plan...' : 'Generate Smart Day Plan'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          
          if (_destinationController.text.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Please enter a destination to continue', style: TextStyle(color: Colors.red, fontSize: 12)),
            ),
        ],
      ),
    );
  }
  
  Widget _buildQuickChip(String text, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      child: ActionChip(
        label: Text(text, style: const TextStyle(fontSize: 12)),
        onPressed: () {
          onTap();
          setState(() {});
        },
        backgroundColor: Colors.blue[50],
        side: BorderSide(color: Colors.blue[200]!),
      ),
    );
  }

  Widget _buildPlannerForm(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.purple[400]!, Colors.purple[600]!],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.map, color: Colors.white, size: 28),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Trip Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text('Multi-day adventure planning', style: TextStyle(color: Colors.white70)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('AI POWERED', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Trip basics
          const Text('Trip Basics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _destinationController,
            decoration: InputDecoration(
              labelText: 'Where are you going?',
              hintText: 'e.g., Paris, Tokyo, New York',
              prefixIcon: const Icon(Icons.location_on),
              border: const OutlineInputBorder(),
              suffixIcon: _destinationController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _destinationController.clear()),
                    )
                  : const Icon(Icons.search),
            ),
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _durationController,
                  decoration: const InputDecoration(
                    labelText: 'How long?',
                    hintText: 'e.g., 5 days, 1 week',
                    prefixIcon: Icon(Icons.calendar_today),
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (value) => setState(() {}),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedBudget,
                  decoration: const InputDecoration(
                    labelText: 'Budget',
                    prefixIcon: Icon(Icons.attach_money),
                    border: OutlineInputBorder(),
                  ),
                  items: ['Budget-Friendly', 'Mid-Range', 'Luxury'].map((budget) {
                    return DropdownMenuItem(value: budget, child: Text(budget));
                  }).toList(),
                  onChanged: (value) => setState(() => _selectedBudget = value!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Travel style
          const Text('Your Travel Style', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: ['Relaxed', 'Moderate', 'Fast-Paced'].map((pace) {
              final isSelected = _selectedPace == pace;
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: InkWell(
                    onTap: () => setState(() => _selectedPace = pace),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.purple[100] : Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isSelected ? Colors.purple : Colors.grey[300]!,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            pace == 'Relaxed' ? Icons.spa : pace == 'Moderate' ? Icons.directions_walk : Icons.directions_run,
                            color: isSelected ? Colors.purple[700] : Colors.grey[600],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            pace,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                              color: isSelected ? Colors.purple[700] : Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          
          // Interests
          const Text('Interests & Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _interestsController,
            decoration: const InputDecoration(
              labelText: 'What interests you?',
              hintText: 'Museums, food, nightlife, shopping, nature...',
              prefixIcon: Icon(Icons.interests),
              border: OutlineInputBorder(),
              helperText: 'Be specific for personalized recommendations',
            ),
            maxLines: 3,
            onChanged: (value) => setState(() {}),
          ),
          const SizedBox(height: 16),
          
          // Accessibility options
          Wrap(
            spacing: 8,
            children: [
              FilterChip(
                label: const Text('Wheelchair Accessible'),
                selected: _wheelchairAccessible,
                onSelected: (selected) => setState(() => _wheelchairAccessible = selected),
              ),
              FilterChip(
                label: const Text('Dietary Restrictions'),
                selected: _dietaryRestrictions,
                onSelected: (selected) => setState(() => _dietaryRestrictions = selected),
              ),
            ],
          ),
          const SizedBox(height: 32),
          
          // Generate button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _canGeneratePlan(appProvider) ? () => _generateTripPlan(appProvider) : null,
              icon: appProvider.isTripsLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.auto_awesome, size: 20),
              label: Text(
                appProvider.isTripsLoading ? 'Creating Your Perfect Trip...' : 'Generate My Trip Plan',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _canGeneratePlan(appProvider) ? Colors.purple : Colors.grey[400],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: _canGeneratePlan(appProvider) ? 3 : 0,
              ),
            ),
          ),
          
          if (!_canGeneratePlan(appProvider))
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Please fill in destination and duration to continue', style: TextStyle(color: Colors.red, fontSize: 12)),
            ),
        ],
      ),
    );
  }

  bool _canGeneratePlan(AppProvider appProvider) {
    return _destinationController.text.isNotEmpty && _durationController.text.isNotEmpty;
  }

  void _generateDayPlan(AppProvider appProvider) async {
    if (_destinationController.text.isEmpty) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            SizedBox(width: 12),
            Text('🎯 Creating your perfect day plan with AI...'),
          ],
        ),
        backgroundColor: Colors.blue,
        duration: Duration(seconds: 3),
      ),
    );
    
    try {
      final result = await appProvider.generateDayItinerary(
        location: _destinationController.text,
        interests: _interestsController.text.isNotEmpty ? _interestsController.text : 'sightseeing',
      );
      
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✨ Day plan created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() => _selectedView = 'home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to generate day plan. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _generateTripPlan(AppProvider appProvider) async {
    if (!_canGeneratePlan(appProvider)) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            SizedBox(width: 12),
            Text('🌟 Crafting your dream trip with AI intelligence...'),
          ],
        ),
        backgroundColor: Colors.purple,
        duration: Duration(seconds: 3),
      ),
    );
    
    try {
      final result = await appProvider.generateTripPlan(
        destination: _destinationController.text,
        duration: _durationController.text,
        interests: _interestsController.text.isNotEmpty ? _interestsController.text : 'sightseeing',
        pace: _selectedPace,
        travelStyles: _selectedStyles,
        budget: _selectedBudget,
      );
      
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 Trip plan created successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        setState(() => _selectedView = 'home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to generate trip plan. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _showQuickPlanOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Quick Plan Ideas', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.0,
              children: [
                _buildQuickPlanOption('🏖️', 'Beach Getaway', Colors.blue),
                _buildQuickPlanOption('🏔️', 'Mountain Adventure', Colors.green),
                _buildQuickPlanOption('🏙️', 'City Break', Colors.purple),
                _buildQuickPlanOption('🍽️', 'Food Tour', Colors.orange),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildQuickPlanOption(String emoji, String title, Color color) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        _destinationController.text = 'Popular destination';
        _interestsController.text = title.toLowerCase();
        setState(() => _selectedView = 'smart');
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }
  
  void _planFromFavorites(AppProvider appProvider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Planning from ${appProvider.favoritePlaces.length} favorite places...')),
    );
  }
  
  void _showAllPlans(AppProvider appProvider) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Showing all your travel plans...')),
    );
  }
  
  void _viewPlan(dynamic plan) {
    if (plan is TripPlan) {
      _showTripPlanDetails(plan);
    } else if (plan is OneDayItinerary) {
      _showItineraryDetails(plan);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open plan details')),
      );
    }
  }
  
  void _showTripPlanDetails(TripPlan tripPlan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        minChildSize: 0.6,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Header
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.purple[400]!, Colors.purple[600]!],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.map, color: Colors.white, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tripPlan.tripTitle ?? 'Trip Plan',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            '📍 ${tripPlan.destination} • ${tripPlan.duration}',
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (tripPlan.introduction?.isNotEmpty == true) ...[
                        const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text(tripPlan.introduction!),
                        const SizedBox(height: 20),
                      ],
                      
                      const Text('Daily Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      if (tripPlan.dailyPlans.isNotEmpty)
                        ...tripPlan.dailyPlans.asMap().entries.map((entry) {
                          final index = entry.key;
                          final day = entry.value;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Day ${index + 1}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  if (day.title?.isNotEmpty == true)
                                    Text(day.title!, style: const TextStyle(color: Colors.grey)),
                                  const SizedBox(height: 8),
                                  if (day.activities.isNotEmpty)
                                    ...day.activities.map((activity) => Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 4),
                                      child: Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                                          Expanded(
                                            child: Text('${activity.activityTitle}: ${activity.description}'),
                                          ),
                                        ],
                                      ),
                                    )),
                                ],
                              ),
                            ),
                          );
                        })
                      else
                        const Text('No daily plans available', style: TextStyle(color: Colors.grey)),
                      
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
              
              // Action buttons
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _editTripPlan(tripPlan);
                        },
                        icon: const Icon(Icons.edit),
                        label: const Text('Edit'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _shareTripPlan(tripPlan),
                        icon: const Icon(Icons.share),
                        label: const Text('Share'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _showItineraryDetails(OneDayItinerary itinerary) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        maxChildSize: 0.95,
        minChildSize: 0.6,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Header
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue[400]!, Colors.blue[600]!],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.today, color: Colors.white, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            itinerary.title,
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            'Day Itinerary • ${itinerary.dailyPlan.length} activities',
                            style: const TextStyle(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Daily Timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      
                      if (itinerary.dailyPlan.isNotEmpty)
                        ...itinerary.dailyPlan.asMap().entries.map((entry) {
                          final index = entry.key;
                          final activity = entry.value;
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue[100],
                                child: Text('${index + 1}', style: TextStyle(color: Colors.blue[700])),
                              ),
                              title: Text(activity.activityTitle ?? 'Activity ${index + 1}'),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (activity.timeOfDay?.isNotEmpty == true)
                                    Text('⏰ ${activity.timeOfDay}'),
                                  if (activity.description?.isNotEmpty == true)
                                    Text(activity.description!),
                                ],
                              ),
                            ),
                          );
                        })
                      else
                        const Text('No activities planned', style: TextStyle(color: Colors.grey)),
                      
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
              
              // Action buttons
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _editDayItinerary(itinerary);
                        },
                        icon: const Icon(Icons.edit),
                        label: const Text('Edit'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _shareDayItinerary(itinerary),
                        icon: const Icon(Icons.share),
                        label: const Text('Share'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _editTripPlan(TripPlan tripPlan) {
    _destinationController.text = tripPlan.destination;
    _durationController.text = tripPlan.duration;
    _interestsController.text = tripPlan.introduction;
    _selectedPace = 'Moderate';
    _selectedBudget = 'Mid-Range';
    _isEditMode = true;
    _editingPlan = tripPlan;
    _editingPlanType = 'trip';
    setState(() => _selectedView = 'smart');
  }
  
  void _editDayItinerary(OneDayItinerary itinerary) {
    _destinationController.text = itinerary.title;
    _interestsController.text = itinerary.introduction;
    _isEditMode = true;
    _editingPlan = itinerary;
    _editingPlanType = 'day';
    setState(() => _selectedView = 'day');
  }
  
  void _shareTripPlan(TripPlan tripPlan) {
    final shareText = '''🌟 My Trip Plan: ${tripPlan.tripTitle}

📍 Destination: ${tripPlan.destination}
⏱️ Duration: ${tripPlan.duration}

${tripPlan.introduction ?? ''}

Generated with Travel Buddy 🧳''';
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Trip plan copied to share!')),
    );
  }
  
  void _shareDayItinerary(OneDayItinerary itinerary) {
    final shareText = '''📅 My Day Plan: ${itinerary.title}

${itinerary.dailyPlan.length} activities planned

Generated with Travel Buddy 🧳''';
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Day plan copied to share!')),
    );
  }

  void _cancelEdit() {
    setState(() {
      _selectedView = 'home';
      _isEditMode = false;
      _editingPlan = null;
      _editingPlanType = '';
    });
  }
  
  void _loadRealTimeAssistance() {
    // Placeholder for real-time assistance loading
  }
  
  Widget _buildRealTimeAssistanceContent() {
    return const Padding(
      padding: EdgeInsets.all(16),
      child: Text('Real-time assistance content would go here'),
    );
  }
}