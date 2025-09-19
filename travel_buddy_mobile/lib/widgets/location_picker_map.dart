import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationPickerMap extends StatefulWidget {
  final Function(String location, double lat, double lng) onLocationSelected;

  const LocationPickerMap({super.key, required this.onLocationSelected});

  @override
  State<LocationPickerMap> createState() => _LocationPickerMapState();
}

class _LocationPickerMapState extends State<LocationPickerMap> {
  String selectedLocation = 'Tap on map to select location';
  LatLng selectedPosition = const LatLng(40.7128, -74.0060); // New York City
  GoogleMapController? mapController;
  Set<Marker> markers = {};
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  List<Location> _searchResults = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _getCurrentLocation,
            tooltip: 'My Location',
          ),
          TextButton(
            onPressed: () {
              widget.onLocationSelected(selectedLocation, selectedPosition.latitude, selectedPosition.longitude);
              Navigator.pop(context);
            },
            child: const Text('DONE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search for a location...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _isSearching
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchResults.clear();
                          });
                        },
                      ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
              onSubmitted: _searchLocation,
            ),
          ),
          // Search Results
          if (_searchResults.isNotEmpty)
            Container(
              height: 120,
              color: Colors.white,
              child: ListView.builder(
                itemCount: _searchResults.length,
                itemBuilder: (context, index) {
                  final location = _searchResults[index];
                  return ListTile(
                    leading: const Icon(Icons.place, color: Colors.blue),
                    title: Text('Search Result ${index + 1}'),
                    subtitle: Text('${location.latitude.toStringAsFixed(4)}, ${location.longitude.toStringAsFixed(4)}'),
                    onTap: () => _selectSearchResult(location),
                  );
                },
              ),
            ),
          // Selected Location Display
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
          // Map
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey),
              ),
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: selectedPosition,
                      zoom: 14.0,
                    ),
                    onMapCreated: (GoogleMapController controller) {
                      print('🗺️ Google Map created successfully');
                      mapController = controller;
                    },
                    onTap: _selectLocationFromTap,
                    markers: markers,
                    myLocationEnabled: false,
                    myLocationButtonEnabled: false,
                    mapType: MapType.normal,
                    zoomControlsEnabled: true,
                    liteModeEnabled: false,
                  ),
                  // Fallback overlay if map doesn't load
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Lat: ${selectedPosition.latitude.toStringAsFixed(4)}\nLng: ${selectedPosition.longitude.toStringAsFixed(4)}',
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Popular Locations
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Text('Quick Select:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _getPopularLocations().map((location) => 
                    ActionChip(
                      label: Text(location['name']!),
                      onPressed: () => _selectPredefinedLocation(location),
                      backgroundColor: Colors.blue[50],
                      side: BorderSide(color: Colors.blue[200]!),
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

  void _selectLocationFromTap(LatLng position) async {
    setState(() {
      selectedPosition = position;
      selectedLocation = 'Getting address...';
      markers = {
        Marker(
          markerId: const MarkerId('selected'),
          position: position,
          infoWindow: const InfoWindow(title: 'Selected Location'),
        ),
      };
    });

    // Get address from coordinates
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String address = _formatAddress(place);
        setState(() {
          selectedLocation = address;
        });
      } else {
        setState(() {
          selectedLocation = 'Unknown Location (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})';
        });
      }
    } catch (e) {
      setState(() {
        selectedLocation = 'Selected Location (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})';
      });
    }
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

  void _searchLocation(String query) async {
    if (query.trim().isEmpty) return;

    setState(() {
      _isSearching = true;
      _searchResults.clear();
    });

    try {
      List<Location> locations = await locationFromAddress(query);
      setState(() {
        _searchResults = locations.take(5).toList(); // Limit to 5 results
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Location not found: $query'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isSearching = false;
      });
    }
  }

  void _selectSearchResult(Location location) async {
    final position = LatLng(location.latitude, location.longitude);
    
    setState(() {
      selectedPosition = position;
      selectedLocation = 'Getting address...';
      _searchResults.clear();
      _searchController.clear();
      markers = {
        Marker(
          markerId: const MarkerId('selected'),
          position: position,
          infoWindow: const InfoWindow(title: 'Search Result'),
        ),
      };
    });

    // Animate to location
    mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(position, 16.0),
    );

    // Get formatted address
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        location.latitude,
        location.longitude,
      );
      
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String address = _formatAddress(place);
        setState(() {
          selectedLocation = address;
        });
      }
    } catch (e) {
      setState(() {
        selectedLocation = 'Search Result (${location.latitude.toStringAsFixed(4)}, ${location.longitude.toStringAsFixed(4)})';
      });
    }
  }

  void _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied || 
          permission == LocationPermission.deniedForever) {
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      final currentPos = LatLng(position.latitude, position.longitude);
      
      setState(() {
        selectedPosition = currentPos;
        selectedLocation = 'Current Location';
        markers = {
          Marker(
            markerId: const MarkerId('current'),
            position: currentPos,
            infoWindow: const InfoWindow(title: 'Current Location'),
          ),
        };
      });

      mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(currentPos, 16.0),
      );

      // Get address for current location
      try {
        List<Placemark> placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        
        if (placemarks.isNotEmpty) {
          Placemark place = placemarks[0];
          String address = _formatAddress(place);
          setState(() {
            selectedLocation = address;
          });
        }
      } catch (e) {
        // Keep 'Current Location' if reverse geocoding fails
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get current location'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _formatAddress(Placemark place) {
    List<String> addressParts = [];
    
    if (place.name != null && place.name!.isNotEmpty) {
      addressParts.add(place.name!);
    }
    if (place.street != null && place.street!.isNotEmpty) {
      addressParts.add(place.street!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      addressParts.add(place.locality!);
    }
    if (place.country != null && place.country!.isNotEmpty) {
      addressParts.add(place.country!);
    }
    
    return addressParts.take(2).join(', ');
  }

  List<Map<String, String>> _getPopularLocations() {
    return [
      {'name': 'City Center', 'lat': '37.7749', 'lng': '-122.4194'},
      {'name': 'Airport', 'lat': '37.6213', 'lng': '-122.3790'},
      {'name': 'Beach', 'lat': '37.8199', 'lng': '-122.4783'},
      {'name': 'Park', 'lat': '37.7694', 'lng': '-122.4862'},
    ];
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}