import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../providers/app_provider.dart';
import '../services/route_planning_service.dart';
import '../services/route_tracking_service.dart';
import '../widgets/place_card.dart';
import '../widgets/route_progress_widget.dart';
import '../screens/place_details_screen.dart';
import '../screens/route_map_screen.dart';
import '../screens/route_preferences_screen.dart';
import '../screens/simple_route_map_screen.dart';
import '../services/simple_smart_route_service.dart';

class RoutePlanScreen extends StatefulWidget {
  final List<Place> places;
  final String title;

  const RoutePlanScreen({
    super.key,
    required this.places,
    this.title = 'Route Plan',
  });

  @override
  State<RoutePlanScreen> createState() => _RoutePlanScreenState();
}

class _RoutePlanScreenState extends State<RoutePlanScreen> {
  List<Place> _sortedPlaces = [];
  bool _isLoading = true;
  RoutePreferences _preferences = const RoutePreferences(transportMode: TransportMode.walking);
  List<Place> _removedPlaces = [];

  @override
  void initState() {
    super.initState();
    _planRoute();
  }

  Future<void> _planRoute() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    if (appProvider.currentLocation == null) {
      await appProvider.getCurrentLocation();
    }

    if (appProvider.currentLocation != null) {
      _sortedPlaces = await RoutePlanningService.planOptimalRoute(
        currentLocation: appProvider.currentLocation!,
        places: widget.places,
      );
    } else {
      _sortedPlaces = widget.places;
    }

    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: _openPreferences,
            tooltip: 'Route Preferences',
          ),
          if (!_isLoading && _sortedPlaces.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.map),
              onPressed: _openRouteMap,
              tooltip: 'Open Route Plan',
            ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _buildRouteList(),
      ),
    );
  }

  Widget _buildRouteList() {
    if (_sortedPlaces.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.route, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No places to plan route', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final totalDistance = appProvider.currentLocation != null
            ? RoutePlanningService.calculateTotalRouteDistance(
                currentLocation: appProvider.currentLocation!,
                sortedPlaces: _sortedPlaces,
              )
            : 0.0;

        final estimatedTime = appProvider.currentLocation != null
            ? RoutePlanningService.estimateTravelTime(
                currentLocation: appProvider.currentLocation!,
                sortedPlaces: _sortedPlaces,
              )
            : Duration.zero;

        return Column(
          children: [
            // Route Summary
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(_getTransportIcon(), color: Colors.blue),
                      const SizedBox(width: 8),
                      Text(
                        'Route Summary (${_getTransportLabel()})',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Column(
                        children: [
                          Text(
                            '${_sortedPlaces.length}',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                          const Text('Places', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '${(totalDistance / 1000).toStringAsFixed(1)} km',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                          const Text('Distance', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      Column(
                        children: [
                          Text(
                            '${estimatedTime.inHours}h ${estimatedTime.inMinutes % 60}m',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                          const Text('Est. Time', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Places List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _sortedPlaces.length,
                itemBuilder: (context, index) {
                  final place = _sortedPlaces[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        // Route number
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.blue,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Place card
                        Expanded(
                          child: PlaceCard(
                            place: place,
                            compact: true,
                            isFavorite: appProvider.favoriteIds.contains(place.id),
                            onFavoriteToggle: () async {
                              await appProvider.toggleFavorite(place.id);
                            },
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => PlaceDetailsScreen(place: place),
                                ),
                              );
                            },
                          ),
                        ),
                        // Remove button
                        IconButton(
                          onPressed: () => _removePlace(place, index),
                          icon: const Icon(Icons.remove_circle, color: Colors.red),
                          tooltip: 'Remove from route',
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Route Progress Widget
            Consumer<AppProvider>(
              builder: (context, appProvider, child) {
                return RouteProgressWidget(
                  trackingService: RouteTrackingService(),
                );
              },
            ),
            
            // Open Route Map Button
            Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: 16 + MediaQuery.of(context).viewPadding.bottom,
              ),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _openRouteMap,
                  icon: const Icon(Icons.map),
                  label: const Text('View on Map'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _openRouteMap() {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    if (appProvider.currentLocation == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location not available')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SimpleRouteMapScreen(
          currentLocation: appProvider.currentLocation!,
          places: _sortedPlaces,
          title: widget.title,
          transportMode: _preferences.transportMode,
        ),
      ),
    );
  }

  IconData _getTransportIcon() {
    switch (_preferences.transportMode) {
      case TransportMode.walking:
        return Icons.directions_walk;
      case TransportMode.driving:
        return Icons.directions_car;
      case TransportMode.publicTransit:
        return Icons.directions_transit;
      case TransportMode.cycling:
        return Icons.directions_bike;
    }
  }

  String _getTransportLabel() {
    switch (_preferences.transportMode) {
      case TransportMode.walking:
        return 'Walking';
      case TransportMode.driving:
        return 'Driving';
      case TransportMode.publicTransit:
        return 'Transit';
      case TransportMode.cycling:
        return 'Cycling';
    }
  }

  void _removePlace(Place place, int index) {
    setState(() {
      _removedPlaces.add(place);
      _sortedPlaces.removeAt(index);
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${place.name} removed from route'),
        action: SnackBarAction(
          label: 'Undo',
          onPressed: () => _undoRemove(place, index),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }
  
  void _undoRemove(Place place, int originalIndex) {
    setState(() {
      _removedPlaces.remove(place);
      final insertIndex = originalIndex.clamp(0, _sortedPlaces.length);
      _sortedPlaces.insert(insertIndex, place);
    });
  }

  void _openPreferences() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RoutePreferencesScreen(
          initialPreferences: _preferences,
          onPreferencesChanged: (newPreferences) {
            setState(() {
              _preferences = newPreferences;
            });
            _planRoute(); // Re-plan route with new preferences
          },
        ),
      ),
    );
  }
}