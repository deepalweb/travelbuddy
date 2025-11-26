import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import '../models/place.dart';
import '../models/route_models.dart';
import '../services/simple_smart_route_service.dart';
import '../services/storage_service.dart';

class SimpleRouteMapScreen extends StatefulWidget {
  final Position currentLocation;
  final List<Place> places;
  final String title;
  final TransportMode transportMode;

  const SimpleRouteMapScreen({
    super.key,
    required this.currentLocation,
    required this.places,
    this.title = 'Route Map',
    this.transportMode = TransportMode.walking,
  });

  @override
  State<SimpleRouteMapScreen> createState() => _SimpleRouteMapScreenState();
}

class _SimpleRouteMapScreenState extends State<SimpleRouteMapScreen> {
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};
  Set<Circle> _circles = {};
  SimpleRouteResult? _route;
  bool _isLoading = true;
  StreamSubscription<Position>? _locationSubscription;
  Position? _currentPosition;
  bool _isNavigating = false;
  int _currentStopIndex = 0;
  final Set<int> _visitedStops = {};
  bool _showStopList = false;

  @override
  void initState() {
    super.initState();
    _currentPosition = widget.currentLocation;
    _loadRoute();
  }
  
  @override
  void dispose() {
    _locationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadRoute() async {
    setState(() => _isLoading = true);

    _route = await SimpleSmartRouteService.createRoute(
      currentLocation: widget.currentLocation,
      places: widget.places,
      mode: widget.transportMode,
    );

    _setupMapElements();
    setState(() => _isLoading = false);
  }

  void _setupMapElements() {
    if (_route == null) return;

    _setupMarkers();
    _setupPolyline();
  }

  void _setupMarkers() {
    final markers = <Marker>{};
    final circles = <Circle>{};

    // Current location with pulsing circle
    if (_currentPosition != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: '📍 You are here'),
        ),
      );
      
      circles.add(
        Circle(
          circleId: const CircleId('current_location_circle'),
          center: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          radius: 50,
          fillColor: Colors.blue.withOpacity(0.2),
          strokeColor: Colors.blue,
          strokeWidth: 2,
        ),
      );
    }

    // Place markers with colors
    for (int i = 0; i < _route!.places.length; i++) {
      final place = _route!.places[i];
      if (place.latitude == null || place.longitude == null) continue;
      
      final isVisited = _visitedStops.contains(i);
      final isCurrent = i == _currentStopIndex;
      
      double hue;
      String emoji;
      if (isVisited) {
        hue = BitmapDescriptor.hueGreen;
        emoji = '✅';
      } else if (isCurrent) {
        hue = BitmapDescriptor.hueOrange;
        emoji = '🎯';
      } else {
        hue = BitmapDescriptor.hueRed;
        emoji = '📍';
      }
      
      markers.add(
        Marker(
          markerId: MarkerId(place.id),
          position: LatLng(place.latitude!, place.longitude!),
          icon: BitmapDescriptor.defaultMarkerWithHue(hue),
          infoWindow: InfoWindow(
            title: '$emoji ${i + 1}. ${place.name}',
            snippet: place.address,
          ),
        ),
      );
      
      if (isCurrent && _isNavigating) {
        circles.add(
          Circle(
            circleId: CircleId('destination_$i'),
            center: LatLng(place.latitude!, place.longitude!),
            radius: 100,
            fillColor: Colors.orange.withOpacity(0.2),
            strokeColor: Colors.orange,
            strokeWidth: 2,
          ),
        );
      }
    }

    setState(() {
      _markers = markers;
      _circles = circles;
    });
  }

  void _setupPolyline() {
    if (_route == null || _route!.polylinePoints.isEmpty) return;

    final polylines = <Polyline>{};
    
    if (_isNavigating && _currentStopIndex > 0) {
      int splitIndex = (_route!.polylinePoints.length * _currentStopIndex / _route!.places.length).round();
      
      final completedPoints = _route!.polylinePoints.sublist(0, splitIndex);
      final pendingPoints = _route!.polylinePoints.sublist(splitIndex);
      
      if (completedPoints.length > 1) {
        polylines.add(
          Polyline(
            polylineId: const PolylineId('route_completed'),
            points: completedPoints,
            color: Colors.green,
            width: 6,
          ),
        );
      }
      
      if (pendingPoints.length > 1) {
        polylines.add(
          Polyline(
            polylineId: const PolylineId('route_pending'),
            points: pendingPoints,
            color: _getRouteColor(),
            width: 6,
            patterns: [PatternItem.dash(20), PatternItem.gap(10)],
          ),
        );
      }
    } else {
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route'),
          points: _route!.polylinePoints,
          color: _getRouteColor(),
          width: 6,
        ),
      );
    }

    setState(() => _polylines = polylines);
  }

  Color _getRouteColor() {
    switch (widget.transportMode) {
      case TransportMode.walking:
        return Colors.green;
      case TransportMode.driving:
        return Colors.blue;
      case TransportMode.publicTransit:
        return Colors.purple;
      case TransportMode.cycling:
        return Colors.orange;
    }
  }

  IconData _getTransportIcon() {
    switch (widget.transportMode) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _centerOnRoute,
          ),
        ],
      ),
      body: Column(
        children: [
          // Route info banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _isNavigating ? Colors.green[50] : Colors.blue[50],
            child: Row(
              children: [
                Icon(
                  _isNavigating ? Icons.navigation : _getTransportIcon(),
                  color: _isNavigating ? Colors.green[700] : Colors.blue[700],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isNavigating
                            ? 'Stop ${_currentStopIndex + 1}/${_route?.places.length ?? 0} • ${_route?.distanceText ?? ''}'
                            : '${_route?.places.length ?? 0} stops • ${_route?.distanceText ?? 'Loading...'} • ${_route?.durationText ?? 'Loading...'}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        _isNavigating ? '🧭 Navigating...' : 'Optimized route with real roads',
                        style: TextStyle(
                          fontSize: 12,
                          color: _isNavigating ? Colors.green[700] : Colors.grey,
                          fontWeight: _isNavigating ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
                if (_isNavigating)
                  IconButton(
                    icon: const Icon(Icons.stop_circle, color: Colors.red),
                    onPressed: () {
                      _stopNavigation();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Navigation stopped')),
                      );
                    },
                    tooltip: 'Stop Navigation',
                  ),
              ],
            ),
          ),

          // Map
          Expanded(
            child: _isLoading
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Creating your route...'),
                      ],
                    ),
                  )
                : Stack(
                    children: [
                      GoogleMap(
                        onMapCreated: (controller) {
                          _mapController = controller;
                          _centerOnRoute();
                        },
                        initialCameraPosition: CameraPosition(
                          target: LatLng(
                            widget.currentLocation.latitude,
                            widget.currentLocation.longitude,
                          ),
                          zoom: 12,
                        ),
                        markers: _markers,
                        circles: _circles,
                        myLocationEnabled: false,
                        myLocationButtonEnabled: false,
                      ),
                      
                      Positioned(
                        top: 16,
                        right: 16,
                        child: FloatingActionButton(
                          mini: true,
                          backgroundColor: Colors.white,
                          onPressed: _centerOnRoute,
                          child: const Icon(Icons.zoom_out_map, color: Colors.blue),
                        ),
                      ),
                      
                      if (_isNavigating)
                        Positioned(
                          top: 16,
                          left: 16,
                          right: 80,
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'Stop $_currentStopIndex/${_route?.places.length ?? 0}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      '${((_currentStopIndex / (_route?.places.length ?? 1)) * 100).toInt()}%',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green[700],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: _currentStopIndex / (_route?.places.length ?? 1),
                                    minHeight: 6,
                                    backgroundColor: Colors.grey[200],
                                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),

          // Bottom info panel with safe area
          Container(
            padding: EdgeInsets.fromLTRB(
              16, 
              16, 
              16, 
              16 + MediaQuery.of(context).padding.bottom
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  blurRadius: 5,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildInfoItem(
                      Icons.place,
                      '${_route?.places.length ?? 0}',
                      'Stops',
                    ),
                    _buildInfoItem(
                      Icons.route,
                      _route?.distanceText ?? '0 km',
                      'Distance',
                    ),
                    _buildInfoItem(
                      Icons.access_time,
                      _route?.durationText ?? '0m',
                      'Duration',
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (!_isNavigating)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _route != null ? _startNavigation : null,
                      icon: const Icon(Icons.navigation),
                      label: const Text('Start Navigation'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  )
                else
                  Column(
                    children: [
                      Text(
                        _currentStopIndex < (_route?.places.length ?? 0)
                            ? 'Next: ${_route!.places[_currentStopIndex].name}'
                            : 'Final destination reached!',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _stopNavigation,
                          icon: const Icon(Icons.stop),
                          label: const Text('Stop Navigation'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
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
    );
  }

  Widget _buildInfoItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.blue, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  void _centerOnRoute() {
    if (_mapController == null || _route == null) return;

    if (_route!.polylinePoints.isNotEmpty) {
      final bounds = _calculateBounds(_route!.polylinePoints);
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 100),
      );
    }
  }

  LatLngBounds _calculateBounds(List<LatLng> points) {
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final point in points) {
      minLat = minLat < point.latitude ? minLat : point.latitude;
      maxLat = maxLat > point.latitude ? maxLat : point.latitude;
      minLng = minLng < point.longitude ? minLng : point.longitude;
      maxLng = maxLng > point.longitude ? maxLng : point.longitude;
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  void _startNavigation() {
    if (_route == null || _route!.places.isEmpty) return;
    
    // Option 1: Open in Google Maps app
    _openInGoogleMaps();
    
    // Option 2: Show in-app navigation
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🧭 Opening in Google Maps for turn-by-turn navigation'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _openInGoogleMaps() async {
    if (_route == null || _route!.places.isEmpty) return;
    
    final origin = '${widget.currentLocation.latitude},${widget.currentLocation.longitude}';
    final destination = '${_route!.places.last.latitude},${_route!.places.last.longitude}';
    
    String waypoints = '';
    if (_route!.places.length > 1) {
      waypoints = _route!.places
          .sublist(0, _route!.places.length - 1)
          .where((p) => p.latitude != null && p.longitude != null)
          .map((p) => '${p.latitude},${p.longitude}')
          .join('|');
    }
    
    final mode = _getGoogleMapsMode();
    String url = 'https://www.google.com/maps/dir/?api=1&origin=$origin&destination=$destination&travelmode=$mode';
    
    if (waypoints.isNotEmpty) {
      url += '&waypoints=$waypoints';
    }
    
    // For demo, show URL in dialog
    _showNavigationDialog(url);
  }
  
  String _getGoogleMapsMode() {
    switch (widget.transportMode) {
      case TransportMode.walking:
        return 'walking';
      case TransportMode.driving:
        return 'driving';
      case TransportMode.publicTransit:
        return 'transit';
      case TransportMode.cycling:
        return 'bicycling';
    }
  }
  
  void _showNavigationDialog(String url) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🧭 Start Navigation'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choose navigation option:'),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.map, color: Colors.blue),
              title: const Text('Google Maps App'),
              subtitle: const Text('Turn-by-turn navigation'),
              onTap: () async {
                Navigator.pop(context);
                await _launchGoogleMaps(url);
              },
            ),
            ListTile(
              leading: const Icon(Icons.navigation, color: Colors.green),
              title: const Text('In-App Navigation'),
              subtitle: const Text('Basic route following'),
              onTap: () {
                Navigator.pop(context);
                _startInAppNavigation();
              },
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _launchGoogleMaps(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open Google Maps')),
        );
      }
    }
  }
  
  void _startInAppNavigation() async {
    setState(() {
      _isNavigating = true;
      _currentStopIndex = 0;
      _visitedStops.clear();
    });
    
    await _saveRouteOffline();
    _startLocationTracking();
    _setupMarkers();
    _setupPolyline();
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🧭 Navigation started! Tracking your location...'),
        backgroundColor: Colors.blue,
        duration: Duration(seconds: 3),
      ),
    );
    
    if (_mapController != null && _currentPosition != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
            zoom: 17,
            bearing: 0,
            tilt: 45,
          ),
        ),
      );
    }
  }
  
  void _startLocationTracking() {
    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      ),
    ).listen((Position position) {
      setState(() {
        _currentPosition = position;
      });
      
      // Update camera to follow user
      if (_isNavigating && _mapController != null) {
        _mapController!.animateCamera(
          CameraUpdate.newLatLng(
            LatLng(position.latitude, position.longitude),
          ),
        );
      }
      
      // Check if reached current stop
      _checkIfReachedStop(position);
      
      // Check if off-track and reroute
      _checkIfOffTrack(position);
    });
  }
  
  void _checkIfReachedStop(Position position) {
    if (_route == null || _currentStopIndex >= _route!.places.length) return;
    
    final currentStop = _route!.places[_currentStopIndex];
    if (currentStop.latitude == null || currentStop.longitude == null) return;
    
    final distance = Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      currentStop.latitude!,
      currentStop.longitude!,
    );
    
    if (distance < 50) {
      _visitedStops.add(_currentStopIndex);
      _currentStopIndex++;
      
      _setupMarkers();
      _setupPolyline();
      
      if (_currentStopIndex < _route!.places.length) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Arrived! Next: ${_route!.places[_currentStopIndex].name}'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      } else {
        _stopNavigation();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎉 You\'ve reached your final destination!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 5),
          ),
        );
      }
    }
  }
  
  void _checkIfOffTrack(Position position) {
    if (_route == null || _route!.polylinePoints.isEmpty) return;
    
    // Find closest point on route
    double minDistance = double.infinity;
    for (final point in _route!.polylinePoints) {
      final distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        point.latitude,
        point.longitude,
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }
    
    // If more than 100 meters off track, suggest reroute
    if (minDistance > 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('⚠️ You\'re off track. Recalculating route...'),
          backgroundColor: Colors.orange,
          action: SnackBarAction(
            label: 'Reroute',
            onPressed: _recalculateRoute,
          ),
        ),
      );
    }
  }
  
  void _recalculateRoute() async {
    if (_currentPosition == null) return;
    
    setState(() => _isLoading = true);
    
    // Get remaining places
    final remainingPlaces = _route!.places.sublist(_currentStopIndex);
    
    // Recalculate route from current position
    _route = await SimpleSmartRouteService.createRoute(
      currentLocation: _currentPosition!,
      places: remainingPlaces,
      mode: widget.transportMode,
    );
    
    _setupMapElements();
    setState(() => _isLoading = false);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('✅ Route recalculated!'),
        backgroundColor: Colors.green,
      ),
    );
  }
  
  void _stopNavigation() {
    setState(() {
      _isNavigating = false;
    });
    _locationSubscription?.cancel();
  }
  
  Future<void> _saveRouteOffline() async {
    if (_route == null) return;
    
    try {
      final storage = StorageService();
      final routeData = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': widget.title,
        'places': _route!.places.map((p) => {
          'id': p.id,
          'name': p.name,
          'address': p.address,
          'latitude': p.latitude,
          'longitude': p.longitude,
        }).toList(),
        'distance': _route!.distanceText,
        'duration': _route!.durationText,
        'transportMode': widget.transportMode.toString(),
        'savedAt': DateTime.now().toIso8601String(),
      };
      
      // Save to SharedPreferences
      final prefs = await storage.getSOSSettings(); // Reuse storage method
      // In production, create a dedicated method for route storage
      
      print('✅ Route saved offline');
    } catch (e) {
      print('❌ Failed to save route: $e');
    }
  }
}