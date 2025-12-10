import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:async';

class LocationAutocompleteField extends StatefulWidget {
  final TextEditingController controller;
  final Function(String location, double? lat, double? lng)? onLocationSelected;
  final String? hintText;

  const LocationAutocompleteField({
    super.key,
    required this.controller,
    this.onLocationSelected,
    this.hintText,
  });

  @override
  State<LocationAutocompleteField> createState() => _LocationAutocompleteFieldState();
}

class _LocationAutocompleteFieldState extends State<LocationAutocompleteField> {
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  List<LocationSuggestion> _suggestions = [];
  bool _isSearching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _removeOverlay();
    widget.controller.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    final text = widget.controller.text;
    if (text.length < 3) {
      _removeOverlay();
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 500), () {
      _searchLocations(text);
    });
  }

  Future<void> _searchLocations(String query) async {
    setState(() => _isSearching = true);

    try {
      // Search using geocoding
      List<Location> locations = await locationFromAddress(query);
      
      List<LocationSuggestion> suggestions = [];
      for (var location in locations.take(5)) {
        try {
          List<Placemark> placemarks = await placemarkFromCoordinates(
            location.latitude,
            location.longitude,
          );
          
          if (placemarks.isNotEmpty) {
            final place = placemarks.first;
            suggestions.add(LocationSuggestion(
              name: _formatPlaceName(place),
              address: _formatAddress(place),
              lat: location.latitude,
              lng: location.longitude,
            ));
          }
        } catch (e) {
          // Skip this location if reverse geocoding fails
        }
      }

      setState(() {
        _suggestions = suggestions;
        _isSearching = false;
      });

      if (suggestions.isNotEmpty) {
        _showOverlay();
      } else {
        _removeOverlay();
      }
    } catch (e) {
      setState(() {
        _suggestions = [];
        _isSearching = false;
      });
      _removeOverlay();
    }
  }

  void _showOverlay() {
    _removeOverlay();

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: MediaQuery.of(context).size.width - 32,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, 60),
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 250),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: ListView.separated(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                itemCount: _suggestions.length,
                separatorBuilder: (context, index) => Divider(height: 1, color: Colors.grey[200]),
                itemBuilder: (context, index) {
                  final suggestion = _suggestions[index];
                  return ListTile(
                    leading: Icon(Icons.location_on, color: Colors.blue[600]),
                    title: Text(
                      suggestion.name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    subtitle: Text(
                      suggestion.address,
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () => _selectSuggestion(suggestion),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  void _selectSuggestion(LocationSuggestion suggestion) {
    widget.controller.text = suggestion.name;
    _removeOverlay();
    
    if (widget.onLocationSelected != null) {
      widget.onLocationSelected!(suggestion.name, suggestion.lat, suggestion.lng);
    }
  }

  String _formatPlaceName(Placemark place) {
    if (place.name != null && place.name!.isNotEmpty) {
      return place.name!;
    }
    if (place.street != null && place.street!.isNotEmpty) {
      return place.street!;
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      return place.locality!;
    }
    return 'Unknown Location';
  }

  String _formatAddress(Placemark place) {
    List<String> parts = [];
    
    if (place.locality != null && place.locality!.isNotEmpty) {
      parts.add(place.locality!);
    }
    if (place.administrativeArea != null && place.administrativeArea!.isNotEmpty) {
      parts.add(place.administrativeArea!);
    }
    if (place.country != null && place.country!.isNotEmpty) {
      parts.add(place.country!);
    }
    
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: TextField(
        controller: widget.controller,
        decoration: InputDecoration(
          hintText: widget.hintText ?? 'Search for a location...',
          hintStyle: TextStyle(color: Colors.grey[500]),
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _isSearching
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : widget.controller.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        widget.controller.clear();
                        _removeOverlay();
                      },
                    )
                  : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(16),
        ),
      ),
    );
  }
}

class LocationSuggestion {
  final String name;
  final String address;
  final double lat;
  final double lng;

  LocationSuggestion({
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });
}
