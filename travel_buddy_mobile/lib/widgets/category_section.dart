import 'package:flutter/material.dart';
import '../models/place.dart';
import '../screens/category_places_screen.dart';
import '../screens/place_details_screen.dart';

class CategorySection extends StatelessWidget {
  final String title;
  final String query;
  final List<Place> places;
  final bool isLoading;

  const CategorySection({
    Key? key,
    required this.title,
    required this.query,
    required this.places,
    this.isLoading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CategoryPlacesScreen(
                        title: title,
                        query: query,
                      ),
                    ),
                  );
                },
                child: const Text('See More'),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 240,
          child: isLoading
              ? const Center(child: CircularProgressIndicator())
              : places.isEmpty
                  ? const Center(child: Text('No places found'))
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      itemCount: places.length,
                      itemBuilder: (context, index) {
                        final place = places[index];
                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => PlaceDetailsScreen(place: place),
                              ),
                            );
                          },
                          child: Container(
                            width: 160,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            child: Card(
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Image
                                  Container(
                                    height: 120,
                                    color: Colors.grey[300],
                                    child: Image.network(
                                            place.photoUrl!,
                                            fit: BoxFit.cover,
                                            width: double.infinity,
                                            errorBuilder: (_, __, ___) => const Icon(Icons.place, size: 50),
                                          ),
                                  ),
                                  // Details
                                  Padding(
                                    padding: const EdgeInsets.all(8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          place.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.star, size: 14, color: Colors.amber),
                                            const SizedBox(width: 4),
                                            Text(
                                              place.rating.toStringAsFixed(1),
                                              style: const TextStyle(fontSize: 12),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          place.type,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
