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
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        width: double.infinity,
                        height: 120,
                        color: Colors.grey[200],
                        child: const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return _buildPlaceholder();
                    },
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
                      size: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Content - Fixed height to prevent overflow
        Container(
          height: 80,
          padding: const EdgeInsets.all(8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                place.name,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.amber, size: 10),
                  const SizedBox(width: 2),
                  Text(
                    place.rating.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 9),
                  ),
                ],
              ),
            ],
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
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              
              // Enhanced Rating, Distance, and Context Info
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  // Rating
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
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Distance
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
                  // Estimated Time
                  _buildEstimatedTime(),
                  // Price Range (if available)
                  _buildPriceRange(),
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
                        fontSize: 14,
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
                    fontSize: 15,
                    height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              
              const SizedBox(height: 8),
              
              // Type, Local Tip, and AI Context
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  const SizedBox(height: 6),
                  // AI-Enhanced Context
                  _buildAIContext(),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Enhanced Action Buttons
              Column(
                children: [
                  // Primary Actions
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onTap,
                          icon: const Icon(Icons.info_outline, size: 16),
                          label: const Text('Details', style: TextStyle(fontSize: 16)),
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
                          label: const Text('Add Trip', style: TextStyle(fontSize: 16)),
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
                  const SizedBox(height: 8),
                  // Quick Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: _buildQuickAction(
                          context,
                          Icons.thumb_down_outlined,
                          'Not Interested',
                          Colors.red[100]!,
                          Colors.red[700]!,
                          () => _handleNotInterested(context),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _buildQuickAction(
                          context,
                          Icons.bookmark_outline,
                          'Save Later',
                          Colors.blue[100]!,
                          Colors.blue[700]!,
                          () => _handleSaveForLater(context),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _buildQuickAction(
                          context,
                          Icons.check_circle_outline,
                          'Been Here',
                          Colors.green[100]!,
                          Colors.green[700]!,
                          () => _handleBeenHere(context),
                        ),
                      ),
                    ],
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
}