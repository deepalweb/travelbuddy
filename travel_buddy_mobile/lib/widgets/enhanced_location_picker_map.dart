import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class EnhancedLocationPickerMap extends StatefulWidget {
  final Function(String location, double lat, double lng) onLocationSelected;
  final LatLng? initialPosition;

  const EnhancedLocationPickerMap({
    super.key,
    required this.onLocationSelected,
    this.initialPosition,
  });

  @override
  State<EnhancedLocationPickerMap> createState() => _EnhancedLocationPickerMapState();
}

class _EnhancedLocationPickerMapState extends State<EnhancedLocationPickerMap> {
  late LatLng _selectedPosition;
  String _selectedLocation = 'Tap on map to select location';
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  bool _isLoadingAddress = false;

  @override
  void initState() {
    super.initState();
    _selectedPosition = widget.initialPosition ?? const LatLng(40.7128, -74.0060);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Select Location'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _getCurrentLocation,
            tooltip: 'My Location',
          ),
          TextButton(
            onPressed: _selectedLocation != 'Tap on map to select location'
                ? () {
                    widget.onLocationSelected(
                      _selectedLocation,
                      _selectedPosition.latitude,
                      _selectedPosition.longitude,
                    );
                    Navigator.pop(context);
                  }
                : null,
            child: Text(
              'DONE',
              style: TextStyle(
                color: _selectedLocation != 'Tap on map to select location'
                    ? Colors.white
                    : Colors.white.withOpacity(0.5),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildLocationDisplay(),
          Expanded(child: _buildMap()),
          _buildQuickActions(),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search for a place...',
                  hintStyle: TextStyle(color: Colors.grey[500]),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: _isSearching
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      : _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 20),
                              onPressed: () => _searchController.clear(),
                            )
                          : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                onSubmitted: _searchLocation,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.blue[600],
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(Icons.search, color: Colors.white),
              onPressed: () => _searchLocation(_searchController.text),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationDisplay() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on, color: Colors.red[400], size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Selected Location',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 4),
                _isLoadingAddress
                    ? Row(
                        children: [
                          SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text('Getting address...'),
                        ],
                      )
                    : Text(
                        _selectedLocation,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMap() {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: _selectedPosition,
        zoom: 14.0,
      ),
      onMapCreated: (controller) => _mapController = controller,
      onTap: _selectLocationFromTap,
      markers: _markers,
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Text(
                'Quick Select',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: _getCurrentLocation,
                icon: const Icon(Icons.my_location, size: 16),
                label: const Text('Current Location'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.blue[600],
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _getPopularCategories().map((category) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    avatar: Icon(category['icon'] as IconData, size: 18),
                    label: Text(category['label'] as String),
                    onPressed: () => _searchNearby(category['query'] as String),
                    backgroundColor: Colors.grey[100],
                    side: BorderSide(color: Colors.grey[300]!),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectLocationFromTap(LatLng position) async {
    setState(() {
      _selectedPosition = position;
      _isLoadingAddress = true;
      _markers = {
        Marker(
          markerId: const MarkerId('selected'),
          position: position,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        ),
      };
    });

    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        setState(() {
          _selectedLocation = _formatAddress(placemarks.first);
          _isLoadingAddress = false;
        });
      } else {
        setState(() {
          _selectedLocation = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
          _isLoadingAddress = false;
        });
      }
    } catch (e) {
      setState(() {
        _selectedLocation = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        _isLoadingAddress = false;
      });
    }
  }

  Future<void> _searchLocation(String query) async {
    if (query.trim().isEmpty) return;

    setState(() => _isSearching = true);

    try {
      List<Location> locations = await locationFromAddress(query);

      if (locations.isNotEmpty) {
        final location = locations.first;
        final position = LatLng(location.latitude, location.longitude);

        setState(() {
          _selectedPosition = position;
          _markers = {
            Marker(
              markerId: const MarkerId('search'),
              position: position,
              icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
            ),
          };
        });

        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(position, 16.0),
        );

        await _selectLocationFromTap(position);
      } else {
        _showError('Location not found');
      }
    } catch (e) {
      _showError('Could not find location: $query');
    } finally {
      setState(() => _isSearching = false);
    }
  }

  Future<void> _searchNearby(String query) async {
    final searchQuery = '$query near ${_selectedPosition.latitude},${_selectedPosition.longitude}';
    await _searchLocation(searchQuery);
  }

  Future<void> _getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _showError('Location permission denied');
        return;
      }

      Position position = await Geolocator.getCurrentPosition();
      final currentPos = LatLng(position.latitude, position.longitude);

      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(currentPos, 16.0),
      );

      await _selectLocationFromTap(currentPos);
    } catch (e) {
      _showError('Could not get current location');
    }
  }

  String _formatAddress(Placemark place) {
    List<String> parts = [];

    if (place.name != null && place.name!.isNotEmpty && place.name != place.street) {
      parts.add(place.name!);
    }
    if (place.street != null && place.street!.isNotEmpty) {
      parts.add(place.street!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      parts.add(place.locality!);
    }
    if (place.country != null && place.country!.isNotEmpty) {
      parts.add(place.country!);
    }

    return parts.take(3).join(', ');
  }

  List<Map<String, dynamic>> _getPopularCategories() {
    return [
      {'label': 'Restaurant', 'icon': Icons.restaurant, 'query': 'restaurant'},
      {'label': 'Cafe', 'icon': Icons.local_cafe, 'query': 'cafe'},
      {'label': 'Hotel', 'icon': Icons.hotel, 'query': 'hotel'},
      {'label': 'Park', 'icon': Icons.park, 'query': 'park'},
      {'label': 'Museum', 'icon': Icons.museum, 'query': 'museum'},
      {'label': 'Beach', 'icon': Icons.beach_access, 'query': 'beach'},
    ];
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
