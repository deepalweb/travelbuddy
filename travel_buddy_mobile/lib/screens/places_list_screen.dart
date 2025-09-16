import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/places_provider.dart';
import '../models/place.dart';
import 'place_details_screen.dart';

class PlaceSearchDelegate extends SearchDelegate<Place?> {
  final PlacesProvider _provider;
  List<Place> _recentResults = [];

  PlaceSearchDelegate(this._provider);

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () {
            query = '';
            showSuggestions(context);
          },
        ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: AnimatedIcon(
        icon: AnimatedIcons.menu_arrow,
        progress: transitionAnimation,
      ),
      onPressed: () {
        close(context, null);
      },
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return FutureBuilder<List<Place>>(
      future: _provider.searchPlaces(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Text(
              'Error: ${snapshot.error}',
              style: const TextStyle(color: Colors.red),
            ),
          );
        }

        final places = snapshot.data ?? [];
        if (places.isEmpty) {
          return const Center(
            child: Text('No places found'),
          );
        }

        _recentResults = places;

        return ListView.builder(
          itemCount: places.length,
          itemBuilder: (context, index) {
            final place = places[index];
            return ListTile(
              leading: place.imageUrl.isNotEmpty
                  ? CircleAvatar(
                      backgroundImage: NetworkImage(place.imageUrl),
                      onBackgroundImageError: (_, __) =>
                          const Icon(Icons.image_not_supported),
                    )
                  : const CircleAvatar(child: Icon(Icons.place)),
              title: Text(place.name),
              subtitle: Text(place.address),
              trailing: place.rating > 0
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(place.rating.toStringAsFixed(1)),
                      ],
                    )
                  : null,
              onTap: () {
                close(context, place);
              },
            );
          },
        );
      },
    );
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      if (_recentResults.isEmpty) {
        return const Center(
          child: Text('Search for places by name, category, or description'),
        );
      }

      return ListView.builder(
        itemCount: _recentResults.length,
        itemBuilder: (context, index) {
          final place = _recentResults[index];
          return ListTile(
            leading: place.imageUrl.isNotEmpty
                ? CircleAvatar(
                    backgroundImage: NetworkImage(place.imageUrl),
                    onBackgroundImageError: (_, __) =>
                        const Icon(Icons.image_not_supported),
                  )
                : const CircleAvatar(child: Icon(Icons.place)),
            title: Text(place.name),
            subtitle: Text(place.address),
            onTap: () {
              close(context, place);
            },
          );
        },
      );
    }

    return FutureBuilder<List<Place>>(
      future: _provider.searchPlaces(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Text(
              'Error: ${snapshot.error}',
              style: const TextStyle(color: Colors.red),
            ),
          );
        }

        final places = snapshot.data ?? [];
        if (places.isEmpty) {
          return const Center(
            child: Text('No suggestions found'),
          );
        }

        return ListView.builder(
          itemCount: places.length,
          itemBuilder: (context, index) {
            final place = places[index];
            final nameParts = place.name.toLowerCase().split(query.toLowerCase());
            if (nameParts.length <= 1) {
              return ListTile(
                leading: place.imageUrl.isNotEmpty
                    ? CircleAvatar(
                        backgroundImage: NetworkImage(place.imageUrl),
                        onBackgroundImageError: (_, __) =>
                            const Icon(Icons.image_not_supported),
                      )
                    : const CircleAvatar(child: Icon(Icons.place)),
                title: Text(place.name),
                subtitle: Text(place.address),
                onTap: () {
                  close(context, place);
                },
              );
            }

            return ListTile(
              leading: place.imageUrl.isNotEmpty
                  ? CircleAvatar(
                      backgroundImage: NetworkImage(place.imageUrl),
                      onBackgroundImageError: (_, __) =>
                          const Icon(Icons.image_not_supported),
                    )
                  : const CircleAvatar(child: Icon(Icons.place)),
              title: RichText(
                text: TextSpan(
                  style: DefaultTextStyle.of(context).style,
                  children: _highlightOccurrences(place.name, query),
                ),
              ),
              subtitle: Text(place.address),
              onTap: () {
                close(context, place);
              },
            );
          },
        );
      },
    );
  }

  List<TextSpan> _highlightOccurrences(String text, String query) {
    final matches = query.trim().toLowerCase().split(' ');
    final spans = <TextSpan>[];
    var start = 0;

    while (start < text.length) {
      var matchStart = -1;
      var matchLength = 0;

      for (final match in matches) {
        if (match.isEmpty) continue;
        final index = text.toLowerCase().indexOf(match, start);
        if (index != -1 && (matchStart == -1 || index < matchStart)) {
          matchStart = index;
          matchLength = match.length;
        }
      }

      if (matchStart == -1) {
        spans.add(TextSpan(text: text.substring(start)));
        break;
      }

      if (matchStart > start) {
        spans.add(TextSpan(text: text.substring(start, matchStart)));
      }

      spans.add(TextSpan(
        text: text.substring(matchStart, matchStart + matchLength),
        style: const TextStyle(
          fontWeight: FontWeight.bold,
          backgroundColor: Colors.yellow,
        ),
      ));

      start = matchStart + matchLength;
    }

    return spans;
  }
}

class PlacesListScreen extends StatefulWidget {
  const PlacesListScreen({super.key});

  @override
  State<PlacesListScreen> createState() => _PlacesListScreenState();
}

class _PlacesListScreenState extends State<PlacesListScreen> {
  @override
  void initState() {
    super.initState();
    _loadNearbyPlaces();
  }

  Future<void> _loadNearbyPlaces() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      
      if (!mounted) return;
      
      final provider = Provider.of<PlacesProvider>(context, listen: false);
      await provider.fetchNearbyPlaces(
        latitude: position.latitude,
        longitude: position.longitude,
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading places: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Places'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () async {
              final searchResults = await showSearch(
                context: context,
                delegate: PlaceSearchDelegate(
                  Provider.of<PlacesProvider>(context, listen: false),
                ),
              );
              if (searchResults != null && context.mounted) {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PlaceDetailsScreen(
                      placeId: searchResults.id,
                    ),
                  ),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.favorite),
            onPressed: () {
              Navigator.pushNamed(context, '/favorites');
            },
          ),
        ],
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
                    onPressed: _loadNearbyPlaces,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadNearbyPlaces,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.nearbyPlaces.length,
              itemBuilder: (context, index) {
                final place = provider.nearbyPlaces[index];
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (place.imageUrl.isNotEmpty)
              Image.network(
                place.imageUrl,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    height: 200,
                    color: Colors.grey[300],
                    child: const Icon(
                      Icons.image_not_supported,
                      size: 48,
                      color: Colors.grey,
                    ),
                  );
                },
              ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          place.name,
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ),
                      _buildFavoriteButton(context),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (place.rating > 0) ...[
                    Row(
                      children: [
                        const Icon(Icons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (place.categories.isNotEmpty) ...[
                    Wrap(
                      spacing: 8,
                      children: place.categories.map((category) {
                        return Chip(
                          label: Text(category),
                          labelStyle: const TextStyle(fontSize: 12),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          visualDensity: VisualDensity.compact,
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Text(
                    place.address,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFavoriteButton(BuildContext context) {
    return Consumer<PlacesProvider>(
      builder: (context, provider, _) {
        return IconButton(
          icon: Icon(
            place.isFavorite ? Icons.favorite : Icons.favorite_border,
            color: place.isFavorite ? Colors.red : null,
          ),
          onPressed: () async {
            try {
              await provider.toggleFavorite(place.id);
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Error updating favorite: $e')),
                );
              }
            }
          },
        );
      },
    );
  }
}
