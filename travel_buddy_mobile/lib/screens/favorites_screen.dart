import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/place_card.dart';
import 'place_details_screen.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

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