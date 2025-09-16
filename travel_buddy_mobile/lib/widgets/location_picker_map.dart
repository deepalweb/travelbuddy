import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class LocationPickerMap extends StatefulWidget {
  final Function(String location, double lat, double lng) onLocationSelected;

  const LocationPickerMap({super.key, required this.onLocationSelected});

  @override
  State<LocationPickerMap> createState() => _LocationPickerMapState();
}

class _LocationPickerMapState extends State<LocationPickerMap> {
  String selectedLocation = 'Tap on map to select location';
  LatLng selectedPosition = const LatLng(37.7749, -122.4194);
  GoogleMapController? mapController;
  Set<Marker> markers = {};

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: () {
              widget.onLocationSelected(selectedLocation, selectedPosition.latitude, selectedPosition.longitude);
              Navigator.pop(context);
            },
            child: const Text('DONE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Row(
              children: [
                const Icon(Icons.location_on, color: Colors.red),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    selectedLocation,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: selectedPosition,
                zoom: 14.0,
              ),
              onMapCreated: (GoogleMapController controller) {
                mapController = controller;
              },
              onTap: _selectLocationFromTap,
              markers: markers,
              myLocationEnabled: true,
              myLocationButtonEnabled: true,
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Text('Popular Locations:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _getPopularLocations().map((location) => 
                    ActionChip(
                      label: Text(location['name']!),
                      onPressed: () => _selectPredefinedLocation(location),
                    ),
                  ).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _selectLocationFromTap(LatLng position) {
    setState(() {
      selectedPosition = position;
      selectedLocation = 'Selected Location (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})';
      markers = {
        Marker(
          markerId: const MarkerId('selected'),
          position: position,
          infoWindow: const InfoWindow(title: 'Selected Location'),
        ),
      };
    });
  }

  void _selectPredefinedLocation(Map<String, String> location) {
    final lat = double.parse(location['lat']!);
    final lng = double.parse(location['lng']!);
    final position = LatLng(lat, lng);
    
    setState(() {
      selectedLocation = location['name']!;
      selectedPosition = position;
      markers = {
        Marker(
          markerId: const MarkerId('selected'),
          position: position,
          infoWindow: InfoWindow(title: location['name']!),
        ),
      };
    });
    
    mapController?.animateCamera(
      CameraUpdate.newLatLng(position),
    );
  }

  List<Map<String, String>> _getPopularLocations() {
    return [
      {'name': 'Times Square, NYC', 'lat': '40.7580', 'lng': '-73.9855'},
      {'name': 'Eiffel Tower, Paris', 'lat': '48.8584', 'lng': '2.2945'},
      {'name': 'Tokyo Tower, Japan', 'lat': '35.6586', 'lng': '139.7454'},
      {'name': 'Big Ben, London', 'lat': '51.4994', 'lng': '-0.1245'},
    ];
  }
}