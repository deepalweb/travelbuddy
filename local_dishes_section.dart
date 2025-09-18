// Local Dishes Section - Minimal Implementation
import 'package:flutter/material.dart';

class LocalDishesSection extends StatefulWidget {
  final List<dynamic> dishes;
  final bool isLoading;
  final VoidCallback onRetry;

  const LocalDishesSection({
    super.key,
    required this.dishes,
    required this.isLoading,
    required this.onRetry,
  });

  @override
  State<LocalDishesSection> createState() => _LocalDishesSectionState();
}

class _LocalDishesSectionState extends State<LocalDishesSection> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    if (widget.isLoading) {
      return _buildLoadingState();
    }

    if (widget.dishes.isEmpty) {
      return _buildEmptyState();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(),
        const SizedBox(height: 8),
        _buildFilters(),
        const SizedBox(height: 12),
        _buildDishCards(),
      ],
    );
  }

  Widget _buildLoadingState() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text('Local Dishes 🍴', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            const Row(
              children: [
                CircularProgressIndicator(strokeWidth: 2),
                SizedBox(width: 12),
                Text('Discovering local flavors...'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(Icons.restaurant, color: Colors.grey[600], size: 32),
            const SizedBox(height: 8),
            Text('No local dishes found', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: widget.onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Text('Local Dishes 🍴', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text('${widget.dishes.length} dishes', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildFilters() {
    final filters = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free'];
    
    return SizedBox(
      height: 32,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = _selectedFilter == filter;
          
          return Container(
            margin: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(filter, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : Colors.grey[700])),
              selected: isSelected,
              onSelected: (selected) => setState(() => _selectedFilter = filter),
              selectedColor: Colors.orange,
              backgroundColor: Colors.grey[200],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDishCards() {
    final filteredDishes = _getFilteredDishes();
    
    return SizedBox(
      height: 220,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filteredDishes.length,
        itemBuilder: (context, index) {
          final dish = filteredDishes[index];
          return Container(
            width: 180,
            margin: const EdgeInsets.only(right: 12),
            child: Card(
              elevation: 3,
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildDishHeader(dish),
                  Expanded(child: _buildDishContent(dish)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDishHeader(dynamic dish) {
    return Container(
      width: double.infinity,
      height: 80,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange[300]!, Colors.orange[500]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Center(child: Icon(Icons.restaurant_menu, size: 40, color: Colors.white.withOpacity(0.8))),
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(dish.cuisine, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.orange)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDishContent(dynamic dish) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(dish.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 2, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          _buildRating(dish.rating),
          const SizedBox(height: 4),
          _buildPriceRow(dish),
          const SizedBox(height: 4),
          _buildRestaurantRow(dish),
          const SizedBox(height: 6),
          _buildDietaryTags(dish.dietaryTags),
        ],
      ),
    );
  }

  Widget _buildRating(double rating) {
    return Row(
      children: [
        ...List.generate(5, (i) => Icon(i < rating.floor() ? Icons.star : Icons.star_border, size: 12, color: Colors.amber)),
        const SizedBox(width: 4),
        Text(rating.toStringAsFixed(1), style: const TextStyle(fontSize: 10)),
      ],
    );
  }

  Widget _buildPriceRow(dynamic dish) {
    return Row(
      children: [
        Icon(Icons.attach_money, size: 12, color: Colors.green[700]),
        Text(dish.averagePrice, style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.w600, fontSize: 11)),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          decoration: BoxDecoration(color: _getPriceColor(dish.priceRange), borderRadius: BorderRadius.circular(4)),
          child: Text(dish.priceRange.toUpperCase(), style: const TextStyle(fontSize: 7, color: Colors.white, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildRestaurantRow(dynamic dish) {
    return Row(
      children: [
        Icon(Icons.store, size: 10, color: Colors.grey[600]),
        const SizedBox(width: 2),
        Expanded(
          child: Text(dish.restaurantName, style: TextStyle(fontSize: 9, color: Colors.grey[600]), maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }

  Widget _buildDietaryTags(List<dynamic> tags) {
    if (tags.isEmpty) return const SizedBox();
    
    return Wrap(
      spacing: 2,
      children: tags.take(2).map<Widget>((tag) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
        decoration: BoxDecoration(color: _getTagColor(tag), borderRadius: BorderRadius.circular(6)),
        child: Text(_getTagIcon(tag), style: const TextStyle(fontSize: 8, color: Colors.white)),
      )).toList(),
    );
  }

  List<dynamic> _getFilteredDishes() {
    if (_selectedFilter == 'All') return widget.dishes;
    
    return widget.dishes.where((dish) {
      final tags = List<String>.from(dish.dietaryTags ?? []);
      switch (_selectedFilter) {
        case 'Vegetarian': return tags.any((tag) => tag.toLowerCase().contains('vegetarian'));
        case 'Vegan': return tags.any((tag) => tag.toLowerCase().contains('vegan'));
        case 'Gluten-Free': return tags.any((tag) => tag.toLowerCase().contains('gluten'));
        default: return true;
      }
    }).toList();
  }

  Color _getPriceColor(String priceRange) {
    switch (priceRange.toLowerCase()) {
      case 'budget': return Colors.green;
      case 'mid-range': return Colors.orange;
      case 'fine-dining': return Colors.red;
      default: return Colors.blue;
    }
  }

  Color _getTagColor(String tag) {
    if (tag.toLowerCase().contains('vegetarian')) return Colors.green;
    if (tag.toLowerCase().contains('vegan')) return Colors.lightGreen;
    if (tag.toLowerCase().contains('gluten')) return Colors.blue;
    if (tag.toLowerCase().contains('halal')) return Colors.purple;
    return Colors.grey;
  }

  String _getTagIcon(String tag) {
    if (tag.toLowerCase().contains('vegetarian')) return 'VEG';
    if (tag.toLowerCase().contains('vegan')) return 'VGN';
    if (tag.toLowerCase().contains('gluten')) return 'GF';
    if (tag.toLowerCase().contains('halal')) return 'HL';
    return 'TAG';
  }
}