import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../providers/app_provider.dart';
import '../services/enhanced_route_planning_service.dart';
import '../widgets/route_alternative_card.dart';
import '../widgets/scheduled_stop_card.dart';

class EnhancedRoutePlanScreen extends StatefulWidget {
  final List<Place> places;
  final String title;

  const EnhancedRoutePlanScreen({
    super.key,
    required this.places,
    this.title = 'Enhanced Route Plan',
  });

  @override
  State<EnhancedRoutePlanScreen> createState() => _EnhancedRoutePlanScreenState();
}

class _EnhancedRoutePlanScreenState extends State<EnhancedRoutePlanScreen>
    with TickerProviderStateMixin {
  List<OptimizedRoute> _routeAlternatives = [];
  OptimizedRoute? _selectedRoute;
  bool _isLoading = true;
  late TabController _tabController;
  
  RoutePreferences _preferences = const RoutePreferences();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _planRoutes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _planRoutes() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    if (appProvider.currentLocation == null) {
      await appProvider.getCurrentLocation();
    }

    if (appProvider.currentLocation != null) {
      final routes = <OptimizedRoute>[];
      
      // Generate route alternatives
      final shortestRoute = await EnhancedRoutePlanningService.createShortestRoute(
        appProvider.currentLocation!,
        widget.places,
        DateTime.now(),
      );
      final fastestRoute = await EnhancedRoutePlanningService.createFastestRoute(
        appProvider.currentLocation!,
        widget.places,
        DateTime.now(),
      );
      final scenicRoute = await EnhancedRoutePlanningService.createScenicRoute(
        appProvider.currentLocation!,
        widget.places,
        DateTime.now(),
      );
      
      routes.addAll([shortestRoute, fastestRoute, scenicRoute]);
      routes.sort((a, b) => b.totalScore.compareTo(a.totalScore));
      
      /*final routes = await EnhancedRoutePlanningService._generateRouteAlternatives(
        currentLocation: appProvider.currentLocation!,
        places: widget.places,
        preferences: _preferences,
        startTime: DateTime.now(),
      );*/
      
      setState(() {
        _routeAlternatives = routes;
        _selectedRoute = routes.isNotEmpty ? routes.first : null;
        _isLoading = false;
      });
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _showPreferences,
            tooltip: 'Route Preferences',
          ),
          if (_selectedRoute != null)
            IconButton(
              icon: const Icon(Icons.map),
              onPressed: _openMapView,
              tooltip: 'Map View',
            ),
        ],
        bottom: _isLoading ? null : TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.route), text: 'Routes'),
            Tab(icon: Icon(Icons.schedule), text: 'Schedule'),
            Tab(icon: Icon(Icons.insights), text: 'Insights'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildRoutesTab(),
                _buildScheduleTab(),
                _buildInsightsTab(),
              ],
            ),
    );
  }

  Widget _buildRoutesTab() {
    if (_routeAlternatives.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.route_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No routes available', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _routeAlternatives.length,
      itemBuilder: (context, index) {
        final route = _routeAlternatives[index];
        final isSelected = _selectedRoute?.id == route.id;
        
        return RouteAlternativeCard(
          route: route,
          isSelected: isSelected,
          onTap: () {
            setState(() {
              _selectedRoute = route;
            });
          },
          onStartRoute: () => _startRoute(route),
        );
      },
    );
  }

  Widget _buildScheduleTab() {
    if (_selectedRoute == null) {
      return const Center(
        child: Text('Select a route to view schedule'),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _selectedRoute!.schedule.length,
      itemBuilder: (context, index) {
        final stop = _selectedRoute!.schedule[index];
        return ScheduledStopCard(
          stop: stop,
          isFirst: index == 0,
          isLast: index == _selectedRoute!.schedule.length - 1,
        );
      },
    );
  }

  Widget _buildInsightsTab() {
    if (_selectedRoute == null) {
      return const Center(
        child: Text('Select a route to view insights'),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildInsightCard(
            'Route Efficiency',
            'This route is optimized for ${_selectedRoute!.typeDisplayName.toLowerCase()}',
            Icons.trending_up,
            Colors.green,
          ),
          const SizedBox(height: 16),
          _buildInsightCard(
            'Best Time to Start',
            'Start between 9:00 AM - 10:00 AM for optimal experience',
            Icons.schedule,
            Colors.blue,
          ),
          const SizedBox(height: 16),
          _buildInsightCard(
            'Weather Consideration',
            'Check weather forecast - some places are better visited on sunny days',
            Icons.wb_sunny,
            Colors.orange,
          ),
          const SizedBox(height: 16),
          _buildInsightCard(
            'Crowd Levels',
            'Expect moderate crowds at popular attractions',
            Icons.people,
            Colors.purple,
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(String title, String description, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
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

  void _showPreferences() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Text(
                'Route Preferences',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  controller: scrollController,
                  children: [
                    _buildPreferenceSection('Transport Mode', [
                      _buildTransportModeOption(TransportMode.walking, 'Walking', Icons.directions_walk),
                      _buildTransportModeOption(TransportMode.driving, 'Driving', Icons.directions_car),
                      _buildTransportModeOption(TransportMode.publicTransit, 'Public Transit', Icons.directions_transit),
                      _buildTransportModeOption(TransportMode.cycling, 'Cycling', Icons.directions_bike),
                    ]),
                    const SizedBox(height: 24),
                    _buildPreferenceSection('Options', [
                      SwitchListTile(
                        title: const Text('Consider Opening Hours'),
                        subtitle: const Text('Factor in place operating hours'),
                        value: _preferences.considerOpeningHours,
                        onChanged: (value) {
                          setState(() {
                            _preferences = RoutePreferences(
                              transportMode: _preferences.transportMode,
                              considerOpeningHours: value,
                              optimizeForRating: _preferences.optimizeForRating,
                              includeBreaks: _preferences.includeBreaks,
                            );
                          });
                        },
                      ),
                      SwitchListTile(
                        title: const Text('Optimize for Rating'),
                        subtitle: const Text('Prioritize highly-rated places'),
                        value: _preferences.optimizeForRating,
                        onChanged: (value) {
                          setState(() {
                            _preferences = RoutePreferences(
                              transportMode: _preferences.transportMode,
                              considerOpeningHours: _preferences.considerOpeningHours,
                              optimizeForRating: value,
                              includeBreaks: _preferences.includeBreaks,
                            );
                          });
                        },
                      ),
                      SwitchListTile(
                        title: const Text('Include Breaks'),
                        subtitle: const Text('Add rest stops and meal breaks'),
                        value: _preferences.includeBreaks,
                        onChanged: (value) {
                          setState(() {
                            _preferences = RoutePreferences(
                              transportMode: _preferences.transportMode,
                              considerOpeningHours: _preferences.considerOpeningHours,
                              optimizeForRating: _preferences.optimizeForRating,
                              includeBreaks: value,
                            );
                          });
                        },
                      ),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _planRoutes(); // Replan with new preferences
                  },
                  child: const Text('Apply Preferences'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreferenceSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...children,
      ],
    );
  }

  Widget _buildTransportModeOption(TransportMode mode, String label, IconData icon) {
    return RadioListTile<TransportMode>(
      title: Row(
        children: [
          Icon(icon, size: 20),
          const SizedBox(width: 8),
          Text(label),
        ],
      ),
      value: mode,
      groupValue: _preferences.transportMode,
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _preferences = RoutePreferences(
              transportMode: value,
              considerOpeningHours: _preferences.considerOpeningHours,
              optimizeForRating: _preferences.optimizeForRating,
              includeBreaks: _preferences.includeBreaks,
            );
          });
        }
      },
    );
  }

  void _startRoute(OptimizedRoute route) {
    // TODO: Navigate to enhanced route tracking screen
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Starting ${route.typeDisplayName} route!'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _openMapView() {
    // TODO: Navigate to enhanced map view
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Enhanced map view coming soon!'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}