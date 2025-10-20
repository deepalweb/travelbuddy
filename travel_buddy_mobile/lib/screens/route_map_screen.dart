import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../services/route_planning_service.dart';
import '../services/route_tracking_service.dart';
import '../services/smart_route_service.dart';

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
  SmartRouteResult? _smartRoute;
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
      final preferences = widget.preferences ?? const RoutePreferences(transportMode: TransportMode.walking);
      
      _smartRoute = await SmartRouteService.createSmartRoute(
        currentLocation: widget.currentLocation,
        places: widget.places,
        preferences: preferences,
      );
      
      _optimizedPlaces = _smartRoute!.optimizedPlaces;
      _trackingService.initializeRoute(_optimizedPlaces);
      
      _setupMarkersAndRoute();
    } catch (e) {
      print('Smart route loading error: $e');
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
    final markers = <Marker>{};

    // Add current location marker (dynamic if tracking)
    final currentPos = _trackingService.currentLocation ?? widget.currentLocation;
    markers.add(
      Marker(
        markerId: const MarkerId('current_location'),
        position: LatLng(currentPos.latitude, currentPos.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: InfoWindow(
          title: _isTracking ? 'You are here' : 'Starting Point',
          snippet: _isTracking ? 'Live location' : 'Route start',
        ),
      ),
    );

    // Add place markers with status-based colors
    for (int i = 0; i < _optimizedPlaces.length; i++) {
      final place = _optimizedPlaces[i];
      if (place.latitude != null && place.longitude != null) {
        final status = _trackingService.placeStatuses[place.id] ?? PlaceStatus.pending;
        final isCurrentTarget = _trackingService.currentTarget?.id == place.id;
        
        BitmapDescriptor markerColor;
        String statusText;
        
        switch (status) {
          case PlaceStatus.visited:
            markerColor = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);
            statusText = '✅ Visited';
            break;
          case PlaceStatus.approaching:
            markerColor = BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange);
            statusText = '🎯 Arriving...';
            break;
          case PlaceStatus.pending:
          default:
            markerColor = isCurrentTarget 
                ? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow)
                : BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed);
            statusText = isCurrentTarget ? '🎯 Next target' : '⏳ Pending';
        }

        markers.add(
          Marker(
            markerId: MarkerId(place.id),
            position: LatLng(place.latitude!, place.longitude!),
            icon: markerColor,
            infoWindow: InfoWindow(
              title: '${i + 1}. ${place.name}',
              snippet: '$statusText\n${place.address}',
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
    final polylines = <Polyline>{};
    
    if (_smartRoute != null && _smartRoute!.polylinePoints.isNotEmpty) {
      // Use actual road route from Google Directions
      polylines.add(
        Polyline(
          polylineId: const PolylineId('smart_route'),
          points: _smartRoute!.polylinePoints,
          color: _isTracking ? Colors.green : _getRouteColor(),
          width: 5,
          patterns: _isTracking ? [] : [PatternItem.dash(15), PatternItem.gap(8)],
        ),
      );
    } else {
      // Fallback to simple route
      final polylinePoints = <LatLng>[];
      final currentPos = _trackingService.currentLocation ?? widget.currentLocation;
      polylinePoints.add(LatLng(currentPos.latitude, currentPos.longitude));

      for (final place in _optimizedPlaces) {
        if (place.latitude != null && place.longitude != null) {
          polylinePoints.add(LatLng(place.latitude!, place.longitude!));
        }
      }

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
      }
    }

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
          if (_smartRoute != null && !_isTracking)
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
                      _smartRoute!.optimizationSummary,
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
                    onMapCreated: (GoogleMapController controller) {
                      _mapController = controller;
                      _fitMapToRoute();
                    },
                    initialCameraPosition: CameraPosition(
                      target: LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
                      zoom: 12,
                    ),
                    markers: _markers,
                    polylines: _polylines,
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
                    mapType: MapType.normal,
                    zoomControlsEnabled: true,
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
                      value: _smartRoute != null 
                          ? '${(_smartRoute!.totalDistance / 1000).toStringAsFixed(1)} km'
                          : 'Loading...',
                    ),
                    _buildInfoItem(
                      icon: Icons.access_time,
                      label: 'Est. Time',
                      value: _smartRoute != null 
                          ? '${_smartRoute!.totalDuration.inHours}h ${_smartRoute!.totalDuration.inMinutes % 60}m'
                          : 'Loading...',
                    ),
                    _buildInfoItem(
                      icon: Icons.place,
                      label: _isTracking ? 'Progress' : 'Stops',
                      value: _isTracking 
                          ? '${_trackingService.completedCount}/${_optimizedPlaces.length}'
                          : '${_optimizedPlaces.length}${_smartRoute?.hasBreaks == true ? ' (+breaks)' : ''}',
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
    if (_mapController == null || widget.places.isEmpty) return;

    final bounds = _calculateBounds();
    _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(bounds, 100.0),
    );
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
    if (_smartRoute?.preferences.transportMode == null) return Colors.blue;
    
    switch (_smartRoute!.preferences.transportMode) {
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