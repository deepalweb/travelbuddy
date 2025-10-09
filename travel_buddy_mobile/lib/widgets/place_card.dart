import 'package:flutter/material.dart';
import '../models/place.dart';
import '../constants/app_constants.dart';
import '../services/usage_tracking_service.dart';
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
        child: compact ? _buildCompactCard(context) : _buildFullCard(context),
      ),
    );
  }

  Widget _buildCompactCard(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 3,
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
              image: place.photoUrl.isNotEmpty
                  ? DecorationImage(
                      image: NetworkImage(place.photoUrl),
                      fit: BoxFit.cover,
                      onError: (_, __) {},
                    )
                  : null,
            ),
            child: Stack(
              children: [
                if (place.photoUrl.isEmpty)
                  Center(
                    child: Icon(Icons.place, size: 32, color: Colors.grey[600]),
                  ),
                // Action Buttons
                Positioned(
                  top: 8,
                  right: 8,
                  child: Column(
                    children: [
                      GestureDetector(
                        onTap: onFavoriteToggle,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            isFavorite ? Icons.favorite : Icons.favorite_border,
                            color: isFavorite ? Colors.red : Colors.grey,
                            size: 14,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => _showAddToTripDialog(context),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: Colors.blue.withOpacity(0.9),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        Expanded(
          flex: 2,
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
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.star, size: 14, color: Colors.amber),
                    const SizedBox(width: 4),
                    Text(
                      place.rating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const Spacer(),
                    if (place.description.contains('km away'))
                      Text(
                        place.description.split('•').last.trim(),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  place.type,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
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

  Widget _buildFullCard(BuildContext context) {
    return Column(
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
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        width: double.infinity,
                        height: 180,
                        color: Colors.grey[200],
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      print('Image load error: $error for URL: ${place.photoUrl}');
                      return _buildPlaceholder();
                    },
                  ),
                )
              else
                _buildPlaceholder(),
              
              // Action Buttons
              Positioned(
                top: 12,
                right: 12,
                child: Column(
                  children: [
                    GestureDetector(
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
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () => _showAddToTripDialog(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.9),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.add,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                    ),
                  ],
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
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              
              // Rating and Distance - Compact
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    place.rating.toStringAsFixed(1),
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  if (place.description.contains('km away')) ...[
                    const SizedBox(width: 12),
                    Icon(Icons.directions_walk, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      place.description.split('•').last.trim(),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ],
              ),
              
              const SizedBox(height: 6),
              
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
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              
              // Description - Compact
              if (place.description.isNotEmpty)
                Text(
                  place.description.split('•').first.trim(),
                  style: TextStyle(
                    color: Color(AppConstants.colors['textSecondary']!),
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              
              const SizedBox(height: 8),
              
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showAddToTripDialog(context),
                      icon: const Icon(Icons.add, size: 16),
                      label: const Text('Add Trip'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.blue,
                        side: const BorderSide(color: Colors.blue),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                      ),
                      child: const Text('Details'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
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
  
  Widget _buildQuickAction(
    BuildContext context,
    IconData icon,
    String label,
    Color backgroundColor,
    Color textColor,
    VoidCallback onPressed,
  ) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: textColor,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _handleNotInterested(BuildContext context) {
    // Track user feedback
    UsageTrackingService().trackCategorySelected('not_interested_${place.type}');
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('We\'ll show fewer ${place.type} places'),
        backgroundColor: Colors.orange,
        duration: const Duration(seconds: 2),
      ),
    );
  }
  
  void _handleSaveForLater(BuildContext context) {
    // Track save for later
    UsageTrackingService().trackPlaceFavorited(place);
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Saved for later!'),
        backgroundColor: Colors.blue,
        duration: Duration(seconds: 2),
      ),
    );
  }
  
  void _handleBeenHere(BuildContext context) {
    // Track been here
    UsageTrackingService().trackCategorySelected('been_here_${place.type}');
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Thanks for the feedback on ${place.name}!'),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }
  
  Widget _buildEstimatedTime() {
    String timeEstimate = _getEstimatedTime(place.type);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.purple[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.access_time, size: 12, color: Colors.purple[600]),
          const SizedBox(width: 2),
          Text(
            timeEstimate,
            style: TextStyle(
              fontSize: 11,
              color: Colors.purple[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildPriceRange() {
    String priceRange = _getPriceRange(place.type);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.attach_money, size: 12, color: Colors.green[600]),
          const SizedBox(width: 2),
          Text(
            priceRange,
            style: TextStyle(
              fontSize: 11,
              color: Colors.green[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  String _getEstimatedTime(String placeType) {
    final type = placeType.toLowerCase();
    if (type.contains('museum') || type.contains('gallery')) return '2-3h';
    if (type.contains('restaurant') || type.contains('cafe')) return '1-2h';
    if (type.contains('park') || type.contains('nature')) return '1-3h';
    if (type.contains('bar') || type.contains('nightlife')) return '2-4h';
    if (type.contains('shop') || type.contains('mall')) return '1-2h';
    return '1-2h';
  }
  
  String _getPriceRange(String placeType) {
    final type = placeType.toLowerCase();
    if (type.contains('museum') || type.contains('park')) return 'Free-\$';
    if (type.contains('restaurant')) return '\$\$-\$\$\$';
    if (type.contains('cafe')) return '\$-\$\$';
    if (type.contains('bar') || type.contains('nightlife')) return '\$\$-\$\$\$';
    if (type.contains('shop') || type.contains('mall')) return '\$-\$\$\$\$';
    return '\$-\$\$';
  }
  
  Widget _buildAIContext() {
    final context = _getAIEnhancedContext();
    if (context.isEmpty) return const SizedBox.shrink();
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange[200]!),
      ),
      child: Row(
        children: [
          Icon(Icons.auto_awesome, size: 12, color: Colors.orange[600]),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              context,
              style: TextStyle(
                fontSize: 10,
                color: Colors.orange[700],
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
  
  String _getAIEnhancedContext() {
    final hour = DateTime.now().hour;
    final isWeekend = DateTime.now().weekday >= 6;
    final type = place.type.toLowerCase();
    
    // Weather-based context
    if (type.contains('park') || type.contains('outdoor')) {
      return 'Perfect for sunny weather ☀️';
    }
    
    // Time-based context
    if (type.contains('restaurant')) {
      if (hour >= 18) return 'Great for dinner 🍽️';
      if (hour >= 12) return 'Perfect for lunch 🥗';
      return 'Good for breakfast ☕';
    }
    
    if (type.contains('bar') || type.contains('nightlife')) {
      if (isWeekend) return 'Popular weekend spot 🎉';
      return 'Great for evening drinks 🍸';
    }
    
    if (type.contains('museum') || type.contains('gallery')) {
      if (hour < 12) return 'Less crowded in morning 🌅';
      return 'Rich cultural experience 🎨';
    }
    
    if (type.contains('cafe')) {
      if (hour < 10) return 'Perfect for morning coffee ☕';
      return 'Great workspace atmosphere 💻';
    }
    
    // Rating-based context
    if (place.rating >= 4.5) return 'Highly rated by visitors ⭐';
    if (place.rating >= 4.0) return 'Popular local spot 👍';
    
    return '';
  }
  
  void _showAddToTripDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AddToTripDialog(place: place),
    );
  }
  

}