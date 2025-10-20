import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../services/simple_smart_route_service.dart';

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
  SimpleRouteResult? _route;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRoute();
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

    // Current location marker
    markers.add(
      Marker(
        markerId: const MarkerId('current_location'),
        position: LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Start', snippet: 'Your location'),
      ),
    );

    // Place markers
    for (int i = 0; i < _route!.places.length; i++) {
      final place = _route!.places[i];
      if (place.latitude != null && place.longitude != null) {
        markers.add(
          Marker(
            markerId: MarkerId(place.id),
            position: LatLng(place.latitude!, place.longitude!),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
            infoWindow: InfoWindow(
              title: '${i + 1}. ${place.name}',
              snippet: place.address,
            ),
          ),
        );
      }
    }

    setState(() => _markers = markers);
  }

  void _setupPolyline() {
    if (_route == null || _route!.polylinePoints.isEmpty) return;

    final polylines = <Polyline>{
      Polyline(
        polylineId: const PolylineId('route'),
        points: _route!.polylinePoints,
        color: _getRouteColor(),
        width: 4,
      ),
    };

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
            color: Colors.blue[50],
            child: Row(
              children: [
                Icon(_getTransportIcon(), color: Colors.blue[700]),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_route?.places.length ?? 0} stops • ${_route?.distanceText ?? 'Loading...'} • ${_route?.durationText ?? 'Loading...'}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const Text(
                        'Optimized route with real roads',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
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
                : GoogleMap(
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
                    polylines: _polylines,
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
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
              onTap: () {
                Navigator.pop(context);
                // In production: launch(url);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Would open Google Maps app')),
                );
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
  
  void _startInAppNavigation() {
    // Enable location tracking and route following
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🧭 In-app navigation started! Follow the blue line.'),
        backgroundColor: Colors.blue,
        duration: Duration(seconds: 5),
      ),
    );
    
    // Update map to follow user location
    if (_mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
            zoom: 16,
            bearing: 0,
            tilt: 45,
          ),
        ),
      );
    }
  }
}