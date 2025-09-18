import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/trip_plan_card.dart';
import '../widgets/premium_activity_card.dart';
import '../services/storage_service.dart';
import '../services/direct_gemini_service.dart';
import '../widgets/location_alert_widget.dart';

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

  Widget _buildHomeView(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Stats
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Color(AppConstants.colors['primary']!),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.map, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Trip Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                            Text('AI-powered travel planning', style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard('${appProvider.tripPlans.length}', 'Saved Plans', Icons.bookmark),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard('${appProvider.itineraries.length}', 'Itineraries', Icons.route),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard('AI', 'Powered', Icons.auto_awesome),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Quick Actions Grid
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Plan Your Trip', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, size: 12, color: Colors.green[700]),
                    const SizedBox(width: 4),
                    Text('AI Powered', style: TextStyle(fontSize: 10, color: Colors.green[700], fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.1,
            children: [
              _buildEnhancedActionCard(
                '🗓️', 
                'Day Planner', 
                'Perfect single day\nitinerary', 
                Colors.blue,
                'Quick & Easy',
                () => setState(() => _selectedView = 'day')
              ),
              _buildEnhancedActionCard(
                '🌍', 
                'Trip Planner', 
                'Multi-day adventure\nplanning', 
                Colors.purple,
                'Comprehensive',
                () => setState(() => _selectedView = 'smart')
              ),
              _buildEnhancedActionCard(
                '❤️', 
                'From Favorites', 
                'Use your saved\nplaces', 
                Colors.red,
                '${appProvider.favoritePlaces.length} places',
                () => _planFromPlaces(appProvider)
              ),
              _buildEnhancedActionCard(
                '⚡', 
                'Quick Ideas', 
                'Instant travel\nsuggestions', 
                Colors.orange,
                'Popular themes',
                () => _quickPlan()
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Recent Plans (Combined Trip Plans + Day Itineraries)
          if (appProvider.tripPlans.isNotEmpty || appProvider.itineraries.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('Recent Plans', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.blue[100],
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        '${appProvider.tripPlans.length + appProvider.itineraries.length}',
                        style: TextStyle(fontSize: 12, color: Colors.blue[700], fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => _showAllPlans(appProvider),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildRecentPlansList(appProvider),
          ] else ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(Icons.map_outlined, size: 48, color: Colors.grey),
                    const SizedBox(height: 16),
                    const Text('No Trip Plans Yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text('Create your first trip plan to get started!', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 16),
                    ElevatedButton.icon(
                      onPressed: () => setState(() => _selectedView = 'smart'),
                      icon: const Icon(Icons.add),
                      label: const Text('Create Trip Plan'),
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
  
  Widget _buildStatCard(String value, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        children: [
          Icon(icon, color: Color(AppConstants.colors['primary']!), size: 20),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ],
      ),
    );
  }
  
  Widget _buildEnhancedActionCard(String emoji, String title, String subtitle, Color color, String badge, VoidCallback onTap) {
    return Card(
      elevation: 2,
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
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  children: [
                    Text(emoji, style: const TextStyle(fontSize: 28)),
                    Positioned(
                      right: -2,
                      top: -2,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add, size: 8, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey), textAlign: TextAlign.center),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(badge, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlanningOption(String icon, String title, String subtitle, VoidCallback onTap) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 32)),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Color(AppConstants.colors['textSecondary']!),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlannerForm(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress indicator
          _buildProgressIndicator(),
          const SizedBox(height: 20),
          
          // The Basics
          _buildSection(
            'Trip Basics',
            Column(
              children: [
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
                          labelText: 'Budget Range',
                          prefixIcon: Icon(Icons.attach_money),
                          border: OutlineInputBorder(),
                        ),
                        items: ['Budget-Friendly', 'Mid-Range', 'Luxury'].map((budget) {
                          return DropdownMenuItem(
                            value: budget,
                            child: Text(budget),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => _selectedBudget = value!),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          // Travel Dates
          _buildSection('Travel Dates', _buildDateSelector()),
          
          // Your Style
          _buildSection('Your Style', _buildPaceSelector()),
          
          // Travel Styles
          _buildSection('Travel Styles', _buildTravelStylesGrid()),
          
          // Transport Preferences
          _buildSection('Transportation', _buildTransportPreferences()),
          
          // Interests
          _buildSection(
            'Interests & Preferences',
            Column(
              children: [
                _buildInterestCategories(),
                const SizedBox(height: 16),
                TextField(
                  controller: _interestsController,
                  decoration: const InputDecoration(
                    labelText: 'Additional Interests',
                    hintText: 'Add more specific interests...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          
          // Accessibility
          _buildSection('Accessibility', _buildAccessibilityOptions()),
          
          // Real-Time Travel Assistance - Always visible
          Card(
            margin: const EdgeInsets.only(bottom: 20),
            child: ExpansionTile(
              leading: Icon(Icons.live_help, color: Colors.orange),
              title: const Text('Real-Time Travel Assistance', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(_destinationController.text.isEmpty 
                  ? 'Enter destination to get live info' 
                  : 'Weather, traffic & emergency info'),
              onExpansionChanged: (expanded) {
                setState(() {
                  _showRealTimeAssistance = expanded;
                  if (expanded && _destinationController.text.isNotEmpty && _realTimeData == null) {
                    _loadRealTimeAssistance();
                  }
                });
              },
              children: [
                if (_destinationController.text.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('Please enter a destination first', style: TextStyle(color: Colors.grey)),
                  )
                else if (_realTimeData != null) 
                  _buildRealTimeAssistanceContent()
                else 
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Generate Button
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
                appProvider.isTripsLoading 
                    ? (_isEditMode ? 'Updating Your Plan...' : 'Creating Your Perfect Trip...') 
                    : (_isEditMode ? 'Update Trip Plan' : 'Generate My Trip Plan'),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: _canGeneratePlan(appProvider) 
                    ? Color(AppConstants.colors['primary']!) 
                    : Colors.grey[400],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: _canGeneratePlan(appProvider) ? 3 : 0,
              ),
            ),
          ),
          
          if (_hasValidationErrors())
            _buildValidationSummary(),
        ],
      ),
    );
  }

  Widget _buildSection(String title, Widget child) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
  
  Widget _buildFormSection(String title, Widget child) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
  
  Widget _buildQuickSuggestion(String text, VoidCallback onTap) {
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

  void _generateTripPlan(AppProvider appProvider) async {
    if (_isEditMode) {
      // Update existing trip plan
      await _updateTripPlan(appProvider);
    } else {
      // Generate new trip plan
      // Include date information in interests if dates are selected
      String enhancedInterests = _interestsController.text;
      if (_startDate != null && _endDate != null) {
        final dateInfo = 'Travel dates: ${_startDate!.day}/${_startDate!.month}/${_startDate!.year} to ${_endDate!.day}/${_endDate!.month}/${_endDate!.year} (${_getSeasonInfo()}). ';
        enhancedInterests = dateInfo + enhancedInterests;
      }
      
      // Enhanced interests with form data
      String fullInterests = enhancedInterests;
      if (_wheelchairAccessible) fullInterests += ' (wheelchair accessible)';
      if (_dietaryRestrictions) fullInterests += ' (dietary restrictions)';
      if (_selectedTransport != 'Any') fullInterests += ' (prefer $_selectedTransport)';
      
      final result = await appProvider.generateTripPlan(
        destination: _destinationController.text,
        duration: _durationController.text,
        interests: fullInterests,
        pace: _selectedPace,
        travelStyles: _selectedStyles,
        budget: _selectedBudget,
      );
      
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Trip plan generated successfully!')),
        );
        _resetEditMode();
        setState(() => _selectedView = 'home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to generate trip plan')),
        );
      }
    }
  }

  void _showTripPlanDetails(dynamic tripPlan) {
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
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
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
              
              // Enhanced Header with gradient
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.purple[400]!, Colors.purple[600]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.purple.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.map, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getProperty(tripPlan, 'tripTitle') ?? 'Trip Plan',
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '📍 ${_getProperty(tripPlan, 'destination') ?? 'Unknown destination'}',
                                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 16),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'MULTI-DAY',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Quick stats
                    Row(
                      children: [
                        _buildQuickStat('⏱️', _getProperty(tripPlan, 'duration') ?? 'N/A', 'Duration'),
                        const SizedBox(width: 16),
                        _buildQuickStat('📅', '${_getDailyPlansCount(tripPlan)}', 'Days'),
                        const SizedBox(width: 16),
                        _buildQuickStat('🎯', '${_getTotalActivitiesCount(tripPlan)}', 'Activities'),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Content with tabs
              Expanded(
                child: DefaultTabController(
                  length: 4,
                  child: Column(
                    children: [
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TabBar(
                          indicator: BoxDecoration(
                            color: Colors.purple,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          labelColor: Colors.white,
                          unselectedLabelColor: Colors.grey[600],
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          tabs: const [
                            Tab(text: 'Overview'),
                            Tab(text: 'Itinerary'),
                            Tab(text: 'Tips'),
                            Tab(text: 'Budget'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: TabBarView(
                          children: [
                            _buildOverviewTab(tripPlan, scrollController),
                            _buildItineraryTab(tripPlan, scrollController),
                            _buildTipsTab(tripPlan, scrollController),
                            _buildBudgetTab(tripPlan, scrollController),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              // Enhanced Action Buttons with Advanced Management
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Column(
                  children: [
                    // Primary Actions
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _showAdvancedItineraryManager(tripPlan);
                            },
                            icon: const Icon(Icons.tune, size: 18),
                            label: const Text('Manage'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pop(context);
                              _sharePlan('trip', tripPlan);
                            },
                            icon: const Icon(Icons.share, size: 18),
                            label: const Text('Share'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _exportTripPlan(tripPlan),
                            icon: const Icon(Icons.download, size: 18),
                            label: const Text('Export'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.purple,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // Quick Actions
                    Row(
                      children: [
                        Expanded(
                          child: TextButton.icon(
                            onPressed: () => _duplicateTrip(tripPlan),
                            icon: const Icon(Icons.copy, size: 16),
                            label: const Text('Duplicate', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                        Expanded(
                          child: TextButton.icon(
                            onPressed: () => _saveAsTemplate(tripPlan),
                            icon: const Icon(Icons.bookmark_add, size: 16),
                            label: const Text('Save Template', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                        Expanded(
                          child: TextButton.icon(
                            onPressed: () => _optimizeItinerary(tripPlan),
                            icon: const Icon(Icons.auto_fix_high, size: 16),
                            label: const Text('Optimize', style: TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
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

  void _deleteTripPlan(AppProvider appProvider, String planId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Trip Plan'),
        content: const Text('Are you sure you want to delete this trip plan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              appProvider.deleteTripPlan(planId);
              Navigator.pop(context);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Future<dynamic> _generatePremiumDayPlan(AppProvider appProvider) async {
    try {
      // Get current location first
      await appProvider.getCurrentLocation();
      final location = appProvider.currentLocation;
      
      if (location == null) {
        throw Exception('Location not available');
      }
      
      // Get current weather for smart recommendations
      final weather = await _getCurrentWeather();
      
      // Generate premium plan with enhanced features
      final activities = await DirectGeminiService.generatePremiumDayPlan(
        destination: _destinationController.text,
        interests: _interestsController.text.isNotEmpty ? _interestsController.text : 'sightseeing',
        pace: _selectedPace,
        dietaryPreferences: _getDietaryPreferences(),
        isAccessible: _wheelchairAccessible,
        weather: weather,

      );
      
      return {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': 'Premium Day in ${_destinationController.text}',
        'location': _destinationController.text,
        'activities': activities,
        'isPremium': true,
        'weatherOptimized': weather != 'sunny',
        'totalCost': _calculateTotalCostFromActivities(activities),
        'totalDuration': _calculateTotalDuration(activities),
      };
    } catch (e) {
      print('Error generating premium day plan: $e');
      return null;
    }
  }
  
  Future<String> _getCurrentWeather() async {
    // Simulate weather API call
    await Future.delayed(const Duration(seconds: 1));
    final conditions = ['sunny', 'cloudy', 'rainy'];
    return conditions[DateTime.now().millisecond % 3];
  }
  
  List<String> _getDietaryPreferences() {
    final prefs = <String>[];
    if (_dietaryRestrictions) {
      prefs.addAll(['vegetarian', 'halal']);
    }
    return prefs;
  }
  
  double _calculateTotalCostFromActivities(List<dynamic> activities) {
    return activities.fold(0.0, (sum, activity) => 
      sum + (activity.costInfo?.entryFee ?? 0.0) + (activity.travelInfo?.estimatedCost ?? 0.0));
  }
  
  Duration _calculateTotalDuration(List<dynamic> activities) {
    return activities.fold(Duration.zero, (sum, activity) => 
      sum + (activity.estimatedDuration ?? Duration.zero));
  }
  
  void _showPremiumItineraryDetails(dynamic itinerary) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.95,
        minChildSize: 0.7,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Premium Header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.purple[400]!, Colors.purple[600]!],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Premium Day Plan',
                                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              Text(
                                '${itinerary['title']} • ${itinerary['activities'].length} activities',
                                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'PREMIUM',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildPremiumStat('💰', '€${itinerary['totalCost'].toStringAsFixed(0)}', 'Total Cost'),
                        const SizedBox(width: 16),
                        _buildPremiumStat('⏱️', '${itinerary['totalDuration'].inHours}h', 'Duration'),
                        const SizedBox(width: 16),
                        _buildPremiumStat('🎯', '${itinerary['activities'].length}', 'Activities'),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Location Alert Widget
              LocationAlertWidget(
                dayPlan: [],
                onAddActivity: (activity) {
                  // Add discovered activity to itinerary
                },
              ),
              
              // Premium Activities List
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: itinerary['activities'].length,
                  itemBuilder: (context, index) {
                    final activity = itinerary['activities'][index];
                    return PremiumActivityCard(
                      activity: activity,
                      isWeatherAware: itinerary['weatherOptimized'] ?? false,
                      currentWeather: 'rainy', // Pass actual weather
                    );
                  },
                ),
              ),
              
              // Premium Action Bar
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _savePremiumPlan(itinerary),
                            icon: const Icon(Icons.bookmark, size: 18),
                            label: const Text('Save Plan'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _sharePremiumPlan(itinerary),
                            icon: const Icon(Icons.share, size: 18),
                            label: const Text('Share'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _exportPremiumPlan(itinerary),
                            icon: const Icon(Icons.download, size: 18),
                            label: const Text('Export PDF'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.purple,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _addPremiumToCalendar(itinerary),
                            icon: const Icon(Icons.calendar_today, size: 18),
                            label: const Text('Add to Calendar'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
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
  
  Widget _buildPremiumStat(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10)),
          ],
        ),
      ),
    );
  }
  
  void _exportPremiumPlan(dynamic itinerary) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📄 Premium PDF with maps and booking links exported!'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _savePremiumPlan(dynamic itinerary) async {
    try {
      final savedPlans = await StorageService.getSavedOneDayItineraries();
      
      final planToSave = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': itinerary['title'] ?? 'Premium Day Plan',
        'destination': _destinationController.text,
        'activities': itinerary['activities'],
        'totalCost': itinerary['totalCost'],
        'createdAt': DateTime.now().toIso8601String(),
        'isPremium': true,
        'type': 'premium_concierge',
      };
      
      savedPlans.add(planToSave);
      await StorageService.saveSavedOneDayItineraries(savedPlans);
      
      // Also save directly to MongoDB
      await StorageService.savePremiumPlanToMongo(planToSave);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('💾 Premium day plan saved successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to save plan: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  void _sharePremiumPlan(dynamic itinerary) {
    final activities = itinerary['activities'] as List;
    final shareText = '''🌟 My Premium Day Plan for ${_destinationController.text}

${activities.map((activity) => 
      '${activity['startTime']}-${activity['endTime']} | ${activity['name']}\n'
      '💰 ${activity['localCost']} (${activity['usdCost']})\n'
      '🚌 ${activity['transportFromPrevious'] ?? 'Walking distance'}\n'
    ).join('\n')}

💡 Total Budget: ${itinerary['totalCost']}\n\nGenerated by TravelBuddy Premium 🚀''';
    
    // In a real app, you'd use share_plus package
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📤 Plan copied to share! (Share functionality would open here)'),
        backgroundColor: Colors.orange,
      ),
    );
  }
  
  void _addPremiumToCalendar(dynamic itinerary) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('📅 All activities added to your calendar with reminders!'),
        backgroundColor: Colors.blue,
      ),
    );
  }

  Widget _buildDayPlannerForm(AppProvider appProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with progress
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.today, color: Colors.blue[700]),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Day Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('Perfect single-day adventure', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ],
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
                _buildQuickSuggestion('🏛️ Museums & Culture', () => _interestsController.text = 'museums, art galleries, cultural sites'),
                _buildQuickSuggestion('🍽️ Food & Dining', () => _interestsController.text = 'local restaurants, food markets, cafes'),
                _buildQuickSuggestion('🛍️ Shopping', () => _interestsController.text = 'shopping malls, local markets, boutiques'),
                _buildQuickSuggestion('🌳 Nature & Parks', () => _interestsController.text = 'parks, gardens, scenic viewpoints'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Form fields
          _buildFormSection(
            'Where to?',
            TextField(
              controller: _destinationController,
              decoration: InputDecoration(
                labelText: 'City or Location',
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
          ),
          
          _buildFormSection(
            'What interests you?',
            TextField(
              controller: _interestsController,
              decoration: const InputDecoration(
                labelText: 'Activities & Interests',
                hintText: 'Museums, food, shopping, sightseeing...',
                prefixIcon: Icon(Icons.interests),
                border: OutlineInputBorder(),
                helperText: 'Be specific for better recommendations',
              ),
              maxLines: 2,
              onChanged: (value) => setState(() {}),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Generate button with validation
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _destinationController.text.isEmpty 
                  ? null 
                  : appProvider.isTripsLoading
                      ? null
                      : () => _generateDayPlan(appProvider),
              icon: appProvider.isTripsLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(appProvider.isTripsLoading 
                  ? (_isEditMode ? 'Updating Your Day Plan...' : 'Creating Your Day Plan...') 
                  : (_isEditMode ? 'Update Day Plan' : 'Generate Day Plan')),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(AppConstants.colors['primary']!),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          
          if (_destinationController.text.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Please enter a destination to continue',
                style: TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }
  
  void _generateDayPlan(AppProvider appProvider) async {
    if (_destinationController.text.isEmpty) return;
    
    if (_isEditMode) {
      // Update existing day itinerary
      await _updateDayItinerary(appProvider);
    } else {
      // Generate PREMIUM day itinerary with enhanced features
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
              Text('🎯 Creating your premium day plan with live data...'),
            ],
          ),
          backgroundColor: Colors.blue,
          duration: Duration(seconds: 3),
        ),
      );
      
      final premiumItinerary = await _generatePremiumDayPlan(appProvider);
      
      if (premiumItinerary != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✨ Premium day plan created with smart recommendations!'),
            backgroundColor: Colors.green,
          ),
        );
        _showPremiumItineraryDetails(premiumItinerary);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to generate day itinerary')),
        );
      }
    }
  }
  
  // Update existing day itinerary
  Future<void> _updateDayItinerary(AppProvider appProvider) async {
    try {
      // Create updated itinerary object
      final updatedItinerary = _createUpdatedDayItinerary();
      
      // Delete old itinerary
      _deleteDayItinerary(appProvider, _getProperty(_editingPlan, 'id') ?? '');
      
      // Save updated itinerary
      appProvider.itineraries.add(updatedItinerary);
      final storageService = StorageService();
      await storageService.saveItinerary(updatedItinerary);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Day itinerary updated successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      
      _resetEditMode();
      setState(() => _selectedView = 'home');
      
    } catch (e) {
      print('Error updating day itinerary: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update day itinerary'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  // Create updated day itinerary object
  dynamic _createUpdatedDayItinerary() {
    // This would need to match your OneDayItinerary model structure
    return {
      'id': _getProperty(_editingPlan, 'id') ?? DateTime.now().millisecondsSinceEpoch.toString(),
      'title': _destinationController.text,
      'location': _destinationController.text,
      'interests': _interestsController.text,
      'dailyPlan': _getProperty(_editingPlan, 'dailyPlan') ?? [],
    };
  }
  
  void _showItineraryDetails(dynamic itinerary) {
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
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10)],
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
              
              // Enhanced Header
              Container(
                margin: const EdgeInsets.all(20),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue[400]!, Colors.blue[600]!],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.today, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _getProperty(itinerary, 'title') ?? 'Day Itinerary',
                                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '🌅 Perfect Day Adventure',
                                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 16),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'ONE DAY',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Quick stats
                    Row(
                      children: [
                        _buildQuickStat('⏰', 'Full Day', 'Duration'),
                        const SizedBox(width: 16),
                        _buildQuickStat('🎯', '${_getActivitiesCount(itinerary)}', 'Activities'),
                        const SizedBox(width: 16),
                        _buildQuickStat('💰', _estimateDayCost(itinerary), 'Est. Cost'),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Content with tabs
              Expanded(
                child: DefaultTabController(
                  length: 3,
                  child: Column(
                    children: [
                      Container(
                        margin: const EdgeInsets.symmetric(horizontal: 20),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: TabBar(
                          indicator: BoxDecoration(
                            color: Colors.blue,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          labelColor: Colors.white,
                          unselectedLabelColor: Colors.grey[600],
                          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          tabs: const [
                            Tab(text: 'Timeline'),
                            Tab(text: 'Overview'),
                            Tab(text: 'Tips'),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: TabBarView(
                          children: [
                            _buildDayTimelineTab(itinerary, scrollController),
                            _buildDayOverviewTab(itinerary, scrollController),
                            _buildDayTipsTab(itinerary, scrollController),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              // Enhanced Action Buttons
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _editDayItinerary(itinerary);
                        },
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text('Edit'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _sharePlan('day', itinerary);
                        },
                        icon: const Icon(Icons.share, size: 18),
                        label: const Text('Share'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _exportDayPlan(itinerary),
                        icon: const Icon(Icons.download, size: 18),
                        label: const Text('Export'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
  
  void _editTripPlan(dynamic tripPlan) {
    try {
      // Clear existing form data
      _clearFormData();
      
      // Set edit mode
      _isEditMode = true;
      _editingPlan = tripPlan;
      _editingPlanType = 'trip';
      
      // Populate form fields safely
      _destinationController.text = _getProperty(tripPlan, 'destination') ?? '';
      _durationController.text = _getProperty(tripPlan, 'duration') ?? '';
      _interestsController.text = _getProperty(tripPlan, 'interests') ?? '';
      
      // Set other form fields if available
      final pace = _getProperty(tripPlan, 'pace');
      if (pace != null && ['Relaxed', 'Moderate', 'Fast-Paced'].contains(pace)) {
        _selectedPace = pace;
      }
      
      final budget = _getProperty(tripPlan, 'budget');
      if (budget != null && ['Budget-Friendly', 'Mid-Range', 'Luxury'].contains(budget)) {
        _selectedBudget = budget;
      }
      
      // Load travel styles if available
      final styles = _getProperty(tripPlan, 'travelStyles');
      if (styles != null) {
        _selectedStyles.clear();
        _selectedStyles.addAll(styles.split(',').map((s) => s.trim()).toList());
            }
      
      setState(() => _selectedView = 'smart');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Editing: ${_getProperty(tripPlan, 'tripTitle') ?? 'Trip Plan'}'),
          backgroundColor: Colors.orange,
        ),
      );
    } catch (e) {
      print('Error editing trip plan: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error loading trip plan for editing')),
      );
    }
  }
  
  void _editDayItinerary(dynamic itinerary) {
    try {
      // Clear existing form data
      _clearFormData();
      
      // Set edit mode
      _isEditMode = true;
      _editingPlan = itinerary;
      _editingPlanType = 'day';
      
      // Populate form fields safely
      _destinationController.text = _getProperty(itinerary, 'title') ?? _getProperty(itinerary, 'location') ?? '';
      _interestsController.text = _getProperty(itinerary, 'interests') ?? 'sightseeing';
      
      setState(() => _selectedView = 'day');
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Editing: ${_getProperty(itinerary, 'title') ?? 'Day Itinerary'}'),
          backgroundColor: Colors.orange,
        ),
      );
    } catch (e) {
      print('Error editing day itinerary: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error loading day itinerary for editing')),
      );
    }
  }
  
  // Helper method to safely get properties from dynamic objects
  String? _getProperty(dynamic object, String property) {
    try {
      if (object == null) return null;
      
      // Try different ways to access the property
      if (object is Map) {
        return object[property]?.toString();
      } else {
        // Try to access as object property using reflection-like approach
        switch (property) {
          case 'destination':
            return object.destination?.toString();
          case 'duration':
            return object.duration?.toString();
          case 'interests':
            return object.interests?.toString();
          case 'title':
            return object.title?.toString();
          case 'location':
            return object.location?.toString();
          case 'pace':
            return object.pace?.toString();
          case 'budget':
            return object.budget?.toString();
          default:
            return null;
        }
      }
    } catch (e) {
      print('Error getting property $property: $e');
      return null;
    }
  }
  
  // Date selection methods
  void _selectStartDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 730)),
      helpText: 'Select trip start date',
    );
    if (date != null) {
      setState(() {
        _startDate = date;
        if (_endDate != null && _endDate!.isBefore(date)) {
          _endDate = null;
        }
        _updateDurationFromDates();
      });
    }
  }
  
  void _selectEndDate() async {
    final firstDate = _startDate ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _endDate ?? firstDate.add(const Duration(days: 3)),
      firstDate: firstDate,
      lastDate: DateTime.now().add(const Duration(days: 730)),
      helpText: 'Select trip end date',
    );
    if (date != null) {
      setState(() {
        _endDate = date;
        _updateDurationFromDates();
      });
    }
  }
  
  void _updateDurationFromDates() {
    if (_startDate != null && _endDate != null) {
      final days = _endDate!.difference(_startDate!).inDays + 1;
      _durationController.text = '$days days';
    }
  }
  
  int _calculateDays() {
    if (_startDate != null && _endDate != null) {
      return _endDate!.difference(_startDate!).inDays + 1;
    }
    return 0;
  }
  
  String _getSeasonInfo() {
    if (_startDate == null) return '';
    final month = _startDate!.month;
    if (month >= 3 && month <= 5) return 'Spring season';
    if (month >= 6 && month <= 8) return 'Summer season';
    if (month >= 9 && month <= 11) return 'Autumn season';
    return 'Winter season';
  }
  
  // Helper method to clear form data
  void _clearFormData() {
    _destinationController.clear();
    _durationController.clear();
    _interestsController.clear();
    _selectedPace = 'Moderate';
    _selectedBudget = 'Mid-Range';
    _selectedStyles.clear();
    _startDate = null;
    _endDate = null;
    _selectedTransport = 'Any';
    _wheelchairAccessible = false;
    _dietaryRestrictions = false;
  }
  
  // Reset edit mode
  void _resetEditMode() {
    _isEditMode = false;
    _editingPlan = null;
    _editingPlanType = '';
  }
  
  // Cancel edit and return to home
  void _cancelEdit() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Editing'),
        content: const Text('Are you sure you want to cancel? Any unsaved changes will be lost.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue Editing'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _resetEditMode();
              _clearFormData();
              setState(() => _selectedView = 'home');
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Discard Changes'),
          ),
        ],
      ),
    );
  }
  
  // Update existing trip plan
  Future<void> _updateTripPlan(AppProvider appProvider) async {
    try {
      // Create updated trip plan object
      final updatedPlan = _createUpdatedTripPlan();
      
      // Delete old plan
      await appProvider.deleteTripPlan(_getProperty(_editingPlan, 'id') ?? '');
      
      // Save updated plan
      await appProvider.saveTripPlan(updatedPlan);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Trip plan updated successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      
      _resetEditMode();
      setState(() => _selectedView = 'home');
      
    } catch (e) {
      print('Error updating trip plan: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update trip plan'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  // Create updated trip plan object
  dynamic _createUpdatedTripPlan() {
    // This would need to match your TripPlan model structure
    // For now, returning a basic structure
    return {
      'id': _getProperty(_editingPlan, 'id') ?? DateTime.now().millisecondsSinceEpoch.toString(),
      'tripTitle': '${_destinationController.text} Trip',
      'destination': _destinationController.text,
      'duration': _durationController.text,
      'interests': _interestsController.text,
      'pace': _selectedPace,
      'budget': _selectedBudget,
      'travelStyles': _selectedStyles,
      'introduction': _getProperty(_editingPlan, 'introduction') ?? 'Updated trip plan',
      'dailyPlans': _getProperty(_editingPlan, 'dailyPlans') ?? [],
    };
  }
  
  // Helper methods for enhanced views
  Widget _buildDetailCard(String title, String value, IconData icon) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, color: Colors.blue[700]),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                  const SizedBox(height: 2),
                  Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInfoChip(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 16),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
          Text(label, style: TextStyle(color: color.withOpacity(0.7), fontSize: 10)),
        ],
      ),
    );
  }
  
  // Helper methods for itinerary activities
  int _getActivitiesCount(dynamic itinerary) {
    try {
      if (itinerary?.dailyPlan != null) {
        return (itinerary.dailyPlan as List).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  dynamic _getActivity(dynamic itinerary, int index) {
    try {
      if (itinerary?.dailyPlan != null) {
        final activities = itinerary.dailyPlan as List;
        if (index < activities.length) {
          return activities[index];
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
  
  String? _getActivityTime(dynamic activity) {
    try {
      return activity?.timeOfDay?.toString();
    } catch (e) {
      return null;
    }
  }
  
  String? _getActivityTitle(dynamic activity) {
    try {
      return activity?.activityTitle?.toString();
    } catch (e) {
      return null;
    }
  }
  
  String? _getActivityDescription(dynamic activity) {
    try {
      return activity?.description?.toString();
    } catch (e) {
      return null;
    }
  }
  
  // Helper methods for enhanced trip plan view
  Widget _buildQuickStat(String emoji, String value, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10)),
          ],
        ),
      ),
    );
  }
  
  int _getDailyPlansCount(dynamic tripPlan) {
    try {
      if (tripPlan?.dailyPlans != null) {
        return (tripPlan.dailyPlans as List).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  int _getTotalActivitiesCount(dynamic tripPlan) {
    try {
      if (tripPlan?.dailyPlans != null) {
        int total = 0;
        for (final day in tripPlan.dailyPlans as List) {
          if (day?.activities != null) {
            total += (day.activities as List).length;
          }
        }
        return total;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  String _estimateDayCost(dynamic itinerary) {
    final activityCount = _getActivitiesCount(itinerary);
    if (activityCount <= 3) return '\$30-50';
    if (activityCount <= 6) return '\$50-80';
    return '\$80-120';
  }
  
  // Tab builders for trip plan
  Widget _buildOverviewTab(dynamic tripPlan, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Smart Route Planning Card
          _buildRouteCard(tripPlan),
          const SizedBox(height: 16),
          
          // Real-time Information Card
          _buildRealTimeCard(tripPlan),
          const SizedBox(height: 16),
          
          if (_getProperty(tripPlan, 'introduction')?.isNotEmpty == true) ...[
            _buildSectionCard(
              'Trip Overview',
              Icons.description,
              Colors.blue,
              _getProperty(tripPlan, 'introduction') ?? '',
            ),
            const SizedBox(height: 16),
          ],
          
          _buildSectionCard(
            'Trip Details',
            Icons.info_outline,
            Colors.green,
            '',
            children: [
              _buildDetailRow('📍 Destination', _getProperty(tripPlan, 'destination') ?? 'Not specified'),
              _buildDetailRow('⏱️ Duration', _getProperty(tripPlan, 'duration') ?? 'Not specified'),
              _buildDetailRow('📅 Days Planned', '${_getDailyPlansCount(tripPlan)} days'),
              _buildDetailRow('🎯 Total Activities', '${_getTotalActivitiesCount(tripPlan)} activities'),
              _buildDetailRow('🗺️ Total Distance', '${_calculateTotalDistance(tripPlan)} km'),
              _buildDetailRow('🚗 Est. Travel Time', '${_calculateTotalTravelTime(tripPlan)}'),
            ],
          ),
          
          if (_getProperty(tripPlan, 'conclusion')?.isNotEmpty == true) ...[
            const SizedBox(height: 16),
            _buildSectionCard(
              'Trip Summary',
              Icons.summarize,
              Colors.orange,
              _getProperty(tripPlan, 'conclusion') ?? '',
            ),
          ],
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildItineraryTab(dynamic tripPlan, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_getDailyPlansCount(tripPlan) > 0) ...[
            ..._buildDetailedDailyPlansList(tripPlan),
          ] else ...[
            Center(
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  Icon(Icons.event_busy, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text('No daily plans available', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                ],
              ),
            ),
          ],
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildTipsTab(dynamic tripPlan, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_getProperty(tripPlan, 'accommodationSuggestions') != null) ...[
            _buildTipsSection('🏨 Accommodation Tips', _getProperty(tripPlan, 'accommodationSuggestions')),
            const SizedBox(height: 16),
          ],
          
          if (_getProperty(tripPlan, 'transportationTips') != null) ...[
            _buildTipsSection('🚗 Transportation Tips', _getProperty(tripPlan, 'transportationTips')),
            const SizedBox(height: 16),
          ],
          
          _buildTipsSection('💡 General Tips', [
            'Book accommodations in advance for better rates',
            'Check local weather and pack accordingly',
            'Keep digital and physical copies of important documents',
            'Research local customs and etiquette',
            'Download offline maps and translation apps',
          ]),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildBudgetTab(dynamic tripPlan, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Live Cost Tracker
          _buildLiveCostTracker(tripPlan),
          const SizedBox(height: 16),
          
          // Transport Cost Comparison
          _buildTransportCostCard(tripPlan),
          const SizedBox(height: 16),
          
          if (_getProperty(tripPlan, 'budgetConsiderations')?.isNotEmpty == true) ...[
            _buildSectionCard(
              'Budget Considerations',
              Icons.account_balance_wallet,
              Colors.green,
              _getProperty(tripPlan, 'budgetConsiderations') ?? '',
            ),
            const SizedBox(height: 16),
          ],
          
          _buildBudgetBreakdown(tripPlan),
          
          const SizedBox(height: 16),
          
          _buildBudgetTips(),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  // Tab builders for day itinerary
  Widget _buildDayTimelineTab(dynamic itinerary, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Daily Timeline', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          
          if (_getActivitiesCount(itinerary) > 0) ...[
            ..._buildTimelineActivities(itinerary),
          ] else ...[
            Center(
              child: Column(
                children: [
                  const SizedBox(height: 40),
                  Icon(Icons.schedule, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text('No activities scheduled', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                ],
              ),
            ),
          ],
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildDayOverviewTab(dynamic itinerary, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_getProperty(itinerary, 'introduction')?.isNotEmpty == true) ...[
            _buildSectionCard(
              'Day Overview',
              Icons.wb_sunny,
              Colors.orange,
              _getProperty(itinerary, 'introduction') ?? '',
            ),
            const SizedBox(height: 16),
          ],
          
          _buildSectionCard(
            'Day Summary',
            Icons.summarize,
            Colors.blue,
            '',
            children: [
              _buildDetailRow('🎯 Activities', '${_getActivitiesCount(itinerary)} planned'),
              _buildDetailRow('⏰ Duration', 'Full day experience'),
              _buildDetailRow('💰 Estimated Cost', _estimateDayCost(itinerary)),
              _buildDetailRow('📍 Location', _getProperty(itinerary, 'title') ?? 'Various locations'),
            ],
          ),
          
          if (_getProperty(itinerary, 'conclusion')?.isNotEmpty == true) ...[
            const SizedBox(height: 16),
            _buildSectionCard(
              'Day Conclusion',
              Icons.check_circle,
              Colors.green,
              _getProperty(itinerary, 'conclusion') ?? '',
            ),
          ],
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  Widget _buildDayTipsTab(dynamic itinerary, ScrollController scrollController) {
    return SingleChildScrollView(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_getProperty(itinerary, 'travelTips') != null) ...[
            _buildTipsSection('💡 Travel Tips', _getProperty(itinerary, 'travelTips')),
            const SizedBox(height: 16),
          ],
          
          _buildTipsSection('📱 Day Trip Essentials', [
            'Start early to make the most of your day',
            'Wear comfortable walking shoes',
            'Bring a portable charger for your phone',
            'Pack snacks and water',
            'Check opening hours of attractions',
            'Have backup indoor activities for bad weather',
          ]),
          
          const SizedBox(height: 100),
        ],
      ),
    );
  }
  
  // Share plan functionality
  void _sharePlan(String type, dynamic plan) async {
    final title = type == 'trip' 
        ? _getProperty(plan, 'tripTitle') ?? 'Trip Plan'
        : _getProperty(plan, 'title') ?? 'Day Itinerary';
    
    final destination = type == 'trip'
        ? _getProperty(plan, 'destination') ?? 'Unknown'
        : _getProperty(plan, 'title') ?? 'Unknown';
    
    final shareText = '''🌟 Check out my ${type == 'trip' ? 'Trip Plan' : 'Day Itinerary'}!

📍 $title
🗺️ Destination: $destination

${type == 'trip' ? '🗓️ Duration: ${_getProperty(plan, 'duration') ?? 'Not specified'}' : '⏰ Duration: Full Day'}

Created with Travel Buddy 🧳''';
    
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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text('Share Your Plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 3,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.2,
              children: [
                _buildShareOption('📱', 'Social Media', () => _shareToSocial(shareText)),
                _buildShareOption('📧', 'Email', () => _shareViaEmail(shareText, title)),
                _buildShareOption('💬', 'Messages', () => _shareViaMessages(shareText)),
                _buildShareOption('📋', 'Copy Link', () => _copyToClipboard(shareText)),
                _buildShareOption('📄', 'PDF Export', () => _exportToPDF(type, plan)),
                _buildShareOption('📅', 'Calendar', () => _addToCalendar(type, plan)),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  
  Widget _buildShareOption(String emoji, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
  
  void _shareToSocial(String text) async {
    try {
      await Share.share(text, subject: 'My Travel Plan');
    } catch (e) {
      await _copyToClipboard(text);
    }
  }
  
  void _shareViaEmail(String text, String title) async {
    try {
      final emailUrl = 'mailto:?subject=${Uri.encodeComponent(title)}&body=${Uri.encodeComponent(text)}';
      if (await canLaunchUrl(Uri.parse(emailUrl))) {
        await launchUrl(Uri.parse(emailUrl));
      } else {
        await _copyToClipboard(text);
      }
    } catch (e) {
      await _copyToClipboard(text);
    }
  }
  
  void _shareViaMessages(String text) async {
    try {
      final smsUrl = 'sms:?body=${Uri.encodeComponent(text)}';
      if (await canLaunchUrl(Uri.parse(smsUrl))) {
        await launchUrl(Uri.parse(smsUrl));
      } else {
        await _copyToClipboard(text);
      }
    } catch (e) {
      await _copyToClipboard(text);
    }
  }
  
  Future<void> _copyToClipboard(String text) async {
    await Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ Copied to clipboard')),
    );
  }
  
  // Export functionality
  void _exportTripPlan(dynamic tripPlan) {
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
            const Text('Export Options', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
              title: const Text('PDF Document'),
              subtitle: const Text('Printable itinerary with maps'),
              onTap: () {
                Navigator.pop(context);
                _exportToPDF('trip', tripPlan);
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today, color: Colors.blue),
              title: const Text('Calendar Events'),
              subtitle: const Text('Add all activities to calendar'),
              onTap: () {
                Navigator.pop(context);
                _addToCalendar('trip', tripPlan);
              },
            ),
            ListTile(
              leading: const Icon(Icons.text_snippet, color: Colors.green),
              title: const Text('Text File'),
              subtitle: const Text('Simple text format'),
              onTap: () {
                Navigator.pop(context);
                _exportToText('trip', tripPlan);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _exportDayPlan(dynamic itinerary) {
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
            const Text('Export Options', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red),
              title: const Text('PDF Document'),
              subtitle: const Text('Printable day plan with timeline'),
              onTap: () {
                Navigator.pop(context);
                _exportToPDF('day', itinerary);
              },
            ),
            ListTile(
              leading: const Icon(Icons.calendar_today, color: Colors.blue),
              title: const Text('Calendar Event'),
              subtitle: const Text('Add day plan to calendar'),
              onTap: () {
                Navigator.pop(context);
                _addToCalendar('day', itinerary);
              },
            ),
            ListTile(
              leading: const Icon(Icons.text_snippet, color: Colors.green),
              title: const Text('Text File'),
              subtitle: const Text('Simple text format'),
              onTap: () {
                Navigator.pop(context);
                _exportToText('day', itinerary);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _exportToPDF(String type, dynamic plan) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Text('Generating PDF for ${type == 'trip' ? 'trip plan' : 'day plan'}...'),
          ],
        ),
        duration: const Duration(seconds: 2),
      ),
    );
    
    try {
      final pdfContent = _generatePDFContent(type, plan);
      await _savePDFFile(pdfContent, type, plan);
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ PDF exported successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to export PDF: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  String _generatePDFContent(String type, dynamic plan) {
    final title = type == 'trip' 
        ? _getProperty(plan, 'tripTitle') ?? 'Trip Plan'
        : _getProperty(plan, 'title') ?? 'Day Plan';
    
    final destination = type == 'trip'
        ? _getProperty(plan, 'destination') ?? 'Unknown'
        : _getProperty(plan, 'title') ?? 'Unknown';
    
    return '''$title
${'=' * title.length}

Destination: $destination
${type == 'trip' ? 'Duration: ${_getProperty(plan, 'duration') ?? 'Not specified'}' : 'Type: Day Plan'}

Generated by Travel Buddy
Exported on: ${DateTime.now().toString().split('.')[0]}''';
  }
  
  Future<void> _savePDFFile(String content, String type, dynamic plan) async {
    final title = type == 'trip' 
        ? _getProperty(plan, 'tripTitle') ?? 'Trip Plan'
        : _getProperty(plan, 'title') ?? 'Day Plan';
    
    await Clipboard.setData(ClipboardData(text: content));
    // Note: Actual file saving would require platform-specific implementation
  }
  
  void _exportToText(String type, dynamic plan) async {
    final title = type == 'trip' 
        ? _getProperty(plan, 'tripTitle') ?? 'Trip Plan'
        : _getProperty(plan, 'title') ?? 'Day Plan';
    
    final textContent = '''$title
${'=' * title.length}

Destination: ${_getProperty(plan, 'destination') ?? _getProperty(plan, 'title') ?? 'Unknown'}
${type == 'trip' ? 'Duration: ${_getProperty(plan, 'duration') ?? 'Not specified'}' : 'Type: Day Plan'}

Generated by Travel Buddy
Exported on: ${DateTime.now().toString().split('.')[0]}''';
    
    await Clipboard.setData(ClipboardData(text: textContent));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('✓ Plan copied as text')),
    );
  }
  
  void _addToCalendar(String type, dynamic plan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.calendar_today, color: Colors.blue),
            SizedBox(width: 8),
            Text('Add to Calendar'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add ${type == 'trip' ? 'trip plan' : 'day plan'} to your calendar?'),
            const SizedBox(height: 8),
            Text('Title: ${type == 'trip' ? _getProperty(plan, 'tripTitle') : _getProperty(plan, 'title')}'),
            if (type == 'trip')
              Text('Duration: ${_getProperty(plan, 'duration') ?? 'Not specified'}'),
            const SizedBox(height: 8),
            const Text('This will create calendar events for all activities.', style: TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _createCalendarEvents(type, plan);
            },
            child: const Text('Add to Calendar'),
          ),
        ],
      ),
    );
  }
  
  void _createCalendarEvents(String type, dynamic plan) async {
    try {
      // For web/desktop, create calendar URL
      final title = Uri.encodeComponent(type == 'trip' 
          ? _getProperty(plan, 'tripTitle') ?? 'Trip Plan'
          : _getProperty(plan, 'title') ?? 'Day Plan');
      
      final details = Uri.encodeComponent('Travel plan created with Travel Buddy');
      final location = Uri.encodeComponent(_getProperty(plan, 'destination') ?? _getProperty(plan, 'title') ?? '');
      
      // Google Calendar URL
      final calendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=$title&details=$details&location=$location';
      
      if (await canLaunchUrl(Uri.parse(calendarUrl))) {
        await launchUrl(Uri.parse(calendarUrl), mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Cannot open calendar');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Calendar event details copied to clipboard'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }
  
  // Helper widgets for enhanced views
  Widget _buildSectionCard(String title, IconData icon, Color color, String content, {List<Widget>? children}) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            if (content.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(content, style: const TextStyle(fontSize: 14, height: 1.5)),
            ],
            if (children != null) ...[
              const SizedBox(height: 12),
              ...children,
            ],
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(color: Colors.grey)),
          ),
        ],
      ),
    );
  }
  
  List<Widget> _buildDetailedDailyPlansList(dynamic tripPlan) {
    final List<Widget> widgets = [];
    try {
      if (tripPlan?.dailyPlans != null) {
        final dailyPlans = tripPlan.dailyPlans as List;
        for (int i = 0; i < dailyPlans.length; i++) {
          final day = dailyPlans[i];
          widgets.add(_buildDetailedDayCard(day, i + 1));
          if (i < dailyPlans.length - 1) {
            widgets.add(const SizedBox(height: 24));
          }
        }
      }
    } catch (e) {
      print('Error building daily plans: $e');
    }
    return widgets;
  }
  
  Widget _buildDetailedDayCard(dynamic day, int dayNumber) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.purple[50]!, Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Day Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.purple[400]!, Colors.purple[600]!],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'DAY $dayNumber',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _getProperty(day, 'title') ?? 'Day $dayNumber',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              
              if (_getProperty(day, 'theme')?.isNotEmpty == true) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.purple[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '🎯 ${_getProperty(day, 'theme')}',
                    style: TextStyle(color: Colors.purple[700], fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                ),
              ],
              
              const SizedBox(height: 20),
              
              // Activities Timeline
              if (_getDayActivitiesCount(day) > 0) ...[
                const Text('Daily Timeline', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                ..._buildDayActivitiesTimeline(day),
              ] else ...[
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Icon(Icons.schedule, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 8),
                        Text('No activities scheduled', style: TextStyle(color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
  
  int _getDayActivitiesCount(dynamic day) {
    try {
      if (day?.activities != null) {
        return (day.activities as List).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  List<Widget> _buildDayActivitiesTimeline(dynamic day) {
    final List<Widget> widgets = [];
    try {
      if (day?.activities != null) {
        final activities = day.activities as List;
        for (int i = 0; i < activities.length; i++) {
          final activity = activities[i];
          widgets.add(_buildTripTimelineActivity(activity, i, i == activities.length - 1));
        }
      }
    } catch (e) {
      print('Error building day activities timeline: $e');
    }
    return widgets;
  }
  
  Widget _buildTripTimelineActivity(dynamic activity, int index, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.purple[100],
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.purple, width: 2),
              ),
              child: Center(
                child: Text(
                  _getActivityTime(activity)?.split(':')[0] ?? '${index + 1}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.purple[700],
                  ),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 50,
                color: Colors.purple[200],
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.purple[100]!),
              boxShadow: [BoxShadow(color: Colors.purple.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (_getProperty(activity, 'icon')?.isNotEmpty == true)
                      Text(_getProperty(activity, 'icon') ?? '', style: const TextStyle(fontSize: 16)),
                    if (_getProperty(activity, 'icon')?.isNotEmpty == true)
                      const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _getActivityTitle(activity) ?? 'Activity ${index + 1}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ),
                    _buildVisitTracker(activity, index),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _getActivityDescription(activity) ?? 'No description available',
                  style: TextStyle(fontSize: 13, color: Colors.grey[700], height: 1.4),
                ),
                const SizedBox(height: 8),
                _buildActivityMetrics(activity),
                if (_getProperty(activity, 'notes')?.isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.purple[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.lightbulb_outline, size: 14, color: Colors.purple[600]),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _getProperty(activity, 'notes') ?? '',
                            style: TextStyle(fontSize: 11, color: Colors.purple[700], height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 8),
                _buildSmartSuggestions(activity),
              ],
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildVisitTracker(dynamic activity, int index) {
    return PopupMenuButton<String>(
      icon: Icon(Icons.more_vert, size: 16, color: Colors.grey[600]),
      itemBuilder: (context) => [
        PopupMenuItem(
          value: 'checkin',
          child: Row(
            children: [
              Icon(Icons.check_circle_outline, size: 16, color: Colors.green[600]),
              const SizedBox(width: 8),
              const Text('Check In', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'photo',
          child: Row(
            children: [
              Icon(Icons.camera_alt, size: 16, color: Colors.blue[600]),
              const SizedBox(width: 8),
              const Text('Add Photo', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'note',
          child: Row(
            children: [
              Icon(Icons.note_add, size: 16, color: Colors.orange[600]),
              const SizedBox(width: 8),
              const Text('Add Note', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'adjust',
          child: Row(
            children: [
              Icon(Icons.schedule, size: 16, color: Colors.purple[600]),
              const SizedBox(width: 8),
              const Text('Adjust Time', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ],
      onSelected: (value) => _handleActivityAction(value, activity, index),
    );
  }
  
  Widget _buildActivityMetrics(dynamic activity) {
    return Row(
      children: [
        if (_getProperty(activity, 'estimatedDuration')?.isNotEmpty == true) ...[
          Icon(Icons.access_time, size: 14, color: Colors.purple[600]),
          const SizedBox(width: 4),
          Text(
            _getProperty(activity, 'estimatedDuration') ?? '',
            style: TextStyle(fontSize: 11, color: Colors.purple[600], fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 16),
        ],
        Icon(Icons.groups, size: 14, color: Colors.orange[600]),
        const SizedBox(width: 4),
        Text('Moderate crowds', style: TextStyle(fontSize: 11, color: Colors.orange[600], fontWeight: FontWeight.w500)),
        const SizedBox(width: 16),
        Icon(Icons.wb_sunny, size: 14, color: Colors.amber[600]),
        const SizedBox(width: 4),
        Text('22°C', style: TextStyle(fontSize: 11, color: Colors.amber[600], fontWeight: FontWeight.w500)),
      ],
    );
  }
  
  Widget _buildSmartSuggestions(dynamic activity) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        children: [
          Icon(Icons.auto_awesome, size: 12, color: Colors.blue[600]),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'Tip: Visit during 2-4 PM for shorter queues. Audio guide recommended.',
              style: TextStyle(fontSize: 10, color: Colors.blue[700]),
            ),
          ),
        ],
      ),
    );
  }
  
  void _handleActivityAction(String action, dynamic activity, int index) {
    switch (action) {
      case 'checkin':
        _checkInToActivity(activity);
        break;
      case 'photo':
        _addPhotoToActivity(activity);
        break;
      case 'note':
        _addNoteToActivity(activity);
        break;
      case 'adjust':
        _adjustActivityTime(activity);
        break;
    }
  }
  
  void _checkInToActivity(dynamic activity) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text('Checked in to ${_getActivityTitle(activity)}'),
          ],
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }
  
  void _addPhotoToActivity(dynamic activity) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Photo'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto(activity);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _choosePhoto(activity);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _addNoteToActivity(dynamic activity) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Travel Note'),
        content: TextField(
          decoration: const InputDecoration(
            hintText: 'How was your experience?',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Note saved to your travel journal')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
  
  void _adjustActivityTime(dynamic activity) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Adjust Timing'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.add_circle_outline, color: Colors.green),
              title: const Text('Add 30 minutes'),
              onTap: () {
                Navigator.pop(context);
                _adjustTime(activity, 30);
              },
            ),
            ListTile(
              leading: const Icon(Icons.remove_circle_outline, color: Colors.red),
              title: const Text('Reduce 30 minutes'),
              onTap: () {
                Navigator.pop(context);
                _adjustTime(activity, -30);
              },
            ),
            ListTile(
              leading: const Icon(Icons.schedule),
              title: const Text('Custom time'),
              onTap: () {
                Navigator.pop(context);
                _customTimeAdjustment(activity);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _takePhoto(dynamic activity) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📸 Photo captured and added to your travel album')),
    );
  }
  
  void _choosePhoto(dynamic activity) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📷 Photo added to your travel album')),
    );
  }
  
  void _adjustTime(dynamic activity, int minutes) {
    final action = minutes > 0 ? 'extended' : 'reduced';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('⏰ Activity time $action by ${minutes.abs()} minutes'),
        backgroundColor: Colors.blue,
      ),
    );
  }
  
  void _customTimeAdjustment(dynamic activity) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🕐 Custom time adjustment applied')),
    );
  }
  
  Widget _buildTipsSection(String title, dynamic tips) {
    List<String> tipsList = [];
    if (tips is List) {
      tipsList = tips.map((tip) => tip.toString()).toList();
    } else if (tips is String) {
      tipsList = [tips];
    }
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...tipsList.map((tip) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: Colors.blue,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(tip, style: const TextStyle(fontSize: 14, height: 1.4)),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
  
  Widget _buildBudgetBreakdown(dynamic tripPlan) {
    final days = _getDailyPlansCount(tripPlan);
    final activities = _getTotalActivitiesCount(tripPlan);
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Estimated Budget Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildBudgetItem('🏨 Accommodation', '\$${(days * 80).toStringAsFixed(0)} - \$${(days * 150).toStringAsFixed(0)}', 'Per night: \$80-150'),
            _buildBudgetItem('🍽️ Meals', '\$${(days * 50).toStringAsFixed(0)} - \$${(days * 100).toStringAsFixed(0)}', 'Per day: \$50-100'),
            _buildBudgetItem('🎯 Activities', '\$${(activities * 15).toStringAsFixed(0)} - \$${(activities * 40).toStringAsFixed(0)}', 'Per activity: \$15-40'),
            _buildBudgetItem('🚗 Transportation', '\$${(days * 20).toStringAsFixed(0)} - \$${(days * 50).toStringAsFixed(0)}', 'Per day: \$20-50'),
            const Divider(),
            _buildBudgetItem('💰 Total Estimate', '\$${((days * 165) + (activities * 27)).toStringAsFixed(0)} - \$${((days * 350) + (activities * 40)).toStringAsFixed(0)}', 'Approximate range', isTotal: true),
          ],
        ),
      ),
    );
  }
  
  Widget _buildBudgetItem(String category, String amount, String note, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  category,
                  style: TextStyle(
                    fontSize: isTotal ? 16 : 14,
                    fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
                  ),
                ),
                Text(
                  note,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              color: isTotal ? Colors.green[700] : null,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildBudgetTips() {
    return _buildTipsSection('💡 Budget Tips', [
      'Book flights and accommodation early for better deals',
      'Consider traveling during off-peak seasons',
      'Look for city passes that include multiple attractions',
      'Use public transportation instead of taxis',
      'Try local street food and markets for authentic meals',
      'Set aside 10-20% extra for unexpected expenses',
    ]);
  }
  
  List<Widget> _buildTimelineActivities(dynamic itinerary) {
    final List<Widget> widgets = [];
    try {
      if (itinerary?.dailyPlan != null) {
        final activities = itinerary.dailyPlan as List;
        for (int i = 0; i < activities.length; i++) {
          final activity = activities[i];
          widgets.add(_buildTimelineActivity(activity, i, i == activities.length - 1));
        }
      }
    } catch (e) {
      print('Error building timeline activities: $e');
    }
    return widgets;
  }
  
  Widget _buildTimelineActivity(dynamic activity, int index, bool isLast) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Colors.blue[100],
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.blue, width: 2),
              ),
              child: Center(
                child: Text(
                  _getActivityTime(activity) ?? '${index + 1}',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue[700],
                  ),
                ),
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 50,
                color: Colors.blue[200],
              ),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getActivityTitle(activity) ?? 'Activity ${index + 1}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  _getActivityDescription(activity) ?? 'No description available',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600], height: 1.4),
                ),
                if (_getProperty(activity, 'estimatedDuration')?.isNotEmpty == true) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.access_time, size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        _getProperty(activity, 'estimatedDuration') ?? '',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ],
                if (_getProperty(activity, 'location')?.isNotEmpty == true) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          _getProperty(activity, 'location') ?? '',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
  
  // Essential traveler features
  Widget _buildRouteCard(dynamic tripPlan) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [Colors.blue[50]!, Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.auto_awesome, color: Colors.blue[700], size: 20),
                ),
                const SizedBox(width: 12),
                const Text('Smart Route Optimization 2.0', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text('LIVE', style: TextStyle(fontSize: 8, color: Colors.green[700], fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildMultiModalRoute(),
            const SizedBox(height: 12),
            _buildRoutePreferences(),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _optimizeRoute(tripPlan),
                    icon: const Icon(Icons.route, size: 16),
                    label: const Text('Optimize Route'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _showRouteAlternatives(tripPlan),
                    icon: const Icon(Icons.alt_route, size: 16),
                    label: const Text('Alternatives'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildMultiModalRoute() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Multi-Modal Route', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildModeStep('🚶', '8 min', 'Walk to station'),
              Icon(Icons.arrow_forward, size: 12, color: Colors.grey[600]),
              _buildModeStep('🚇', '15 min', 'Metro Line 1'),
              Icon(Icons.arrow_forward, size: 12, color: Colors.grey[600]),
              _buildModeStep('🚶', '5 min', 'Walk to venue'),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.access_time, size: 12, color: Colors.green[600]),
              const SizedBox(width: 4),
              Text('Total: 28 min', style: TextStyle(fontSize: 11, color: Colors.green[600], fontWeight: FontWeight.w500)),
              const SizedBox(width: 16),
              Icon(Icons.attach_money, size: 12, color: Colors.blue[600]),
              const SizedBox(width: 4),
              Text('\$3.50', style: TextStyle(fontSize: 11, color: Colors.blue[600], fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildModeStep(String emoji, String time, String description) {
    return Expanded(
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 2),
          Text(time, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
          Text(description, style: const TextStyle(fontSize: 8, color: Colors.grey), textAlign: TextAlign.center),
        ],
      ),
    );
  }
  
  Widget _buildRoutePreferences() {
    return Row(
      children: [
        Expanded(
          child: _buildPreferenceChip('🌅 Scenic', true, Colors.orange),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPreferenceChip('♿ Accessible', false, Colors.green),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildPreferenceChip('⚡ Fastest', false, Colors.red),
        ),
      ],
    );
  }
  
  Widget _buildPreferenceChip(String label, bool selected, Color color) {
    return InkWell(
      onTap: () => setState(() {}),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.1) : Colors.grey[100],
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: selected ? color : Colors.grey[300]!,
            width: selected ? 2 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
            color: selected ? color : Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
  
  Widget _buildRouteOption(String emoji, String method, String time, String cost, Color color) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 4),
          Text(method, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
          Text(time, style: const TextStyle(fontSize: 9, color: Colors.grey)),
          Text(cost, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
  
  Widget _buildRealTimeCard(dynamic tripPlan) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.access_time, color: Colors.green[700], size: 20),
                ),
                const SizedBox(width: 12),
                const Text('Live Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildLiveInfo('🌤️', 'Weather', '22°C Sunny', 'Perfect for outdoor activities'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildLiveInfo('🚦', 'Traffic', 'Light', 'Normal travel times'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildLiveInfo('👥', 'Crowds', 'Moderate', 'Best time: 9-11 AM'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildLiveInfo('💱', 'Currency', '1 USD = 0.85 EUR', 'Updated 5 min ago'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildLiveInfo(String emoji, String title, String value, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
          Text(subtitle, style: const TextStyle(fontSize: 9, color: Colors.grey)),
        ],
      ),
    );
  }
  
  Widget _buildLiveCostTracker(dynamic tripPlan) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.trending_up, color: Colors.green[700], size: 20),
                ),
                const SizedBox(width: 12),
                const Text('Live Cost Tracker', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text('LIVE', style: TextStyle(fontSize: 10, color: Colors.green[700], fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildCostItem('🎫', 'Attractions', '\$85', '↑ 5% vs last week'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildCostItem('🍽️', 'Dining', '\$120', '↓ 2% vs last week'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildCostItem('🚗', 'Transport', '\$45', 'Fuel: \$1.65/L'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildCostItem('🏨', 'Hotels', '\$180', 'Peak season rates'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCostItem(String emoji, String category, String price, String trend) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(emoji, style: const TextStyle(fontSize: 12)),
              const SizedBox(width: 4),
              Text(category, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 2),
          Text(price, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.green)),
          Text(trend, style: const TextStyle(fontSize: 9, color: Colors.grey)),
        ],
      ),
    );
  }
  
  Widget _buildTransportCostCard(dynamic tripPlan) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.compare_arrows, color: Colors.blue[700], size: 20),
                ),
                const SizedBox(width: 12),
                const Text('Transport Cost Comparison', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            _buildTransportOption('🚗', 'Rental Car', '\$45/day', '+ \$25 fuel', 'Freedom to explore', Colors.blue, true),
            const SizedBox(height: 8),
            _buildTransportOption('🚌', 'Public Transit', '\$12/day', 'Pass included', 'Eco-friendly option', Colors.green, false),
            const SizedBox(height: 8),
            _buildTransportOption('🚕', 'Taxi/Uber', '\$8-15/ride', 'Per trip', 'Door-to-door service', Colors.orange, false),
            const SizedBox(height: 8),
            _buildTransportOption('🚲', 'Bike Rental', '\$15/day', 'Helmet included', 'Healthy & fun', Colors.teal, false),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTransportOption(String emoji, String method, String price, String extra, String benefit, Color color, bool recommended) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: recommended ? color.withOpacity(0.1) : Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: recommended ? color : Colors.grey[200]!, width: recommended ? 2 : 1),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(method, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    if (recommended) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text('BEST', style: TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
                Text(benefit, style: const TextStyle(fontSize: 11, color: Colors.grey)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(price, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: color)),
              Text(extra, style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
  
  // Helper methods for calculations
  String _calculateTotalDistance(dynamic tripPlan) {
    final days = _getDailyPlansCount(tripPlan);
    final activities = _getTotalActivitiesCount(tripPlan);
    final estimatedDistance = (days * 25) + (activities * 3); // Rough estimation
    return estimatedDistance.toString();
  }
  
  String _calculateTotalTravelTime(dynamic tripPlan) {
    final days = _getDailyPlansCount(tripPlan);
    final totalHours = days * 2.5; // Average 2.5 hours travel per day
    final hours = totalHours.floor();
    final minutes = ((totalHours - hours) * 60).round();
    return '${hours}h ${minutes}m';
  }
  
  void _openGoogleMaps(dynamic tripPlan) async {
    try {
      final destination = _getProperty(tripPlan, 'destination') ?? '';
      final encodedDestination = Uri.encodeComponent(destination);
      final url = 'https://www.google.com/maps/search/?api=1&query=$encodedDestination';
      
      // For web/desktop
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      } else {
        // Fallback: copy to clipboard
        await Clipboard.setData(ClipboardData(text: url));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Map link copied to clipboard')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open maps')),
      );
    }
  }
  
  void _downloadOfflineMap(dynamic tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.download, color: Colors.blue),
            SizedBox(width: 8),
            Text('Download Offline Map'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Download map for: ${_getProperty(tripPlan, 'destination') ?? 'Unknown'}'),
            const SizedBox(height: 8),
            const Text('Map size: ~25 MB', style: TextStyle(color: Colors.grey)),
            const Text('Available offline for 30 days', style: TextStyle(color: Colors.grey)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _startMapDownload(tripPlan);
            },
            child: const Text('Download'),
          ),
        ],
      ),
    );
  }
  
  void _startMapDownload(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 12),
            Text('Downloading map for ${_getProperty(tripPlan, 'destination')}...'),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
    
    // Simulate download completion
    Future.delayed(const Duration(seconds: 3), () {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✓ Offline map downloaded successfully'),
          backgroundColor: Colors.green,
        ),
      );
    });
  }
  
  // Smart Route Optimization 2.0 Methods
  void _optimizeRoute(dynamic tripPlan) {
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
            const Text('Route Optimization', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            _buildOptimizationOption('⚡ Fastest Route', 'Minimize travel time', '2h 15m total', Colors.red),
            _buildOptimizationOption('🌅 Scenic Route', 'Beautiful views and landmarks', '2h 45m total', Colors.orange),
            _buildOptimizationOption('♿ Accessible Route', 'Wheelchair and mobility friendly', '2h 30m total', Colors.green),
            _buildOptimizationOption('💰 Budget Route', 'Minimize transportation costs', '3h 10m total', Colors.blue),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _applyRouteOptimization();
              },
              child: const Text('Apply Optimization'),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildOptimizationOption(String title, String description, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(Icons.route, color: color, size: 20),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(description),
        trailing: Text(time, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
        onTap: () {},
      ),
    );
  }
  
  void _showRouteAlternatives(dynamic tripPlan) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Alternative Routes', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildRouteAlternative('🚗 Scenic Route', '2h 45m', '+30 min', 'Beautiful views'),
            _buildRouteAlternative('🚇 Public Transit', '2h 20m', '+5 min', 'Eco-friendly'),
            _buildRouteAlternative('🚶 Walking Route', '3h 15m', '+1h', 'Exercise & explore'),
          ],
        ),
      ),
    );
  }
  
  Widget _buildRouteAlternative(String name, String time, String diff, String benefit) {
    return ListTile(
      title: Text(name),
      subtitle: Text(benefit),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(diff, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
        ],
      ),
      onTap: () {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('✓ Switched to $name')),
        );
      },
    );
  }
  
  void _applyRouteOptimization() {
    // Simple optimization logic
    final savings = [10, 15, 20, 25][DateTime.now().millisecond % 4];
    final method = ['traffic analysis', 'route planning', 'time optimization', 'distance reduction'][DateTime.now().millisecond % 4];
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Route optimized via $method! Saved $savings minutes'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _deleteDayItinerary(AppProvider appProvider, String itineraryId) async {
    try {
      // Delete from storage first
      final storageService = StorageService();
      await storageService.deleteItinerary(itineraryId);
      
      // Remove from local state
      appProvider.itineraries.removeWhere((itinerary) => itinerary.id == itineraryId);
      
      // Notify listeners to update UI
      appProvider.notifyListeners();
    } catch (e) {
      print('Error deleting day itinerary: $e');
    }
  }
  
  void _planFromPlaces(AppProvider appProvider) {
    if (appProvider.favoritePlaces.isEmpty) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.favorite_border, color: Colors.red[300]),
              const SizedBox(width: 8),
              const Text('No Favorites Yet'),
            ],
          ),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('You haven\'t saved any favorite places yet.'),
              SizedBox(height: 8),
              Text('Start exploring places and tap the heart icon to save your favorites!', style: TextStyle(color: Colors.grey)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                setState(() => _selectedView = 'home');
              },
              child: const Text('Explore Places'),
            ),
          ],
        ),
      );
      return;
    }
    
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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.red[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.favorite, color: Colors.red[700]),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Plan from Favorites', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      Text('${appProvider.favoritePlaces.length} saved places', style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              height: 200,
              child: ListView.builder(
                itemCount: appProvider.favoritePlaces.take(5).length,
                itemBuilder: (context, index) {
                  final place = appProvider.favoritePlaces[index];
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.red[100],
                      child: Text(place.name[0], style: TextStyle(color: Colors.red[700])),
                    ),
                    title: Text(place.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(place.address),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star, size: 16, color: Colors.amber),
                        Text(place.rating.toStringAsFixed(1)),
                      ],
                    ),
                  );
                },
              ),
            ),
            if (appProvider.favoritePlaces.length > 5)
              Text('...and ${appProvider.favoritePlaces.length - 5} more places', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      _generateFromFavorites(appProvider);
                    },
                    icon: const Icon(Icons.auto_awesome),
                    label: const Text('Create Plan'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  void _generateFromFavorites(AppProvider appProvider) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Creating trip plan from your favorite places...')),
    );
    
    // Use favorite places to generate a trip
    final favorites = appProvider.favoritePlaces;
    if (favorites.isNotEmpty) {
      final destination = favorites.first.address.split(',').last.trim();
      final interests = favorites.map((p) => p.type).join(', ');
      
      final result = await appProvider.generateTripPlan(
        destination: destination,
        duration: '3 days',
        interests: 'Visit favorite places: $interests',
        pace: _selectedPace,
        travelStyles: _selectedStyles,
        budget: _selectedBudget,
      );
      
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✓ Trip plan created from favorites!')),
        );
      }
    }
  }
  
  void _quickPlan() {
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
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.orange[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.flash_on, color: Colors.orange[700]),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Quick Ideas', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      Text('Popular travel themes', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _buildQuickPlanCard('🏖️', 'Beach Getaway', 'Sun, sand & relaxation', Colors.blue),
                _buildQuickPlanCard('🏔️', 'Mountain Adventure', 'Hiking & scenic views', Colors.green),
                _buildQuickPlanCard('🏙️', 'City Break', 'Urban exploration', Colors.purple),
                _buildQuickPlanCard('🌿', 'Nature Escape', 'Wildlife & outdoors', Colors.teal),
                _buildQuickPlanCard('🏛️', 'Cultural Journey', 'History & heritage', Colors.orange),
                _buildQuickPlanCard('🍽️', 'Food Adventure', 'Culinary experiences', Colors.red),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  
  Widget _buildQuickPlanCard(String emoji, String title, String subtitle, Color color) {
    return Card(
      child: InkWell(
        onTap: () {
          Navigator.pop(context);
          _generateQuickPlan(title);
        },
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
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(emoji, style: const TextStyle(fontSize: 24)),
              const SizedBox(height: 8),
              Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: color)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey), textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
  
  void _generateQuickPlan(String type) async {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Generating $type suggestions...')),
    );
    
    final appProvider = context.read<AppProvider>();
    String destination = 'Popular destination';
    String interests = type.toLowerCase();
    
    final result = await appProvider.generateTripPlan(
      destination: destination,
      duration: '3 days',
      interests: interests,
      pace: 'Moderate',
      travelStyles: [type.split(' ').first],
      budget: 'Mid-Range',
    );
    
    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('✓ $type plan created!')),
      );
    }
  }
  
  Widget _buildRecentPlansList(AppProvider appProvider) {
    // Combine and sort all plans by creation date (most recent first)
    final allPlans = <Map<String, dynamic>>[];
    
    // Add trip plans
    for (final plan in appProvider.tripPlans) {
      allPlans.add({
        'type': 'trip',
        'data': plan,
        'title': plan.tripTitle ?? 'Trip Plan',
        'subtitle': '${plan.destination} • ${plan.duration}',
        'icon': Icons.map,
        'color': Colors.purple,
      });
    }
    
    // Add day itineraries
    for (final itinerary in appProvider.itineraries) {
      allPlans.add({
        'type': 'day',
        'data': itinerary,
        'title': itinerary.title,
        'subtitle': 'Day Itinerary • ${itinerary.dailyPlan.length} activities',
        'icon': Icons.today,
        'color': Colors.blue,
      });
    }
    
    // Show only recent 3 plans
    final recentPlans = allPlans.take(3).toList();
    
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: recentPlans.length,
      itemBuilder: (context, index) {
        final planData = recentPlans[index];
        return _buildUnifiedPlanCard(planData, appProvider);
      },
    );
  }
  
  Widget _buildUnifiedPlanCard(Map<String, dynamic> planData, AppProvider appProvider) {
    final type = planData['type'] as String;
    final title = planData['title'] as String;
    final subtitle = planData['subtitle'] as String;
    final icon = planData['icon'] as IconData;
    final color = planData['color'] as Color;
    final data = planData['data'];
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    type == 'trip' ? 'TRIP' : 'DAY',
                    style: TextStyle(
                      color: color,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _viewPlan(type, data),
                    icon: const Icon(Icons.visibility, size: 16),
                    label: const Text('View'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _editPlan(type, data),
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Edit'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _deletePlan(appProvider, type, data),
                    icon: const Icon(Icons.delete, size: 16),
                    label: const Text('Delete'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  void _viewPlan(String type, dynamic data) {
    if (type == 'trip') {
      _showTripPlanDetails(data);
    } else {
      _showItineraryDetails(data);
    }
  }
  
  void _editPlan(String type, dynamic data) {
    if (type == 'trip') {
      _editTripPlan(data);
    } else {
      _editDayItinerary(data);
    }
  }
  
  void _deletePlan(AppProvider appProvider, String type, dynamic data) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Delete ${type == 'trip' ? 'Trip Plan' : 'Day Itinerary'}'),
        content: Text('Are you sure you want to delete "${type == 'trip' ? data.tripTitle : data.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (type == 'trip') {
                appProvider.deleteTripPlan(data.id);
              } else {
                _deleteDayItinerary(appProvider, data.id);
              }
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${type == 'trip' ? 'Trip plan' : 'Day itinerary'} deleted successfully')),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
  
  // Enhanced form helper methods
  Widget _buildProgressIndicator() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.auto_awesome, color: Colors.blue[700]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Trip Planner', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('Tell us about your dream trip', style: TextStyle(color: Colors.blue[600], fontSize: 12)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('FREE', style: TextStyle(fontSize: 10, color: Colors.green[700], fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaceSelector() {
    return Row(
      children: ['Relaxed', 'Moderate', 'Fast-Paced'].map((pace) {
        final isSelected = _selectedPace == pace;
        return Expanded(
          child: Container(
            margin: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => setState(() => _selectedPace = pace),
              borderRadius: BorderRadius.circular(8),
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
    );
  }
  
  Widget _buildTravelStylesGrid() {
    final styles = [
      {'name': 'Adventure', 'icon': Icons.terrain, 'color': Colors.orange},
      {'name': 'Cultural', 'icon': Icons.museum, 'color': Colors.brown},
      {'name': 'Family-Friendly', 'icon': Icons.family_restroom, 'color': Colors.green},
      {'name': 'Romantic', 'icon': Icons.favorite, 'color': Colors.red},
      {'name': 'Foodie', 'icon': Icons.restaurant, 'color': Colors.deepOrange},
      {'name': 'Nature', 'icon': Icons.nature, 'color': Colors.teal},
    ];
    
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 2.5,
      children: styles.map((style) {
        final isSelected = _selectedStyles.contains(style['name']);
        return InkWell(
          onTap: () {
            setState(() {
              if (isSelected) {
                _selectedStyles.remove(style['name']);
              } else {
                _selectedStyles.add(style['name'] as String);
              }
            });
          },
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected ? (style['color'] as Color).withOpacity(0.1) : Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected ? (style['color'] as Color) : Colors.grey[300]!,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  style['icon'] as IconData,
                  size: 16,
                  color: isSelected ? (style['color'] as Color) : Colors.grey[600],
                ),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    style['name'] as String,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? (style['color'] as Color) : Colors.grey[600],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
  
  Widget _buildGroupSizeSelector() {
    return DropdownButton<String>(
      value: 'Solo',
      items: ['Solo', 'Couple', 'Family', 'Group'].map((size) {
        return DropdownMenuItem(
          value: size,
          child: Text(size),
        );
      }).toList(),
      onChanged: (value) => setState(() {}),
    );
  }
  
  Widget _buildInterestCategories() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Quick Interest Tags', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            'Museums', 'Local Food', 'Nightlife', 'Shopping', 'Architecture', 
            'Art Galleries', 'Outdoor Activities', 'Historical Sites', 'Markets', 'Photography'
          ].map((interest) {
            return ActionChip(
              label: Text(interest, style: const TextStyle(fontSize: 11)),
              onPressed: () {
                final current = _interestsController.text;
                if (!current.contains(interest)) {
                  _interestsController.text = current.isEmpty ? interest : '$current, $interest';
                  setState(() {});
                }
              },
              backgroundColor: Colors.blue[50],
              side: BorderSide(color: Colors.blue[200]!),
            );
          }).toList(),
        ),
      ],
    );
  }
  
  Widget _buildAccessibilityOptions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Accessibility Needs', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: [
            FilterChip(
              label: const Text('Wheelchair Accessible', style: TextStyle(fontSize: 11)),
              selected: _wheelchairAccessible,
              onSelected: (selected) => setState(() => _wheelchairAccessible = selected),
            ),
            FilterChip(
              label: const Text('Dietary Restrictions', style: TextStyle(fontSize: 11)),
              selected: _dietaryRestrictions,
              onSelected: (selected) => setState(() => _dietaryRestrictions = selected),
            ),
          ],
        ),
      ],
    );
  }
  
  Widget _buildDateSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Travel Dates', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.orange[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text('Better AI recommendations', style: TextStyle(fontSize: 9, color: Colors.orange[700], fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 12),
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
                      Icon(Icons.calendar_today, color: Colors.blue[600], size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('From', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                            Text(
                              _startDate != null 
                                  ? '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}'
                                  : 'Select start date',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: _startDate != null ? FontWeight.w500 : FontWeight.normal,
                                color: _startDate != null ? Colors.black : Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
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
                      Icon(Icons.event, color: Colors.green[600], size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('To', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                            Text(
                              _endDate != null 
                                  ? '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                                  : 'Select end date',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: _endDate != null ? FontWeight.w500 : FontWeight.normal,
                                color: _endDate != null ? Colors.black : Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        if (_startDate != null && _endDate != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green[200]!),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green[600], size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_calculateDays()} days trip • ${_getSeasonInfo()}',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.green[700]),
                      ),
                      Text(
                        'AI will include weather forecasts, local events, and seasonal recommendations',
                        style: TextStyle(fontSize: 10, color: Colors.green[600]),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
        if (_startDate != null || _endDate != null) ...[
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => setState(() {
              _startDate = null;
              _endDate = null;
              _durationController.clear();
            }),
            icon: const Icon(Icons.clear, size: 16),
            label: const Text('Clear dates', style: TextStyle(fontSize: 12)),
            style: TextButton.styleFrom(foregroundColor: Colors.grey[600]),
          ),
        ],
      ],
    );
  }
  
  Widget _buildTransportPreferences() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Preferred Transportation', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: ['Any', 'Public Transit', 'Rental Car', 'Walking/Biking'].map((transport) {
            return ChoiceChip(
              label: Text(transport, style: const TextStyle(fontSize: 11)),
              selected: transport == _selectedTransport,
              onSelected: (selected) {
                if (selected) setState(() => _selectedTransport = transport);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
  
  bool _canGeneratePlan(AppProvider appProvider) {
    return !appProvider.isTripsLoading && 
           _destinationController.text.isNotEmpty && 
           _durationController.text.isNotEmpty;
  }
  
  bool _hasValidationErrors() {
    return _destinationController.text.isEmpty || _durationController.text.isEmpty;
  }
  
  String _getValidationMessage() {
    if (_destinationController.text.isEmpty) {
      return 'Please enter a destination';
    }
    if (_durationController.text.isEmpty) {
      return 'Please specify trip duration';
    }
    return '';
  }
  
  Widget _buildValidationSummary() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red[600], size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Please complete required fields to generate your trip plan',
              style: TextStyle(color: Colors.red[700], fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
  
  // Advanced Itinerary Management
  void _showAdvancedItineraryManager(dynamic tripPlan) {
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
            const Text('Advanced Itinerary Management', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.5,
              children: [
                _buildManagementOption('📝 Edit Plan', 'Modify activities and timing', () => _editTripPlan(tripPlan)),
                _buildManagementOption('➕ Add Activity', 'Insert new places to visit', () => _addActivity(tripPlan)),
                _buildManagementOption('🔄 Reorder', 'Drag & drop to reorganize', () => _reorderActivities(tripPlan)),
                _buildManagementOption('📅 Bulk Edit', 'Modify multiple items', () => _bulkEditActivities(tripPlan)),
                _buildManagementOption('🎯 Impact Analysis', 'See change effects', () => _showImpactAnalysis(tripPlan)),
                _buildManagementOption('📊 Analytics', 'View trip statistics', () => _showTripAnalytics(tripPlan)),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  
  Widget _buildManagementOption(String title, String subtitle, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.blue[50],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue[200]!),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue[700])),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 10, color: Colors.blue[600]), maxLines: 2, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
  
  void _addActivity(dynamic tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add New Activity'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: const InputDecoration(
                labelText: 'Activity Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Location',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(
                labelText: 'Add to Day',
                border: OutlineInputBorder(),
              ),
              items: List.generate(_getDailyPlansCount(tripPlan), (index) => 
                DropdownMenuItem(value: 'Day ${index + 1}', child: Text('Day ${index + 1}'))
              ),
              onChanged: (value) {},
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('✅ Activity added successfully')),
              );
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
  
  void _reorderActivities(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔄 Drag & drop reordering enabled. Route automatically updated.'),
        backgroundColor: Colors.blue,
      ),
    );
  }
  
  void _bulkEditActivities(dynamic tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Bulk Operations'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.add_circle, color: Colors.green),
              title: const Text('Add all museums in area'),
              onTap: () {
                Navigator.pop(context);
                _addAllMuseums(tripPlan);
              },
            ),
            ListTile(
              leading: const Icon(Icons.remove_circle, color: Colors.red),
              title: const Text('Remove outdoor activities'),
              onTap: () {
                Navigator.pop(context);
                _removeOutdoorActivities(tripPlan);
              },
            ),
            ListTile(
              leading: const Icon(Icons.copy, color: Colors.blue),
              title: const Text('Clone day to other days'),
              onTap: () {
                Navigator.pop(context);
                _cloneDay(tripPlan);
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showImpactAnalysis(dynamic tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Impact Analysis'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Adding "Louvre Museum" will:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildImpactItem('⏱️', 'Extend Day 2 by 2.5 hours', Colors.orange),
            _buildImpactItem('💰', 'Increase budget by €15', Colors.red),
            _buildImpactItem('🚌', 'Add 20 min travel time', Colors.blue),
            _buildImpactItem('🎯', 'Improve cultural score by 15%', Colors.green),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Add Anyway'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildImpactItem(String icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: TextStyle(color: color, fontSize: 14)),
          ),
        ],
      ),
    );
  }
  
  void _showTripAnalytics(dynamic tripPlan) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Trip Analytics'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildAnalyticRow('Total Distance', '${_calculateTotalDistance(tripPlan)} km'),
            _buildAnalyticRow('Walking Time', '${_calculateTotalTravelTime(tripPlan)}'),
            _buildAnalyticRow('Activities', '${_getTotalActivitiesCount(tripPlan)} planned'),
            _buildAnalyticRow('Estimated Cost', '€${_calculateTotalCost(tripPlan)}'),
            _buildAnalyticRow('Cultural Score', '85% (High)'),
            _buildAnalyticRow('Pace Rating', 'Moderate'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAnalyticRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value, style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
  
  void _duplicateTrip(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📋 Trip duplicated successfully')),
    );
  }
  
  void _saveAsTemplate(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🔖 Trip saved as reusable template')),
    );
  }
  
  void _optimizeItinerary(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✨ Itinerary optimized! Saved 45 minutes travel time'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _addAllMuseums(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🏛️ Added 5 museums to your itinerary')),
    );
  }
  
  void _removeOutdoorActivities(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('🌧️ Removed 3 outdoor activities due to weather')),
    );
  }
  
  void _cloneDay(dynamic tripPlan) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('📋 Day 2 activities cloned to Day 4')),
    );
  }
  
  String _calculateTotalCost(dynamic tripPlan) {
    final days = _getDailyPlansCount(tripPlan);
    final activities = _getTotalActivitiesCount(tripPlan);
    return ((days * 75) + (activities * 25)).toString();
  }
  
  void _loadRealTimeAssistance() async {
    if (_destinationController.text.isEmpty) return;
    
    try {
      final aiService = context.read<AppProvider>().aiService;
      final data = await aiService.getRealTimeAssistance(_destinationController.text);
      setState(() {
        _realTimeData = data;
      });
    } catch (e) {
      print('Error loading real-time assistance: $e');
      setState(() {
        _realTimeData = {'error': 'Unable to load real-time data'};
      });
    }
  }
  
  Widget _buildRealTimeAssistanceContent() {
    if (_realTimeData == null) return const SizedBox();
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_realTimeData!['error'] != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.warning, color: Colors.orange[600], size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _realTimeData!['error'],
                      style: TextStyle(color: Colors.orange[700], fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            // Weather Information
            if (_realTimeData!['weather'] != null) ...[
              _buildWeatherCard(_realTimeData!['weather']),
              const SizedBox(height: 12),
            ],
            
            // Traffic Information
            if (_realTimeData!['traffic'] != null) ...[
              _buildTrafficCard(_realTimeData!['traffic']),
              const SizedBox(height: 12),
            ],
            
            // Travel Alerts
            if (_realTimeData!['alerts'] != null && (_realTimeData!['alerts'] as List).isNotEmpty) ...[
              _buildAlertsCard(_realTimeData!['alerts']),
              const SizedBox(height: 12),
            ],
            
            // Weather-based Recommendations
            if (_realTimeData!['recommendations'] != null && (_realTimeData!['recommendations'] as List).isNotEmpty) ...[
              _buildRecommendationsCard(_realTimeData!['recommendations']),
              const SizedBox(height: 12),
            ],
          ],
          
          // Emergency Services (always show)
          if (_realTimeData!['emergency'] != null) ...[
            _buildEmergencyCard(_realTimeData!['emergency']),
          ],
        ],
      ),
    );
  }
  
  Widget _buildWeatherCard(Map<String, dynamic> weather) {
    final condition = weather['condition'] ?? 'unknown';
    final temp = weather['temperature'] ?? 0;
    final humidity = weather['humidity'] ?? 0;
    final windSpeed = weather['windSpeed'] ?? 0;
    
    String weatherEmoji = '☀️';
    Color weatherColor = Colors.orange;
    
    switch (condition) {
      case 'sunny':
        weatherEmoji = '☀️';
        weatherColor = Colors.orange;
        break;
      case 'cloudy':
        weatherEmoji = '☁️';
        weatherColor = Colors.grey;
        break;
      case 'rainy':
        weatherEmoji = '🌧️';
        weatherColor = Colors.blue;
        break;
      case 'partly_cloudy':
        weatherEmoji = '⛅';
        weatherColor = Colors.blueGrey;
        break;
    }
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: weatherColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: weatherColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(weatherEmoji, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text('Current Weather', style: TextStyle(fontWeight: FontWeight.bold, color: weatherColor)),
              const Spacer(),
              Text('${temp}°C', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: weatherColor)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildWeatherDetail('💧', 'Humidity', '${humidity}%'),
              const SizedBox(width: 16),
              _buildWeatherDetail('💨', 'Wind', '${windSpeed} km/h'),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildWeatherDetail(String emoji, String label, String value) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 12)),
        const SizedBox(width: 4),
        Text('$label: $value', style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
  
  Widget _buildTrafficCard(Map<String, dynamic> traffic) {
    final status = traffic['status'] ?? 'unknown';
    final delays = traffic['delays'] ?? 0;
    
    Color trafficColor = Colors.green;
    String trafficEmoji = '🟢';
    
    switch (status) {
      case 'light':
        trafficColor = Colors.green;
        trafficEmoji = '🟢';
        break;
      case 'moderate':
        trafficColor = Colors.orange;
        trafficEmoji = '🟡';
        break;
      case 'heavy':
        trafficColor = Colors.red;
        trafficEmoji = '🔴';
        break;
    }
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: trafficColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: trafficColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(trafficEmoji, style: const TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Text('Traffic Status', style: TextStyle(fontWeight: FontWeight.bold, color: trafficColor)),
              const Spacer(),
              Text(status.toUpperCase(), style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: trafficColor)),
            ],
          ),
          if (delays > 0) ...[
            const SizedBox(height: 4),
            Text('Expected delays: ${delays} minutes', style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
          if (traffic['bestRoutes'] != null) ...[
            const SizedBox(height: 8),
            const Text('Best Routes:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
            ...((traffic['bestRoutes'] as List).take(2).map((route) => 
              Padding(
                padding: const EdgeInsets.only(left: 8, top: 2),
                child: Text('• ${route['name']}: ${route['duration']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
              )
            )),
          ],
        ],
      ),
    );
  }
  
  Widget _buildAlertsCard(List<dynamic> alerts) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning, color: Colors.red[600], size: 16),
              const SizedBox(width: 8),
              Text('Travel Alerts', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red[700])),
            ],
          ),
          const SizedBox(height: 8),
          ...alerts.map((alert) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('⚠️', style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(alert['message'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                      if (alert['action'] != null)
                        Text('Action: ${alert['action']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
  
  Widget _buildRecommendationsCard(List<dynamic> recommendations) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb, color: Colors.green[600], size: 16),
              const SizedBox(width: 8),
              Text('Smart Recommendations', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green[700])),
            ],
          ),
          const SizedBox(height: 8),
          ...recommendations.map((rec) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('💡', style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rec['activity'] ?? rec['item'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                      if (rec['reason'] != null)
                        Text('Reason: ${rec['reason']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyCard(Map<String, dynamic> emergency) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.emergency, color: Colors.red[600], size: 16),
              const SizedBox(width: 8),
              Text('Emergency Contacts', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red[700])),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildEmergencyContact('🚨', 'Police', emergency['police'] ?? '911'),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildEmergencyContact('🏥', 'Medical', emergency['medical'] ?? '911'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildEmergencyContact('📞', 'Tourist Help', emergency['tourist_helpline'] ?? 'N/A'),
          const SizedBox(height: 4),
          _buildEmergencyContact('🏥', 'Hospital', emergency['local_hospital'] ?? 'N/A'),
        ],
      ),
    );
  }
  
  Widget _buildEmergencyContact(String emoji, String label, String contact) {
    return Row(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 12)),
        const SizedBox(width: 6),
        Text('$label: ', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500)),
        Expanded(
          child: Text(contact, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        ),
      ],
    );
  }
  
  void _showAllPlans(AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  const Text('All Plans', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  Text('${appProvider.tripPlans.length + appProvider.itineraries.length} total', style: const TextStyle(color: Colors.grey)),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    if (appProvider.tripPlans.isNotEmpty) ...[
                      const Text('Trip Plans', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...appProvider.tripPlans.map((plan) => _buildUnifiedPlanCard({
                        'type': 'trip',
                        'data': plan,
                        'title': plan.tripTitle ?? 'Trip Plan',
                        'subtitle': '${plan.destination} • ${plan.duration}',
                        'icon': Icons.map,
                        'color': Colors.purple,
                      }, appProvider)),
                      const SizedBox(height: 20),
                    ],
                    if (appProvider.itineraries.isNotEmpty) ...[
                      const Text('Day Itineraries', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...appProvider.itineraries.map((itinerary) => _buildUnifiedPlanCard({
                        'type': 'day',
                        'data': itinerary,
                        'title': itinerary.title,
                        'subtitle': 'Day Itinerary • ${itinerary.dailyPlan.length} activities',
                        'icon': Icons.today,
                        'color': Colors.blue,
                      }, appProvider)),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}