import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/place.dart';
import '../models/route_models.dart';

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
  Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _setupMarkers();
  }

  void _setupMarkers() {
    final markers = <Marker>{};
    
    for (int i = 0; i < widget.places.length; i++) {
      final place = widget.places[i];
      if (place.latitude != null && place.longitude != null) {
        markers.add(
          Marker(
            markerId: MarkerId(place.id),
            position: LatLng(place.latitude!, place.longitude!),
            infoWindow: InfoWindow(title: '${i + 1}. ${place.name}'),
          ),
        );
      }
    }

    setState(() {
      _markers = markers;
    });
  }

  void _openInGoogleMaps() async {
    if (widget.places.isEmpty) return;

    final origin = '${widget.currentLocation.latitude},${widget.currentLocation.longitude}';
    final destination = '${widget.places.last.latitude},${widget.places.last.longitude}';
    
    String waypoints = '';
    if (widget.places.length > 1) {
      waypoints = widget.places
          .sublist(0, widget.places.length - 1)
          .map((p) => '${p.latitude},${p.longitude}')
          .join('|');
    }

    final mode = widget.preferences?.transportMode ?? TransportMode.walking;
    final travelMode = mode == TransportMode.driving ? 'driving' :
                       mode == TransportMode.publicTransit ? 'transit' :
                       mode == TransportMode.cycling ? 'bicycling' : 'walking';

    final url = waypoints.isNotEmpty
        ? 'https://www.google.com/maps/dir/?api=1&origin=$origin&destination=$destination&waypoints=$waypoints&travelmode=$travelMode'
        : 'https://www.google.com/maps/dir/?api=1&origin=$origin&destination=$destination&travelmode=$travelMode';

    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: GoogleMap(
        initialCameraPosition: CameraPosition(
          target: LatLng(widget.currentLocation.latitude, widget.currentLocation.longitude),
          zoom: 12,
        ),
        markers: _markers,
        myLocationEnabled: false,
        zoomControlsEnabled: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openInGoogleMaps,
        icon: const Icon(Icons.map),
        label: const Text('Google Maps'),
        backgroundColor: Colors.blue,
      ),
    );
  }
}
