import 'package:flutter/material.dart';
import '../models/place.dart';
import '../services/places_service.dart';
import '../screens/place_details_screen.dart';
import 'package:geolocator/geolocator.dart';

class CategoryPlacesScreen extends StatefulWidget {
  final String title;
  final String query;

  const CategoryPlacesScreen({
    Key? key,
    required this.title,
    required this.query,
  }) : super(key: key);

  @override
  State<CategoryPlacesScreen> createState() => _CategoryPlacesScreenState();
}

class _CategoryPlacesScreenState extends State<CategoryPlacesScreen> {
  final PlacesService _placesService = PlacesService();
  List<Place> _places = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  int _currentOffset = 0;
  final int _pageSize = 5; // Changed from 10 to 5
  bool _hasMore = true;
  Position? _currentPosition;

  @override
  void initState() {
    super.initState();
    _loadInitialPlaces();
  }

  Future<void> _loadInitialPlaces() async {
    setState(() => _isLoading = true);
    
    try {
      _currentPosition = await Geolocator.getCurrentPosition();
      
      final places = await _placesService.fetchPlacesPipeline(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        query: widget.query,
        topN: _pageSize,
        offset: 0,
      );
      
      setState(() {
        _places = places;
        _currentOffset = _pageSize;
        _hasMore = places.length == _pageSize;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading places: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMorePlaces() async {
    if (_isLoadingMore || !_hasMore || _currentPosition == null) return;
    
    setState(() => _isLoadingMore = true);
    
    try {
      final morePlaces = await _placesService.fetchPlacesPipeline(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        query: widget.query,
        topN: _pageSize,
        offset: _currentOffset,
      );
      
      setState(() {
        _places.addAll(morePlaces);
        _currentOffset += _pageSize;
        _hasMore = morePlaces.length == _pageSize && _places.length < 60;
        _isLoadingMore = false;
      });
    } catch (e) {
      print('Error loading more places: $e');
      setState(() => _isLoadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _places.isEmpty
              ? const Center(child: Text('No places found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _places.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _places.length) {
                      // Load More button
                      return Container(
                        margin: const EdgeInsets.only(top: 8, bottom: 100),
                        child: _isLoadingMore
                            ? const Center(
                                child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: CircularProgressIndicator(),
                                ),
                              )
                            : ElevatedButton(
                                onPressed: _loadMorePlaces,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.blue,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 2,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.refresh, size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Load More Places (${_places.length} shown)',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                      );
                    }
                    
                    final place = _places[index];
                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => PlaceDetailsScreen(place: place),
                          ),
                        );
                      },
                      child: Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Image
                            Container(
                              height: 200,
                              color: Colors.grey[300],
                              child: Image.network(
                                      place.photoUrl,
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                      errorBuilder: (_, __, ___) => const Center(
                                        child: Icon(Icons.place, size: 60),
                                      ),
                                    ),
                            ),
                            // Details
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    place.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.star, size: 18, color: Colors.amber),
                                      const SizedBox(width: 4),
                                      Text(
                                        place.rating.toStringAsFixed(1),
                                        style: const TextStyle(fontSize: 16),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Text(
                                          place.type,
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (place.address.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Row(
                                      children: [
                                        Icon(Icons.location_on, size: 16, color: Colors.grey[600]),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            place.address,
                                            style: TextStyle(
                                              fontSize: 14,
                                              color: Colors.grey[600],
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
