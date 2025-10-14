import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/place_card.dart';
import 'place_details_screen.dart';
import '../models/place.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  Future<void> _createTestFavorites(BuildContext context) async {
    try {
      final appProvider = context.read<AppProvider>();
      
      final testPlaces = [
        Place(
          id: 'test_place_1',
          name: 'Central Park',
          address: '123 Park Avenue',
          latitude: 40.7829,
          longitude: -73.9654,
          rating: 4.5,
          type: 'park',
          photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
          description: 'Beautiful urban park perfect for relaxation',
          localTip: 'Best visited in the morning for peaceful walks',
          handyPhrase: 'Where is the nearest entrance?',
        ),
        Place(
          id: 'test_place_2',
          name: 'Art Museum',
          address: '456 Culture Street',
          latitude: 40.7614,
          longitude: -73.9776,
          rating: 4.8,
          type: 'museum',
          photoUrl: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400',
          description: 'World-class art collection with rotating exhibitions',
          localTip: 'Free admission on Friday evenings',
          handyPhrase: 'What time do you close?',
        ),
        Place(
          id: 'test_place_3',
          name: 'Local Coffee Shop',
          address: '789 Main Street',
          latitude: 40.7505,
          longitude: -73.9934,
          rating: 4.3,
          type: 'cafe',
          photoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
          description: 'Cozy neighborhood cafe with excellent coffee',
          localTip: 'Try their signature latte',
          handyPhrase: 'Can I have a table for one?',
        ),
      ];
      
      for (final place in testPlaces) {
        await appProvider.toggleFavorite(place.id);
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Test favorites created!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating test favorites: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Favorites'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          final favorites = appProvider.favoritePlaces;

          if (favorites.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.favorite_border, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  const Text(
                    'No Favorites Yet',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start exploring places and add them to your favorites!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 24),
                  if (kDebugMode)
                    ElevatedButton(
                      onPressed: () => _createTestFavorites(context),
                      child: const Text('Add Test Favorites (Debug)'),
                    ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: favorites.length,
            itemBuilder: (context, index) {
              final place = favorites[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: PlaceCard(
                  place: place,
                  isFavorite: true, // Always true in favorites screen
                  onFavoriteToggle: () {
                    appProvider.toggleFavorite(place.id);
                  },
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => PlaceDetailsScreen(place: place),
                      ),
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}