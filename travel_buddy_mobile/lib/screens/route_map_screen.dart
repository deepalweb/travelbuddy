import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../services/route_tracking_service.dart';
import '../services/simple_smart_route_service.dart';

class RouteMapScreen extends StatefulWidget {
  final Position currentLocation;
  final List<Place> places;
  final String title;
  final RoutePreferences? preferences;

  const RouteMapScreen({
    super.key,
    required this.currentLocation,
    required this.places,
    this.title = 'Route Map',
    this.preferences,
  });

  @override
  State<RouteMapScreen> createState() => _RouteMapScreenState();
}

class _RouteMapScreenState extends State<RouteMapScreen> {
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};
  Set<Polyline> _polylines = {};
  late RouteTrackingService _trackingService;
  bool _isTracking = false;
  bool _isLoadingRoute = true;
  SimpleRouteResult? _routeResult;
  List<Place> _optimizedPlaces = [];

  @override
  void initState() {
    super.initState();
    _trackingService = RouteTrackingService();
    _trackingService.addListener(_onTrackingUpdate);
    _loadSmartRoute();
  }

  Future<void> _loadSmartRoute() async {
    setState(() {
      _isLoadingRoute = true;
    });

    try {
      print('🗺️ Loading route with ${widget.places.length} places');
      print('📍 Current location: ${widget.currentLocation.latitude}, ${widget.currentLocation.longitude}');
      
      // Use real Google Directions API
      final routeResult = await SimpleSmartRouteService.createRoute(
        currentLocation: widget.currentLocation,
        places: widget.places,
        mode: widget.preferences?.transportMode ?? TransportMode.walking,
      );
      
      _optimizedPlaces = routeResult.places;
      _routeResult = routeResult;
      
      _trackingService.initializeRoute(_optimizedPlaces);
      _setupMarkersAndRoute();
      
      print('✅ Route setup complete with real directions');
      print('   Markers created: ${_markers.length}');
      print('   Polylines created: ${_polylines.length}');
      print('   Polyline points: ${routeResult.polylinePoints.length}');
    } catch (e) {
      print('❌ Route loading error: $e');
      _optimizedPlaces = widget.places;
      _trackingService.initializeRoute(_optimizedPlaces);
      _setupMarkersAndRoute();
    }

    setState(() {
      _isLoadingRoute = false;
    });
  }

  @override
  void dispose() {
    _trackingService.removeListener(_onTrackingUpdate);
    super.dispose();
  }

  void _onTrackingUpdate() {
    if (mounted) {
      _updateMarkersFromTracking();
      setState(() {});
    }
  }

  void _setupMarkersAndRoute() {
    _updateMarkersFromTracking();
    _setupSmartPolyline();
  }

  void _updateMarkersFromTracking() {
    print('🎯 Updating markers from tracking...');
    final markers = <Marker>{};

    // Add start marker (green)
    final currentPos = _trackingService.currentLocation ?? widget.currentLocation;
    markers.add(
      Marker(
        markerId: const MarkerId('current_location'),
        position: LatLng(currentPos.latitude, currentPos.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(
          title: '📍 Start',
          snippet: 'Your current location',
        ),
      ),
    );

    // Add numbered place markers
    for (int i = 0; i < _optimizedPlaces.length; i++) {
      final place = _optimizedPlaces[i];
      if (place.latitude != null && place.longitude != null) {
        final status = _trackingService.placeStatuses[place.id] ?? PlaceStatus.pending;
        final isLast = i == _optimizedPlaces.length - 1;
        
        BitmapDescriptor markerColor;
        if (status == PlaceStatus.visited) {
          markerColor = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);
        } else if (isLast) {
          markerColor = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed);
        } else {
          markerColor = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange);
        }

        markers.add(
          Marker(
            markerId: MarkerId(place.id),
            position: LatLng(place.latitude!, place.longitude!),
            icon: markerColor,
            infoWindow: InfoWindow(
              title: '${i + 1}. ${place.name}',
              snippet: place.address,
            ),
            onTap: () => _onMarkerTap(place),
          ),
        );
      }
    }

    setState(() {
      _markers = markers;
    });
  }

  void _setupSmartPolyline() {
    print('🛣️ Setting up polylines...');
    final polylines = <Polyline>{};
    
    if (_routeResult != null && _routeResult!.polylinePoints.isNotEmpty) {
      print('   Using real route polyline with ${_routeResult!.polylinePoints.length} points');
      polylines.add(
        Polyline(
          polylineId: const PolylineId('smart_route'),
          points: _routeResult!.polylinePoints,
          color: _isTracking ? Colors.green : _getRouteColor(),
          width: 5,
        ),
      );
    } else {
      // Fallback to simple route
      print('   Using simple route fallback');
      final polylinePoints = <LatLng>[];
      final currentPos = _trackingService.currentLocation ?? widget.currentLocation;
      polylinePoints.add(LatLng(currentPos.latitude, currentPos.longitude));

      for (final place in _optimizedPlaces) {
        if (place.latitude != null && place.longitude != null) {
          polylinePoints.add(LatLng(place.latitude!, place.longitude!));
        }
      }

      print('   Polyline points: ${polylinePoints.length}');
      if (polylinePoints.length > 1) {
        polylines.add(
          Polyline(
            polylineId: const PolylineId('simple_route'),
            points: polylinePoints,
            color: _isTracking ? Colors.green : Colors.blue,
            width: 4,
            patterns: [PatternItem.dash(20), PatternItem.gap(10)],
          ),
        );
        print('   ✅ Polyline created');
      } else {
        print('   ⚠️ Not enough points for polyline');
      }
    }

    print('   Total polylines: ${polylines.length}');
    setState(() {
      _polylines = polylines;
    });
  }

  void _onMarkerTap(Place place) {
    if (_isTracking) {
      _showPlaceActionDialog(place);
    }
  }

  void _showPlaceActionDialog(Place place) {
    final status = _trackingService.placeStatuses[place.id];
    if (status == PlaceStatus.visited) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(place.name),
        content: Text('Mark this place as visited?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _trackingService.markPlaceVisited(place.id);
              Navigator.pop(context);
              _showVisitedSnackBar(place.name);
            },
            child: const Text('Mark Visited'),
          ),
        ],
      ),
    );
  }

  void _showVisitedSnackBar(String placeName) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ $placeName marked as visited!'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: [
          if (_isTracking)
            IconButton(
              icon: Icon(_trackingService.status == RouteStatus.paused ? Icons.play_arrow : Icons.pause),
              onPressed: _toggleTracking,
              tooltip: _trackingService.status == RouteStatus.paused ? 'Resume' : 'Pause',
            ),
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _centerOnCurrentLocation,
            tooltip: 'Center on location',
          ),
        ],
      ),
      body: Column(
        children: [
          // Route tracking banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: _isTracking ? Colors.green[50] : Colors.blue[50],
            child: _isTracking ? _buildTrackingBanner() : _buildRouteBanner(),
          ),
          
          // Optimization info banner
          if (_routeResult != null && !_isTracking)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: Colors.purple[50],
              child: Row(
                children: [
                  Icon(Icons.auto_awesome, color: Colors.purple[700], size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Route optimized: ${_routeResult!.distanceText}, ${_routeResult!.durationText}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.purple[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Google Map
          Expanded(
            child: _isLoadingRoute
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(),
                        SizedBox(height: 16),
                        Text('Loading smart route...'),
                      ],
                    ),
                  )
                : GoogleMap(
                    onMapCreated: (GoogleMapController controller) async {
                      print('🗺️ Map created callback - controller received');
                      _mapController = controller;
                      print('   Markers available: ${_markers.length}');
                      print('   Polylines available: ${_polylines.length}');
                      await Future.delayed(const Duration(milliseconds: 1000));
                      if (mounted) {
                        print('📍 Fitting map to route');
                        _fitMapToRoute();
                      }
                    },
                    initialCameraPosition: CameraPosition(
                      target: LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
                      zoom: 13,
                    ),
                    markers: _markers,
                    polylines: _polylines,
                    myLocationEnabled: false,
                    myLocationButtonEnabled: false,
                    mapType: MapType.normal,
                    zoomControlsEnabled: true,
                    padding: const EdgeInsets.only(bottom: 200, top: 50),
                  ),
          ),

          // Bottom control panel
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.3),
                  spreadRadius: 1,
                  blurRadius: 5,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_isTracking) _buildTrackingControls(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildInfoItem(
                      icon: Icons.route,
                      label: 'Distance',
                      value: _routeResult != null 
                          ? _routeResult!.distanceText
                          : 'Loading...',
                    ),
                    _buildInfoItem(
                      icon: Icons.access_time,
                      label: 'Est. Time',
                      value: _routeResult != null 
                          ? _routeResult!.durationText
                          : 'Loading...',
                    ),
                    _buildInfoItem(
                      icon: Icons.place,
                      label: _isTracking ? 'Progress' : 'Stops',
                      value: _isTracking 
                          ? '${_trackingService.completedCount}/${_optimizedPlaces.length}'
                          : '${_optimizedPlaces.length}',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildStartStopButton(),
                SizedBox(height: MediaQuery.of(context).padding.bottom),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: Colors.blue, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  void _centerOnCurrentLocation() {
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLng(
          LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
        ),
      );
    }
  }

  void _fitMapToRoute() {
    print('🎯 Fitting map to route...');
    if (_mapController == null) {
      print('   ⚠️ Map controller is null');
      return;
    }
    if (widget.places.isEmpty) {
      print('   ⚠️ No places to fit');
      return;
    }

    final bounds = _calculateBounds();
    print('   Bounds: SW(${bounds.southwest.latitude}, ${bounds.southwest.longitude}) NE(${bounds.northeast.latitude}, ${bounds.northeast.longitude})');
    _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 100.0),
    );
    print('   ✅ Camera animation started');
  }

  Widget _buildRouteBanner() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        Column(
          children: [
            const Icon(Icons.location_on, color: Colors.green, size: 20),
            const Text('Start', style: TextStyle(fontSize: 12)),
          ],
        ),
        const Icon(Icons.arrow_forward, color: Colors.grey),
        Column(
          children: [
            Text(
              '${widget.places.length}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
            ),
            const Text('Places', style: TextStyle(fontSize: 12)),
          ],
        ),
        const Icon(Icons.arrow_forward, color: Colors.grey),
        Column(
          children: [
            const Icon(Icons.flag, color: Colors.red, size: 20),
            const Text('End', style: TextStyle(fontSize: 12)),
          ],
        ),
      ],
    );
  }

  Widget _buildTrackingBanner() {
    final currentTarget = _trackingService.currentTarget;
    final distance = _trackingService.getDistanceToCurrentTarget();
    final eta = _trackingService.getETAToCurrentTarget();

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.navigation, color: Colors.green[700]),
            const SizedBox(width: 8),
            Text(
              'Route Active',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.green[700],
              ),
            ),
          ],
        ),
        if (currentTarget != null) ...[
          const SizedBox(height: 8),
          Text(
            'Next: ${currentTarget.name}',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          if (distance != null && eta != null)
            Text(
              '${(distance / 1000).toStringAsFixed(1)}km • ${eta.inMinutes}min',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
        ]
      ],
    );
  }

  Widget _buildTrackingControls() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          Column(
            children: [
              Text(
                '${_trackingService.progressPercentage.toInt()}%',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
              ),
              const Text('Complete', style: TextStyle(fontSize: 10)),
            ],
          ),
          Column(
            children: [
              Text(
                '${_trackingService.completedCount}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
              ),
              const Text('Visited', style: TextStyle(fontSize: 10)),
            ],
          ),
          Column(
            children: [
              Text(
                _trackingService.routeDuration?.inMinutes.toString() ?? '0',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
              ),
              const Text('Minutes', style: TextStyle(fontSize: 10)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStartStopButton() {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton.icon(
        onPressed: _toggleRouteTracking,
        icon: Icon(_isTracking ? Icons.stop : Icons.play_arrow),
        label: Text(_isTracking ? 'Stop Route' : 'Start Route'),
        style: ElevatedButton.styleFrom(
          backgroundColor: _isTracking ? Colors.red : Colors.green,
          foregroundColor: Colors.white,
        ),
      ),
    );
  }

  void _toggleRouteTracking() async {
    if (_isTracking) {
      _trackingService.stopRoute();
      setState(() {
        _isTracking = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Route tracking stopped'),
          backgroundColor: Colors.orange,
        ),
      );
    } else {
      final started = await _trackingService.startRoute();
      if (started) {
        setState(() {
          _isTracking = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('🎯 Route tracking started! Walk to places to auto-complete them.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to start tracking. Check location permissions.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _toggleTracking() {
    if (_trackingService.status == RouteStatus.paused) {
      _trackingService.resumeRoute();
    } else {
      _trackingService.pauseRoute();
    }
  }

  LatLngBounds _calculateBounds() {
    double minLat = widget.currentLocation.latitude;
    double maxLat = widget.currentLocation.latitude;
    double minLng = widget.currentLocation.longitude;
    double maxLng = widget.currentLocation.longitude;

    for (final place in widget.places) {
      if (place.latitude != null && place.longitude != null) {
        minLat = minLat < place.latitude! ? minLat : place.latitude!;
        maxLat = maxLat > place.latitude! ? maxLat : place.latitude!;
        minLng = minLng < place.longitude! ? minLng : place.longitude!;
        maxLng = maxLng > place.longitude! ? maxLng : place.longitude!;
      }
    }

    return LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
  }

  Color _getRouteColor() {
    if (widget.preferences?.transportMode == null) return Colors.blue;
    
    switch (widget.preferences!.transportMode) {
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
}