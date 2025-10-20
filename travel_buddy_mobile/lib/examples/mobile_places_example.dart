import 'package:flutter/material.dart';
import '../services/mobile_places_service.dart';
import '../models/place.dart';

class MobilePlacesExample extends StatefulWidget {
  const MobilePlacesExample({super.key});

  @override
  State<MobilePlacesExample> createState() => _MobilePlacesExampleState();
}

class _MobilePlacesExampleState extends State<MobilePlacesExample> {
  final MobilePlacesService _placesService = MobilePlacesService();
  Map<String, List<Place>> _categorizedPlaces = {};
  bool _isLoading = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mobile Places Discovery'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _discoverPlaces,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('🔍 Step 1: Detecting location...'),
            SizedBox(height: 8),
            Text('🌐 Step 2: Sending to AI backend...'),
            SizedBox(height: 8),
            Text('🤖 Step 3: AI generating places...'),
            SizedBox(height: 8),
            Text('📱 Step 4: Organizing by category...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _discoverPlaces,
              child: const Text('Try Again'),
            ),
          ],
        ),
      );
    }

    if (_categorizedPlaces.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.explore, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Discover amazing places around you!'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _discoverPlaces,
              icon: const Icon(Icons.location_on),
              label: const Text('Start Discovery'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: _categorizedPlaces.keys.length,
      itemBuilder: (context, index) {
        final category = _categorizedPlaces.keys.elementAt(index);
        final places = _categorizedPlaces[category]!;
        
        return _buildCategorySection(category, places);
      },
    );
  }

  Widget _buildCategorySection(String category, List<Place> places) {
    return Card(
      margin: const EdgeInsets.all(8),
      child: ExpansionTile(
        title: Text(
          '${_getCategoryTitle(category)} (${places.length})',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        leading: Icon(_getCategoryIcon(category)),
        children: places.map((place) => ListTile(
          title: Text(place.name),
          subtitle: Text(place.address),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.star, color: Colors.amber, size: 16),
              Text(place.rating.toStringAsFixed(1)),
            ],
          ),
          onTap: () => _showPlaceDetails(place),
        )).toList(),
      ),
    );
  }

  String _getCategoryTitle(String category) {
    switch (category) {
      case 'restaurants': return 'Restaurants';
      case 'attractions': return 'Attractions';
      case 'shopping': return 'Shopping';
      case 'entertainment': return 'Entertainment';
      case 'nature': return 'Nature & Parks';
      case 'culture': return 'Culture';
      default: return category.toUpperCase();
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'restaurants': return Icons.restaurant;
      case 'attractions': return Icons.attractions;
      case 'shopping': return Icons.shopping_bag;
      case 'entertainment': return Icons.movie;
      case 'nature': return Icons.park;
      case 'culture': return Icons.museum;
      default: return Icons.place;
    }
  }

  void _showPlaceDetails(Place place) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(place.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Address: ${place.address}'),
            const SizedBox(height: 8),
            Text('Rating: ${place.rating}/5.0'),
            const SizedBox(height: 8),
            Text('Type: ${place.type}'),
            const SizedBox(height: 8),
            Text('Description: ${place.description}'),
            const SizedBox(height: 8),
            Text('Local Tip: ${place.localTip}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _discoverPlaces() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final places = await _placesService.discoverPlaces(
        userType: 'Explorer',
        vibe: 'Cultural',
        interests: ['food', 'culture', 'nature'],
      );

      setState(() {
        _categorizedPlaces = places;
        _isLoading = false;
      });

      if (places.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Discovered ${places.values.fold(0, (sum, list) => sum + list.length)} places!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }
}