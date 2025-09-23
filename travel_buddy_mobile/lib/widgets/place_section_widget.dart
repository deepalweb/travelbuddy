import 'package:flutter/material.dart';
import '../models/place_section.dart';
import '../widgets/place_card.dart';
import '../screens/section_places_screen.dart';

class PlaceSectionWidget extends StatelessWidget {
  final PlaceSection section;
  final Function(String) onFavoriteToggle;

  const PlaceSectionWidget({
    super.key,
    required this.section,
    required this.onFavoriteToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(section.emoji, style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        section.subtitle,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                if (section.places.length > 3)
                  TextButton(
                    onPressed: () => _showMorePlaces(context),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Show More'),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 12),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          
          // Horizontal Places List
          SizedBox(
            height: 280,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: section.places.length,
              itemBuilder: (context, index) {
                final place = section.places[index];
                return Container(
                  width: 200,
                  margin: const EdgeInsets.only(right: 12),
                  child: PlaceCard(
                    place: place,
                    isFavorite: false, // Will be updated by parent
                    onFavoriteToggle: () => onFavoriteToggle(place.id),
                    onTap: () {
                      // Navigate to place details
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showMorePlaces(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SectionPlacesScreen(
          section: section,
        ),
      ),
    );
  }
}