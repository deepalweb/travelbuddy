import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../models/place.dart';
import '../models/route_models.dart';
import '../services/simple_smart_route_service.dart';
import '../screens/simple_route_map_screen.dart';

class SmartRouteListScreen extends StatefulWidget {
  final Position currentLocation;
  final List<Place> places;
  final String title;
  final RoutePreferences preferences;

  const SmartRouteListScreen({
    super.key,
    required this.currentLocation,
    required this.places,
    required this.title,
    required this.preferences,
  });

  @override
  State<SmartRouteListScreen> createState() => _SmartRouteListScreenState();
}

class _SmartRouteListScreenState extends State<SmartRouteListScreen> {
  List<PlaceWithTimeframe> _orderedPlaces = [];
  bool _isLoading = true;
  SimpleRouteResult? _routeResult;

  @override
  void initState() {
    super.initState();
    _calculateRoute();
  }

  Future<void> _calculateRoute() async {
    setState(() => _isLoading = true);

    try {
      print('🚀 Starting route calculation with ${widget.places.length} places');
      
      // Create route using smart algorithm
      _routeResult = await SimpleSmartRouteService.createRoute(
        currentLocation: widget.currentLocation,
        places: widget.places,
        mode: widget.preferences.transportMode,
      );

      print('✅ Route result: ${_routeResult!.places.length} places, ${_routeResult!.distanceText}');

      // Calculate timeframes for each place
      _orderedPlaces = _calculateTimeframes(_routeResult!.places);

      print('📍 Ordered places with timeframes: ${_orderedPlaces.length}');
      for (int i = 0; i < _orderedPlaces.length; i++) {
        final pt = _orderedPlaces[i];
        print('   ${i + 1}. ${pt.place.name} - ${(pt.distance / 1000).toStringAsFixed(1)}km - ${_formatTime(pt.arrivalTime)}-${_formatTime(pt.departureTime)}');
      }

    } catch (e) {
      print('❌ Route calculation error: $e');
      // Create fallback with original order
      _orderedPlaces = _calculateTimeframes(widget.places);
    }

    setState(() => _isLoading = false);
  }

  List<PlaceWithTimeframe> _calculateTimeframes(List<Place> places) {
    final result = <PlaceWithTimeframe>[];
    var currentTime = DateTime.now();
    
    // Round to next 30-minute interval
    final minutes = currentTime.minute;
    if (minutes > 0) {
      final roundedMinutes = ((minutes / 30).ceil() * 30) % 60;
      currentTime = DateTime(
        currentTime.year,
        currentTime.month,
        currentTime.day,
        currentTime.hour + (roundedMinutes == 0 ? 1 : 0),
        roundedMinutes,
      );
    }
    
    Position currentPos = widget.currentLocation;
    
    for (int i = 0; i < places.length; i++) {
      final place = places[i];
      final distance = _calculateDistance(currentPos, place);
      final travelTime = _calculateTravelTime(distance, widget.preferences.transportMode);
      final visitDuration = _getVisitDuration(place);
      
      // Add travel time to get arrival
      final arrivalTime = currentTime.add(travelTime);
      final departureTime = arrivalTime.add(visitDuration);
      
      result.add(PlaceWithTimeframe(
        place: place,
        distance: distance,
        arrivalTime: arrivalTime,
        departureTime: departureTime,
        visitDuration: visitDuration,
        travelTime: travelTime,
      ));
      
      // Update for next iteration
      currentTime = departureTime;
      currentPos = Position(
        latitude: place.latitude!,
        longitude: place.longitude!,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
        altitudeAccuracy: 0,
        headingAccuracy: 0,
      );
    }
    
    return result;
  }
  
  double _calculateDistance(Position currentPos, Place place) {
    if (place.latitude == null || place.longitude == null) return 0.0;
    
    return Geolocator.distanceBetween(
      currentPos.latitude,
      currentPos.longitude,
      place.latitude!,
      place.longitude!,
    );
  }
  
