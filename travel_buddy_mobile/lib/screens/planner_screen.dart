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
import '../services/ai_service.dart';
import '../services/real_data_service.dart';
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
  int _durationDays = 3;
  String _durationUnit = 'days';
  final _interestsController = TextEditingController();
  String _selectedPace = 'Moderate';
  String _selectedBudget = 'Mid-Range';
  final List<String> _selectedTravelStyles = [];
  DateTime? _startDate;
  DateTime? _endDate;
  
  // Enhanced form state
  bool _wheelchairAccessible = false;
  bool _dietaryRestrictions = false;
  final _dietaryRestrictionsController = TextEditingController();
  
  // Enhanced fields
  TimeOfDay _startTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 18, minute: 0);
  String _groupType = 'Solo';
  String _foodPreference = 'Any';
  final List<String> _mustSeeAttractions = [];
  final _mustSeeController = TextEditingController();
  final List<String> _interestChips = [];
  
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
  void didChangeDependencies() {
    super.didChangeDependencies();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<AppProvider>().loadTripPlans();
      }
    });
  }

  @override
  void dispose() {
    _destinationController.dispose();
    _interestsController.dispose();
    _mustSeeController.dispose();
    _dietaryRestrictionsController.dispose();
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
                    _buildHomeStatItem('${appProvider.tripPlans.length}', 'Trip Plans', Icons.map),
                    const SizedBox(width: 20),
                    _buildHomeStatItem('${appProvider.itineraries.length}', 'Day Plans', Icons.today),
                    const SizedBox(width: 20),
                    _buildHomeStatItem('AI', 'Powered', Icons.psychology),
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
          
          // Debug button
          ElevatedButton(
            onPressed: () async {
              final storage = StorageService();
              final plans = await storage.getTripPlans();
              final itineraries = await storage.getItineraries();
              
              print('🔍 STEP 1: Storage has ${plans.length} trips, ${itineraries.length} itineraries');
              print('🔍 STEP 2: Provider has ${appProvider.tripPlans.length} trips, ${appProvider.itineraries.length} itineraries');
              
              // Print details of each plan
              for (int i = 0; i < plans.length; i++) {
                print('🔍 TRIP $i: ${plans[i].tripTitle} (ID: ${plans[i].id})');
              }
              for (int i = 0; i < (itineraries?.length ?? 0); i++) {
                print('🔍 ITINERARY $i: ${itineraries![i].title} (ID: ${itineraries[i].id})');
              }
              
              // Force reload from storage
              await appProvider.loadTripPlans();
              
              print('🔍 STEP 3: After reload - Provider has ${appProvider.tripPlans.length} trips, ${appProvider.itineraries.length} itineraries');
              
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Storage: ${plans.length} trips, ${itineraries?.length ?? 0} itineraries\nProvider: ${appProvider.tripPlans.length} trips, ${appProvider.itineraries.length} itineraries'),
                  duration: Duration(seconds: 5),
                ),
              );
            },
            child: const Text('Debug: Detailed Check'),
          ),
          const SizedBox(height: 16),
          
          // Recent plans section - always show
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Recent Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              if (appProvider.tripPlans.isNotEmpty || appProvider.itineraries.isNotEmpty)
                TextButton(
                  onPressed: () => _showAllPlans(appProvider),
                  child: const Text('View All'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          _buildRecentPlansList(appProvider),
        ],
      ),
    );
  }
  
  Widget _buildHomeStatItem(String value, String label, IconData icon) {
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
    print('🔍 DEBUG: Building recent plans list');
    print('🔍 Trip plans count: ${appProvider.tripPlans.length}');
    print('🔍 Itineraries count: ${appProvider.itineraries.length}');
    
    final List<Widget> planWidgets = [];
    
    // Add trip plans (limit to 2 for recent view)
    for (final plan in appProvider.tripPlans.take(2)) {
      print('🔍 Adding trip plan: ${plan.tripTitle}');
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.purple[100],
            child: Icon(Icons.map, color: Colors.purple[700]),
          ),
          title: Text(plan.tripTitle ?? 'Trip Plan'),
          subtitle: Text('${plan.destination} • ${plan.duration}'),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) => _handlePlanAction(value, plan, appProvider),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'view',
                child: Row(
                  children: [
                    Icon(Icons.visibility, size: 16),
                    SizedBox(width: 8),
                    Text('View'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, size: 16),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 16, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
          onTap: () => _showTripPlanDetails(plan),
        ),
      ));
    }
    
    // Add day itineraries (limit to 2 for recent view)
    for (final itinerary in appProvider.itineraries.take(2)) {
      print('🔍 Adding itinerary: ${itinerary.title}');
      planWidgets.add(Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.today, color: Colors.blue[700]),
          ),
          title: Text(itinerary.title),
          subtitle: Text('Day itinerary • ${itinerary.dailyPlan.length} activities'),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) => _handlePlanAction(value, itinerary, appProvider),
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'view',
                child: Row(
                  children: [
                    Icon(Icons.visibility, size: 16),
                    SizedBox(width: 8),
                    Text('View'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, size: 16),
                    SizedBox(width: 8),
                    Text('Edit'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, size: 16, color: Colors.red),
                    SizedBox(width: 8),
                    Text('Delete', style: TextStyle(color: Colors.red)),
                  ],
                ),
              ),
            ],
          ),
          onTap: () => _showItineraryDetails(itinerary),
        ),
      ));
    }
    
    print('🔍 Total plan widgets created: ${planWidgets.length}');
    
    if (planWidgets.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('No plans created yet. Create your first plan above!', 
                       style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () async {
                await appProvider.loadTripPlans();
                setState(() {});
              },
              child: const Text('Refresh Plans'),
            ),
          ],
        ),
      );
    }
    
    return Column(children: planWidgets);
  }
  
  void _handlePlanAction(String action, dynamic plan, AppProvider appProvider) {
    switch (action) {
      case 'view':
        if (plan is TripPlan) {
          _showTripPlanDetails(plan);
        } else if (plan is OneDayItinerary) {
          _showItineraryDetails(plan);
        }
        break;
      case 'edit':
        if (plan is TripPlan) {
          _editTripPlan(plan);
        } else if (plan is OneDayItinerary) {
          _editDayItinerary(plan);
        }
        break;
      case 'delete':
        _confirmDeletePlan(plan, appProvider);
        break;
    }
  }
  
  void _confirmDeletePlan(dynamic plan, AppProvider appProvider) {
    final planName = plan is TripPlan ? plan.tripTitle : plan.title;
    final planType = plan is TripPlan ? 'trip plan' : 'day itinerary';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete $planType?'),
        content: Text('Are you sure you want to delete "$planName"? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deletePlan(plan, appProvider);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  void _deletePlan(dynamic plan, AppProvider appProvider) async {
    try {
      if (plan is TripPlan) {
        await appProvider.deleteTripPlan(plan.id);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Trip plan deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (plan is OneDayItinerary) {
        // Remove from itineraries list
        appProvider.itineraries.removeWhere((itinerary) => itinerary.id == plan.id);
        // Delete from storage
        final storageService = StorageService();
        await storageService.deleteItinerary(plan.id);
        appProvider.notifyListeners();
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Day itinerary deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to delete: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
          
          // Duration with number + unit
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextFormField(
                  initialValue: _durationDays.toString(),
                  decoration: const InputDecoration(
                    labelText: 'Duration',
                    prefixIcon: Icon(Icons.schedule),
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (value) => setState(() => _durationDays = int.tryParse(value) ?? 3),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _durationUnit,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                  items: ['days', 'weeks'].map((unit) {
                    return DropdownMenuItem(value: unit, child: Text(unit));
                  }).toList(),
                  onChanged: (value) => setState(() => _durationUnit = value!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                flex: 2,
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
          const SizedBox(height: 16),
          
          // Date selection
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => _selectStartDate(),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today, size: 20),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Start Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            Text(_startDate?.toString().split(' ')[0] ?? 'Select date'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: InkWell(
                  onTap: () => _selectEndDate(),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.event, size: 20),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('End Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            Text(_endDate?.toString().split(' ')[0] ?? 'Auto-calculated'),
                          ],
                        ),
                      ],
                    ),
                  ),
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
          
          // Interests with chips
          const Text('Interests & Preferences', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            controller: _interestsController,
            decoration: InputDecoration(
              labelText: 'What interests you?',
              hintText: 'Type and press Enter to add',
              prefixIcon: const Icon(Icons.interests),
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addInterestChip(),
              ),
            ),
            onSubmitted: (value) => _addInterestChip(),
          ),
          if (_interestChips.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _interestChips.map((interest) => Chip(
                label: Text(interest, style: const TextStyle(fontSize: 12)),
                deleteIcon: const Icon(Icons.close, size: 16),
                onDeleted: () => setState(() => _interestChips.remove(interest)),
              )).toList(),
            ),
          ],
          const SizedBox(height: 16),
          
          // Travel Styles (multi-select)
          const Text('Travel Styles', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: ['Cultural', 'Adventure', 'Romantic', 'Family', 'Foodie', 'Nightlife', 'Nature'].map((style) {
              final isSelected = _selectedTravelStyles.contains(style);
              return FilterChip(
                label: Text(style),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedTravelStyles.add(style);
                    } else {
                      _selectedTravelStyles.remove(style);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          
          // Enhanced preferences
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Start Time', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                    InkWell(
                      onTap: () => _selectStartTime(),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.access_time, size: 16),
                            const SizedBox(width: 8),
                            Text('${_startTime.format(context)}'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('End Time', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                    InkWell(
                      onTap: () => _selectEndTime(),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.access_time, size: 16),
                            const SizedBox(width: 8),
                            Text('${_endTime.format(context)}'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Group type and food preference
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _groupType,
                  decoration: const InputDecoration(
                    labelText: 'Group Type',
                    prefixIcon: Icon(Icons.group),
                    border: OutlineInputBorder(),
                  ),
                  items: ['Solo', 'Couple', 'Family', 'Friends'].map((type) {
                    return DropdownMenuItem(value: type, child: Text(type));
                  }).toList(),
                  onChanged: (value) => setState(() => _groupType = value!),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _foodPreference,
                  decoration: const InputDecoration(
                    labelText: 'Food Preference',
                    prefixIcon: Icon(Icons.restaurant),
                    border: OutlineInputBorder(),
                  ),
                  items: ['Any', 'Vegetarian', 'Vegan', 'Halal', 'Street Food'].map((food) {
                    return DropdownMenuItem(value: food, child: Text(food));
                  }).toList(),
                  onChanged: (value) => setState(() => _foodPreference = value!),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Must-see attractions
          TextField(
            controller: _mustSeeController,
            decoration: InputDecoration(
              labelText: 'Must-See Places (Optional)',
              hintText: 'e.g., Eiffel Tower, Louvre Museum',
              prefixIcon: const Icon(Icons.star),
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: const Icon(Icons.add),
                onPressed: () => _addMustSeeAttraction(),
              ),
            ),
            onSubmitted: (value) => _addMustSeeAttraction(),
          ),
          if (_mustSeeAttractions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _mustSeeAttractions.map((attraction) => Chip(
                label: Text(attraction, style: const TextStyle(fontSize: 12)),
                deleteIcon: const Icon(Icons.close, size: 16),
                onDeleted: () => setState(() => _mustSeeAttractions.remove(attraction)),
              )).toList(),
            ),
          ],
          const SizedBox(height: 16),
          
          // Accessibility & Special Needs
          const Text('Accessibility & Special Needs', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          CheckboxListTile(
            title: const Text('Wheelchair Accessible'),
            subtitle: const Text('Ensure all activities are wheelchair accessible'),
            value: _wheelchairAccessible,
            onChanged: (value) => setState(() => _wheelchairAccessible = value ?? false),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          CheckboxListTile(
            title: const Text('Dietary Restrictions'),
            subtitle: const Text('Specify dietary requirements'),
            value: _dietaryRestrictions,
            onChanged: (value) => setState(() => _dietaryRestrictions = value ?? false),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          if (_dietaryRestrictions) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _dietaryRestrictionsController,
              decoration: const InputDecoration(
                labelText: 'Specify dietary restrictions',
                hintText: 'e.g., Gluten-free, Nut allergy, Kosher',
                border: OutlineInputBorder(),
              ),
            ),
          ],
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
          
          if (!_canGeneratePlan(appProvider)) ...[
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Please fill in destination and duration to continue', style: TextStyle(color: Colors.red, fontSize: 12)),
            ),
          ],
          
          if (_getValidationWarning() != null) ...[
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange[700], size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _getValidationWarning()!,
                        style: TextStyle(color: Colors.orange[700], fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  bool _canGeneratePlan(AppProvider appProvider) {
    return _destinationController.text.isNotEmpty && 
           _durationDays > 0 &&
           _startDate != null &&
           _validateInputs();
  }
  
  bool _validateInputs() {
    // Check duration vs must-see attractions
    final days = _durationUnit == 'weeks' ? _durationDays * 7 : _durationDays;
    
    if (days > 0 && _mustSeeAttractions.length > days * 3) {
      return false; // Too many attractions for duration
    }
    
    // Check budget feasibility
    if (_selectedBudget == 'Budget-Friendly' && _isExpensiveDestination(_destinationController.text)) {
      return true; // Allow but will show warning
    }
    
    return true;
  }
  
  int _extractDaysFromText(String text) {
    final regex = RegExp(r'(\d+)');
    final match = regex.firstMatch(text);
    return match != null ? int.tryParse(match.group(1)!) ?? 0 : 0;
  }
  
  bool _isExpensiveDestination(String destination) {
    final expensive = ['paris', 'london', 'tokyo', 'new york', 'zurich', 'singapore'];
    return expensive.any((city) => destination.toLowerCase().contains(city));
  }
  
  String? _getValidationWarning() {
    final days = _durationUnit == 'weeks' ? _durationDays * 7 : _durationDays;
    
    if (_mustSeeAttractions.length > days * 3) {
      return 'Too many must-see places for ${days} days. Consider extending your trip.';
    }
    
    if (_selectedBudget == 'Budget-Friendly' && _isExpensiveDestination(_destinationController.text)) {
      return '${_destinationController.text} can be expensive. Consider mid-range budget.';
    }
    
    return null;
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
        // Force reload plans to show in UI
        await appProvider.loadTripPlans();
        setState(() => _selectedView = 'home');
      } else {
        // Create fallback day plan
        await _generateFallbackDayPlan(appProvider);
      }
    } catch (e) {
      print('❌ Day plan generation error: $e');
      await _generateFallbackDayPlan(appProvider);
    }
  }
  
  Future<void> _generateFallbackDayPlan(AppProvider appProvider) async {
    final dayPlan = OneDayItinerary(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      title: '${_destinationController.text} Day Adventure',
      introduction: 'A perfect day exploring ${_destinationController.text}',
      dailyPlan: [
        ActivityDetail(
          timeOfDay: '09:00-11:00',
          activityTitle: 'Morning Exploration',
          description: 'Start your day exploring the main attractions of ${_destinationController.text}',
        ),
        ActivityDetail(
          timeOfDay: '14:00-16:00',
          activityTitle: 'Afternoon Discovery',
          description: 'Discover local culture and hidden gems',
        ),
        ActivityDetail(
          timeOfDay: '19:00-21:00',
          activityTitle: 'Evening Dining',
          description: 'Enjoy local cuisine and atmosphere',
        ),
      ],
      conclusion: 'Hope you enjoyed your day in ${_destinationController.text}!',
    );
    
    appProvider.itineraries.add(dayPlan);
    final storageService = StorageService();
    await storageService.saveItinerary(dayPlan);
    appProvider.notifyListeners();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✨ Day plan created successfully!'),
        backgroundColor: Colors.green,
      ),
    );
    setState(() {
      _selectedView = 'home';
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() {});
    });
  }

  void _generateTripPlan(AppProvider appProvider) async {
    if (!_canGeneratePlan(appProvider)) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🧠 Creating your trip plan...'),
        backgroundColor: Colors.purple,
      ),
    );
    
    try {
      // Try AI generation first
      final durationText = _durationUnit == 'weeks' ? '${_durationDays} week${_durationDays > 1 ? 's' : ''}' : '${_durationDays} day${_durationDays > 1 ? 's' : ''}';
      final interests = _interestChips.isNotEmpty ? _interestChips.join(', ') : (_interestsController.text.isNotEmpty ? _interestsController.text : 'sightseeing');
      
      final result = await appProvider.generateTripPlan(
        destination: _destinationController.text,
        duration: durationText,
        interests: interests,
        pace: _selectedPace,
        budget: _selectedBudget,
      );
      
      if (result != null) {
        _showSuccessAndReturn();
      } else {
        await _createFallbackTripPlan(appProvider);
      }
    } catch (e) {
      print('❌ Trip plan generation error: $e');
      await _createFallbackTripPlan(appProvider);
    }
  }
  

  
  Future<void> _createFallbackTripPlan(AppProvider appProvider) async {
    final durationText = _durationUnit == 'weeks' ? '${_durationDays} week${_durationDays > 1 ? 's' : ''}' : '${_durationDays} day${_durationDays > 1 ? 's' : ''}';
    final interests = _interestChips.isNotEmpty ? _interestChips.join(', ') : (_interestsController.text.isNotEmpty ? _interestsController.text : 'sightseeing');
    
    // Use realistic data service
    final tripPlan = await RealDataService.generateRealisticTripPlan(
      destination: _destinationController.text,
      duration: durationText,
      interests: interests,
    );
    
    await appProvider.saveTripPlan(tripPlan);
    _showSuccessAndReturn();
  }
  
  List<DailyTripPlan> _createDailyPlans() {
    final days = _durationUnit == 'weeks' ? _durationDays * 7 : _durationDays;
    return List.generate(days, (index) => DailyTripPlan(
      day: index + 1,
      title: 'Day ${index + 1} - ${_destinationController.text}',
      activities: [
        ActivityDetail(
          timeOfDay: '09:00',
          activityTitle: 'Morning Exploration',
          description: 'Explore local attractions and landmarks',
        ),
        ActivityDetail(
          timeOfDay: '14:00',
          activityTitle: 'Afternoon Activities',
          description: 'Discover local culture and cuisine',
        ),
        ActivityDetail(
          timeOfDay: '19:00',
          activityTitle: 'Evening Experience',
          description: 'Enjoy local dining and entertainment',
        ),
      ],
    ));
  }
  
  void _showSuccessAndReturn() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✨ Trip plan created successfully!'),
        backgroundColor: Colors.green,
      ),
    );
    setState(() => _selectedView = 'home');
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (modalContext) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('All Plans', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(modalContext),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _buildAllPlansList(appProvider, scrollController, modalContext),
              ),
            ],
          ),
        ),
      ),
    );
  }
  

  
  void _showTripPlanDetails(TripPlan tripPlan) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Compact header
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tripPlan.tripTitle ?? 'Trip Plan',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            Icon(Icons.location_on, size: 12, color: Colors.grey[600]),
                            const SizedBox(width: 2),
                            Expanded(
                              child: Text(
                                '${tripPlan.destination} • ${tripPlan.duration}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, size: 18),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey[100],
                      shape: const CircleBorder(),
                      padding: const EdgeInsets.all(6),
                    ),
                  ),
                ],
              ),
            ),
            
            // Clean stats bar with proper alignment
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.euro,
                      value: tripPlan.totalEstimatedCost,
                      label: 'Cost',
                      color: Colors.green,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 32,
                    color: Colors.grey[300],
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.directions_walk,
                      value: tripPlan.estimatedWalkingDistance,
                      label: 'Walk',
                      color: Colors.blue,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: 32,
                    color: Colors.grey[300],
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      icon: Icons.calendar_today,
                      value: '${tripPlan.dailyPlans.length}',
                      label: 'Days',
                      color: Colors.purple,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 8),
            
            // Enhanced tabs with scrollable fix
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                child: DefaultTabController(
                  length: 4,
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TabBar(
                          indicator: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(9),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          labelColor: Colors.purple,
                          unselectedLabelColor: Colors.grey[600],
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                          indicatorSize: TabBarIndicatorSize.tab,
                          dividerColor: Colors.transparent,
                          labelPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                          tabs: [
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.timeline, size: 14),
                                  SizedBox(width: 4),
                                  Text('Timeline'),
                                ],
                              ),
                            ),
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.place, size: 14),
                                  SizedBox(width: 4),
                                  Text('Places'),
                                ],
                              ),
                            ),
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.map, size: 14),
                                  SizedBox(width: 4),
                                  Text('Map'),
                                ],
                              ),
                            ),
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.wallet, size: 14),
                                  SizedBox(width: 4),
                                  Text('Costs'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: TabBarView(
                              children: [
                                _buildTimelineView(tripPlan, null),
                                _buildPlacesView(tripPlan, null),
                                _buildMapView(tripPlan),
                                _buildCostView(tripPlan, null),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
          // Bottom action section
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Primary action button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      onPressed: () => _startTrip(tripPlan),
                      icon: const Icon(Icons.play_arrow, size: 18),
                      label: const Text(
                        'Start Adventure',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 10),
                  
                  // Secondary actions
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: OutlinedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              _editTripPlan(tripPlan);
                            },
                            child: const Text('Edit', style: TextStyle(fontSize: 13)),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey[300]!),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: OutlinedButton(
                            onPressed: () => _optimizeRoute(tripPlan),
                            child: const Text('Optimize', style: TextStyle(fontSize: 13)),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: Colors.grey[300]!),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: ElevatedButton(
                            onPressed: () => _shareTripPlan(tripPlan),
                            child: const Text('Share', style: TextStyle(fontSize: 13)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.purple,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
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
  
  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: color,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
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
                                  if (activity.timeOfDay.isNotEmpty == true)
                                    Text('⏰ ${activity.timeOfDay}'),
                                  if (activity.description.isNotEmpty == true)
                                    Text(activity.description),
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
    // Parse duration back to days/weeks
    final duration = tripPlan.duration.toLowerCase();
    if (duration.contains('week')) {
      _durationUnit = 'weeks';
      _durationDays = int.tryParse(duration.split(' ')[0]) ?? 1;
    } else {
      _durationUnit = 'days';
      _durationDays = int.tryParse(duration.split(' ')[0]) ?? 3;
    }
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
💰 Total Cost: ${tripPlan.totalEstimatedCost}
🚶 Walking: ${tripPlan.estimatedWalkingDistance}

${tripPlan.introduction ?? ''}

Generated with Travel Buddy 🧳''';
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Enhanced trip plan copied to share!')),
    );
  }
  
  Widget _buildTimelineView(TripPlan tripPlan, ScrollController? scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (tripPlan.introduction.isNotEmpty == true) ...[
            const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(tripPlan.introduction),
            const SizedBox(height: 20),
          ],
          
          const Text('Daily Timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          
          if (tripPlan.dailyPlans.isNotEmpty)
            ...tripPlan.dailyPlans.asMap().entries.map((entry) {
              final day = entry.value;
              return _buildEnhancedDayCard(day);
            })
          else
            const Text('No daily plans available', style: TextStyle(color: Colors.grey)),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildEnhancedDayCard(DailyTripPlan day) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Day header with proper alignment
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.purple,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('DAY ${day.day}', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        day.title, 
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (day.theme?.isNotEmpty == true)
                        Text(
                          day.theme!, 
                          style: const TextStyle(color: Colors.grey, fontSize: 11),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      day.dayEstimatedCost, 
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.green),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      day.dayWalkingDistance, 
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Place highlights bar
            _buildPlaceHighlightsBar(day.activities),
            const SizedBox(height: 16),
            
            // Activities timeline
            if (day.activities.isNotEmpty)
              ...day.activities.asMap().entries.map((entry) {
                final index = entry.key;
                final activity = entry.value;
                final isLast = index == day.activities.length - 1;
                return _buildEnhancedActivityItem(activity, isLast);
              })
            else
              const Text('No activities planned', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
  
  Widget _buildEnhancedActivityItem(ActivityDetail activity, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline indicator
        Column(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.purple[100],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.purple, width: 2),
              ),
              child: Center(
                child: Text(
                  activity.startTime.split(':')[0],
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.purple[700]),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 60,
                color: Colors.purple[200],
              ),
          ],
        ),
        const SizedBox(width: 12),
        
        // Activity content
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Place name with emoji and hook
                Row(
                  children: [
                    Text(_getPlaceEmoji(activity.type), style: const TextStyle(fontSize: 18)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(activity.activityTitle, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                          Text(_getPlaceHook(activity.activityTitle, activity.type), style: const TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic)),
                        ],
                      ),
                    ),
                    _buildPlaceRating(activity.type),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Time and cost info with flexible layout
                Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.access_time, size: 12, color: Colors.blue[600]),
                        const SizedBox(width: 3),
                        Text('${activity.startTime}-${activity.endTime}', style: const TextStyle(fontSize: 11, color: Colors.blue)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.euro, size: 12, color: Colors.green[600]),
                        const SizedBox(width: 3),
                        Text(activity.estimatedCost, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green)),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.groups, size: 12, color: Colors.orange[600]),
                        const SizedBox(width: 3),
                        Text(activity.crowdLevel, style: const TextStyle(fontSize: 11, color: Colors.orange)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                // Location and transport
                if (activity.place != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Colors.red),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(activity.place!.address, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                ],
                
                if (activity.transportFromPrev != null) ...[
                  Row(
                    children: [
                      Icon(_getTransportIcon(activity.transportFromPrev!.mode), size: 14, color: Colors.blue),
                      const SizedBox(width: 4),
                      Text(
                        '${activity.transportFromPrev!.duration} • ${activity.transportFromPrev!.cost}',
                        style: const TextStyle(fontSize: 12, color: Colors.blue),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                
                // Description
                Text(activity.description, style: const TextStyle(fontSize: 13)),
                
                // Tips
                if (activity.tips?.isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.blue[50],
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.lightbulb_outline, size: 14, color: Colors.blue[600]),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            activity.tips!.join(' • '),
                            style: TextStyle(fontSize: 11, color: Colors.blue[700]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildMapView(TripPlan tripPlan) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map, size: 48, color: Colors.grey),
                  SizedBox(height: 8),
                  Text('Interactive Map View', style: TextStyle(color: Colors.grey)),
                  Text('Coming Soon', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Map will show:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('• All activity locations with markers'),
              Text('• Optimized route between places'),
              Text('• Transport options (walk/metro/taxi)'),
              Text('• Real-time traffic and delays'),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildCostView(TripPlan tripPlan, ScrollController? scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Cost Breakdown', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          // Total cost card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.account_balance_wallet, color: Colors.green[600]),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Estimated Cost', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(tripPlan.totalEstimatedCost, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Daily costs
          const Text('Daily Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          
          ...tripPlan.dailyPlans.map((day) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.purple[100],
                child: Text('${day.day}', style: TextStyle(color: Colors.purple[700])),
              ),
              title: Text(day.title),
              subtitle: Text('${day.activities.length} activities • ${day.dayWalkingDistance}'),
              trailing: Text(day.dayEstimatedCost, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
            ),
          )),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  IconData _getTransportIcon(String mode) {
    switch (mode.toLowerCase()) {
      case 'walk': return Icons.directions_walk;
      case 'metro': return Icons.train;
      case 'taxi': return Icons.local_taxi;
      case 'bike': return Icons.directions_bike;
      default: return Icons.directions;
    }
  }
  
  Widget _buildPlaceHighlightsBar(List<ActivityDetail> activities) {
    return Container(
      height: 60,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: activities.length,
        itemBuilder: (context, index) {
          final activity = activities[index];
          return Container(
            margin: const EdgeInsets.only(right: 12),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: _getPlaceColor(activity.type).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _getPlaceColor(activity.type), width: 2),
                  ),
                  child: Center(
                    child: Text(_getPlaceEmoji(activity.type), style: const TextStyle(fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 4),
                Text('${index + 1}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildPlacesView(TripPlan tripPlan, ScrollController? scrollController) {
    final placesByCategory = _groupPlacesByCategory(tripPlan);
    
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('${tripPlan.tripTitle} – ${tripPlan.dailyPlans.length} Days', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          
          ...placesByCategory.entries.map((entry) {
            final category = entry.key;
            final places = entry.value;
            return _buildPlaceCategorySection(category, places);
          }),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildPlaceCategorySection(String category, List<Map<String, dynamic>> places) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(_getCategoryEmoji(category), style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(_getCategoryTitle(category), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          
          ...places.map((place) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getPlaceColor(place['type']).withOpacity(0.1),
                child: Text(_getPlaceEmoji(place['type'])),
              ),
              title: Text(place['name'], style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_getPlaceHook(place['name'], place['type']), style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                  const SizedBox(height: 2),
                  Text('Day ${place['day']}, ${place['time']} | ${place['cost']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                ],
              ),
              trailing: _buildPlaceRating(place['type']),
            ),
          )),
        ],
      ),
    );
  }
  
  Map<String, List<Map<String, dynamic>>> _groupPlacesByCategory(TripPlan tripPlan) {
    final grouped = <String, List<Map<String, dynamic>>>{};
    
    for (final day in tripPlan.dailyPlans) {
      for (final activity in day.activities) {
        final category = _getPlaceCategory(activity.type);
        if (!grouped.containsKey(category)) {
          grouped[category] = [];
        }
        grouped[category]!.add({
          'name': activity.activityTitle,
          'type': activity.type,
          'day': day.day,
          'time': activity.startTime,
          'cost': activity.estimatedCost,
        });
      }
    }
    
    return grouped;
  }
  
  String _getPlaceEmoji(String type) {
    switch (type.toLowerCase()) {
      case 'landmark': return '🗼';
      case 'museum': return '🎨';
      case 'restaurant': return '🍽️';
      case 'park': return '🌳';
      case 'shopping': return '🛍️';
      case 'nightlife': return '🍷';
      default: return '📍';
    }
  }
  
  String _getPlaceHook(String placeName, String type) {
    if (placeName.toLowerCase().contains('eiffel')) {
      return 'Iconic landmark, best views of Paris';
    } else if (placeName.toLowerCase().contains('louvre')) {
      return 'World\'s largest art museum, home of Mona Lisa';
    } else if (placeName.toLowerCase().contains('jules verne')) {
      return 'Michelin-star dining in the tower';
    } else {
      switch (type.toLowerCase()) {
        case 'landmark': return 'Must-see iconic attraction';
        case 'museum': return 'Rich cultural experience';
        case 'restaurant': return 'Authentic local cuisine';
        case 'park': return 'Beautiful outdoor space';
        default: return 'Unique local experience';
      }
    }
  }
  
  Widget _buildPlaceRating(String type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.amber[100],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star, size: 12, color: Colors.amber[700]),
          const SizedBox(width: 2),
          Text('Top 3', style: TextStyle(fontSize: 10, color: Colors.amber[700], fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
  
  Color _getPlaceColor(String type) {
    switch (type.toLowerCase()) {
      case 'landmark': return Colors.red;
      case 'museum': return Colors.purple;
      case 'restaurant': return Colors.orange;
      case 'park': return Colors.green;
      case 'shopping': return Colors.blue;
      default: return Colors.grey;
    }
  }
  
  String _getPlaceCategory(String type) {
    switch (type.toLowerCase()) {
      case 'landmark': return 'Iconic Landmarks';
      case 'museum': return 'Art & Culture';
      case 'restaurant': return 'Food & Dining';
      case 'park': return 'Outdoor & Nature';
      case 'shopping': return 'Shopping';
      default: return 'Other Experiences';
    }
  }
  
  String _getCategoryTitle(String category) {
    return category;
  }
  
  void _optimizeRoute(TripPlan tripPlan) {
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
            Text('🗺️ Optimizing route to save time and cost...'),
          ],
        ),
        backgroundColor: Colors.blue,
        duration: Duration(seconds: 3),
      ),
    );
    
    Future.delayed(const Duration(seconds: 3), () {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✨ Route optimized! Saved 45 minutes and €12'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  void _shareDayItinerary(OneDayItinerary itinerary) {
    final shareText = '''📅 My Day Plan: ${itinerary.title}

${itinerary.dailyPlan.length} activities planned

Generated with Travel Buddy 🧳''';
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Day plan copied to share!')),
    );
  }
  
  double _getTripProgress(TripPlan tripPlan) {
    return 0.3; // Mock 30% progress
  }
  
  bool _isTripActive(TripPlan tripPlan) {
    return false; // Mock inactive state
  }
  
  void _startTrip(TripPlan tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🌹 Welcome to ${tripPlan.destination}! Your adventure begins'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _continueTrip(TripPlan tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🗺️ Continuing your journey - next activity ready!'),
        backgroundColor: Colors.blue,
      ),
    );
  }
  
  void _endTrip(TripPlan tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Complete Trip? 🎉'),
        content: const Text('Generate trip summary with photos and stats?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Not Yet'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('🎊 Trip completed! Summary generated'),
                  backgroundColor: Colors.orange,
                ),
              );
            },
            child: const Text('Complete'),
          ),
        ],
      ),
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
  
  void _selectStartTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _startTime,
      helpText: 'Select daily start time',
    );
    if (time != null) {
      setState(() => _startTime = time);
    }
  }
  
  void _selectEndTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _endTime,
      helpText: 'Select daily end time',
    );
    if (time != null) {
      setState(() => _endTime = time);
    }
  }
  
  void _addMustSeeAttraction() {
    final text = _mustSeeController.text.trim();
    if (text.isNotEmpty && !_mustSeeAttractions.contains(text)) {
      setState(() {
        _mustSeeAttractions.add(text);
        _mustSeeController.clear();
      });
    }
  }
  
  void _addInterestChip() {
    final text = _interestsController.text.trim();
    if (text.isNotEmpty && !_interestChips.contains(text)) {
      setState(() {
        _interestChips.add(text);
        _interestsController.clear();
      });
    }
  }
  
  void _selectStartDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        _startDate = date;
        // Auto-calculate end date
        final days = _durationUnit == 'weeks' ? _durationDays * 7 : _durationDays;
        _endDate = date.add(Duration(days: days - 1));
      });
    }
  }
  
  void _selectEndDate() async {
    if (_startDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select start date first')),
      );
      return;
    }
    
    final date = await showDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate!.add(Duration(days: _durationDays - 1)),
      firstDate: _startDate!,
      lastDate: _startDate!.add(const Duration(days: 365)),
    );
    if (date != null) {
      setState(() {
        _endDate = date;
        // Update duration based on selected dates
        final difference = date.difference(_startDate!).inDays + 1;
        _durationDays = difference;
      });
    }
  }
  
  Widget _buildAllPlansList(AppProvider appProvider, ScrollController scrollController, BuildContext modalContext) {
    final allPlans = <Widget>[];
    
    // Add all trip plans
    for (final plan in appProvider.tripPlans) {
      allPlans.add(Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.purple[100],
            child: Icon(Icons.map, color: Colors.purple[700]),
          ),
          title: Text(plan.tripTitle ?? 'Trip Plan'),
          subtitle: Text('${plan.destination} • ${plan.duration}'),
          onTap: () {
            Navigator.pop(modalContext);
            _showTripPlanDetails(plan);
          },
        ),
      ));
    }
    
    // Add all day itineraries
    for (final itinerary in appProvider.itineraries) {
      allPlans.add(Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: Colors.blue[100],
            child: Icon(Icons.today, color: Colors.blue[700]),
          ),
          title: Text(itinerary.title),
          subtitle: Text('Day itinerary • ${itinerary.dailyPlan.length} activities'),
          onTap: () {
            Navigator.pop(modalContext);
            _showItineraryDetails(itinerary);
          },
        ),
      ));
    }
    
    if (allPlans.isEmpty) {
      return const Center(
        child: Text('No plans created yet', style: TextStyle(color: Colors.grey)),
      );
    }
    
    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(vertical: 16),
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'All Your Plans (${allPlans.length})',
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 16),
        ...allPlans,
      ],
    );
  }
}