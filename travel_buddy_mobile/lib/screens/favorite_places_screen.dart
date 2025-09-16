import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/places_provider.dart';
import '../models/place.dart';
import 'place_details_screen.dart';

class FavoritePlacesScreen extends StatefulWidget {
  const FavoritePlacesScreen({super.key});

  @override
  State<FavoritePlacesScreen> createState() => _FavoritePlacesScreenState();
}

class _FavoritePlacesScreenState extends State<FavoritePlacesScreen> {
  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    try {
      final provider = Provider.of<PlacesProvider>(context, listen: false);
      await provider.fetchFavoritePlaces();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading favorites: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Favorite Places'),
      ),
      body: Consumer<PlacesProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Error: ${provider.error}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadFavorites,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (provider.favoritePlaces.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.favorite_border,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No favorite places yet',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap the heart icon on any place to add it to your favorites',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadFavorites,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.favoritePlaces.length,
              itemBuilder: (context, index) {
                final place = provider.favoritePlaces[index];
                return PlaceCard(place: place);
              },
            ),
          );
        },
      ),
    );
  }
}

class PlaceCard extends StatelessWidget {
  final Place place;

  const PlaceCard({
    super.key,
    required this.place,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PlaceDetailsScreen(placeId: place.id),
            ),
          );
        },
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (place.imageUrl.isNotEmpty)
              SizedBox(
                width: 120,
                height: 120,
                child: Image.network(
                  place.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[300],
                      child: const Icon(
                        Icons.image_not_supported,
                        size: 32,
                        color: Colors.grey,
                      ),
                    );
                  },
                ),
              ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      place.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      place.address,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (place.rating > 0)
                      Row(
                        children: [
                          const Icon(Icons.star, size: 16, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text(
                            place.rating.toStringAsFixed(1),
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.favorite, color: Colors.red),
              onPressed: () async {
                try {
                  final provider = Provider.of<PlacesProvider>(
                    context,
                    listen: false,
                  );
                  await provider.toggleFavorite(place.id);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error updating favorite: $e')),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}