  Duration _calculateTravelTime(double distance, TransportMode mode) {
    switch (mode) {
      case TransportMode.walking:
        return Duration(minutes: (distance / 1000 * 12).round()); // 5 km/h
      case TransportMode.cycling:
        return Duration(minutes: (distance / 1000 * 4).round()); // 15 km/h
      case TransportMode.driving:
        return Duration(minutes: (distance / 1000 * 2).round()); // 30 km/h
      case TransportMode.publicTransit:
        return Duration(minutes: (distance / 1000 * 3).round()); // 20 km/h
    }
  }
  
  Duration _getVisitDuration(Place place) {
    switch (place.type) {
      case 'museum':
      case 'art_gallery':
        return const Duration(hours: 2);
      case 'restaurant':
      case 'cafe':
        return const Duration(minutes: 45);
      case 'park':
      case 'tourist_attraction':
        return const Duration(minutes: 90);
      case 'shopping_mall':
        return const Duration(hours: 1);
      default:
        return const Duration(minutes: 60);
    }
  }
  
  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Optimizing your route...'),
                ],
              ),
            )
          : Column(
              children: [
                // Route Summary Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  color: Colors.blue[50],
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(_getTransportIcon(), color: Colors.blue[700]),
                          const SizedBox(width: 8),
                          Text(
                            _getTransportLabel(),
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_orderedPlaces.length} stops • ${_routeResult?.distanceText ?? ''} • ${_routeResult?.durationText ?? ''}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),

                // Places List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orderedPlaces.length,
                    itemBuilder: (context, index) {
                      final placeWithDistance = _orderedPlaces[index];
                      return _buildPlaceCard(index + 1, placeWithDistance);
                    },
                  ),
                ),

                // Bottom Action Button with safe area
                Container(
                  padding: EdgeInsets.fromLTRB(
                    16,
                    16,
                    16,
                    16 + MediaQuery.of(context).viewPadding.bottom,
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
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _openMapView,
                      icon: const Icon(Icons.map),
                      label: const Text('View on Map'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildPlaceCard(int number, PlaceWithTimeframe placeWithTimeframe) {
    final place = placeWithTimeframe.place;
    final distanceKm = (placeWithTimeframe.distance / 1000).toStringAsFixed(1);
    final arrivalTime = _formatTime(placeWithTimeframe.arrivalTime);
    final departureTime = _formatTime(placeWithTimeframe.departureTime);
    final visitDuration = placeWithTimeframe.visitDuration;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Number Circle
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  '$number',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
            
            const SizedBox(width: 16),
            
            // Place Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    place.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  const SizedBox(height: 4),
                  
                  if (place.address.isNotEmpty)
                    Text(
                      place.address,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  
                  const SizedBox(height: 8),
                  
                  // Time and Distance Info
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 16, color: Colors.green[600]),
                            const SizedBox(width: 4),
                            Text(
                              '$arrivalTime - $departureTime',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Colors.green[700],
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.blue[50],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '$distanceKm km',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(Icons.schedule, size: 14, color: Colors.grey[600]),
                            const SizedBox(width: 4),
                            Text(
                              '${visitDuration.inMinutes}min visit',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey[600],
                              ),
                            ),
                            const Spacer(),
                            if (place.rating > 0) ...[
                              Icon(Icons.star, size: 14, color: Colors.orange[600]),
                              const SizedBox(width: 2),
                              Text(
                                place.rating.toStringAsFixed(1),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            
            // Arrow Icon
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }

  IconData _getTransportIcon() {
    switch (widget.preferences.transportMode) {
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
    switch (widget.preferences.transportMode) {
      case TransportMode.walking:
        return 'Walking Route';
      case TransportMode.driving:
        return 'Driving Route';
      case TransportMode.publicTransit:
        return 'Transit Route';
      case TransportMode.cycling:
        return 'Cycling Route';
    }
  }

  void _openMapView() {
    if (_routeResult == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SimpleRouteMapScreen(
          currentLocation: widget.currentLocation,
          places: _routeResult!.places,
          title: widget.title,
          transportMode: widget.preferences.transportMode,
        ),
      ),
    );
  }
}

class PlaceWithTimeframe {
  final Place place;
  final double distance;
  final DateTime arrivalTime;
  final DateTime departureTime;
  final Duration visitDuration;
  final Duration travelTime;

  const PlaceWithTimeframe({
    required this.place,
    required this.distance,
    required this.arrivalTime,
    required this.departureTime,
    required this.visitDuration,
    required this.travelTime,
  });
}