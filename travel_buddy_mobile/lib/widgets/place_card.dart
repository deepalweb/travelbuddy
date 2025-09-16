import 'package:flutter/material.dart';
import '../models/place.dart';
import '../constants/app_constants.dart';
import 'add_to_trip_dialog.dart';

class PlaceCard extends StatelessWidget {
  final Place place;
  final bool isFavorite;
  final VoidCallback onFavoriteToggle;
  final VoidCallback onTap;
  final bool compact;

  const PlaceCard({
    super.key,
    required this.place,
    required this.isFavorite,
    required this.onFavoriteToggle,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: compact ? _buildCompactCard() : _buildFullCard(),
      ),
    );
  }

  Widget _buildCompactCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image
        Container(
          height: 120,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          ),
          child: Stack(
            children: [
              if (place.photoUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    place.photoUrl,
                    width: double.infinity,
                    height: 120,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                  ),
                )
              else
                _buildPlaceholder(),
              
              // Favorite Button
              Positioned(
                top: 8,
                right: 8,
                child: GestureDetector(
                  onTap: onFavoriteToggle,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.red : Colors.grey,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  place.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 14),
                    const SizedBox(width: 2),
                    Text(
                      place.rating.toStringAsFixed(1),
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  place.type,
                  style: TextStyle(
                    color: Color(AppConstants.colors['primary']!),
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFullCard() {
    return Builder(
      builder: (context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Image
        Container(
          height: 180,
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.grey[300],
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
          ),
          child: Stack(
            children: [
              if (place.photoUrl.isNotEmpty)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  child: Image.network(
                    place.photoUrl,
                    width: double.infinity,
                    height: 180,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
                  ),
                )
              else
                _buildPlaceholder(),
              
              // Favorite Button
              Positioned(
                top: 12,
                right: 12,
                child: GestureDetector(
                  onTap: onFavoriteToggle,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite ? Colors.red : Colors.grey,
                      size: 20,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Content
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
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              
              // Rating, Distance, and Quick Info
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.amber[200]!),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        const SizedBox(width: 2),
                        Text(
                          place.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (place.description.contains('km away'))
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.directions_walk, size: 12, color: Colors.blue[600]),
                          const SizedBox(width: 2),
                          Text(
                            place.description.split('•').last.trim(),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Address
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    size: 14,
                    color: Color(AppConstants.colors['textSecondary']!),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      place.address,
                      style: TextStyle(
                        color: Color(AppConstants.colors['textSecondary']!),
                        fontSize: 12,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Description with useful info
              if (place.description.isNotEmpty)
                Text(
                  place.description.split('•').first.trim(),
                  style: TextStyle(
                    color: Color(AppConstants.colors['textSecondary']!),
                    fontSize: 13,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              
              const SizedBox(height: 8),
              
              // Type and Local Tip
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Color(AppConstants.colors['primary']!).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      place.type,
                      style: TextStyle(
                        color: Color(AppConstants.colors['primary']!),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (place.localTip.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.lightbulb_outline, size: 12, color: Colors.green[600]),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                place.localTip,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: Colors.green[700],
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ]
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Action Buttons with icons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onTap,
                      icon: const Icon(Icons.info_outline, size: 16),
                      label: const Text('Details'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (dialogContext) => AddToTripDialog(place: place),
                        );
                      },
                      icon: const Icon(Icons.add_location, size: 16),
                      label: const Text('Add Trip'),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    ));
  }

  Widget _buildPlaceholder() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: Colors.grey[300],
      child: const Icon(
        Icons.image,
        size: 40,
        color: Colors.grey,
      ),
    );
  }
}