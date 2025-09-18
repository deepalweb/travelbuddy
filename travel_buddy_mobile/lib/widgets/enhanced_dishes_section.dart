// Enhanced Local Dishes Section Widget

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/enhanced_dishes_provider.dart';
import '../models/dish_models.dart';

class EnhancedDishesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<EnhancedDishesProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return _buildLoadingState(provider);
        }

        if (provider.error != null) {
          return _buildErrorState(provider, context);
        }

        if (provider.dishesResponse == null || provider.dishesResponse!.dishes.isEmpty) {
          return _buildEmptyState(provider);
        }

        return _buildDishesContent(provider, context);
      },
    );
  }

  Widget _buildLoadingState(EnhancedDishesProvider provider) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 12),
            Text(provider.loadingMessage),
            SizedBox(height: 8),
            Text(
              'This may take up to 2 minutes...',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(EnhancedDishesProvider provider, BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(Icons.error, color: Colors.red),
            SizedBox(height: 8),
            Text('Failed to Load Dishes'),
            SizedBox(height: 4),
            Text(
              provider.error ?? 'Unknown error',
              style: TextStyle(fontSize: 12),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => provider.loadDishes(),
                  child: Text('Retry'),
                ),
                TextButton(
                  onPressed: () => _showMockData(provider),
                  child: Text('Show Sample'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(EnhancedDishesProvider provider) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(Icons.restaurant, color: Colors.grey[600], size: 32),
            SizedBox(height: 8),
            Text('No dishes found', style: TextStyle(color: Colors.grey[600])),
            SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => provider.loadDishes(),
              child: Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDishesContent(EnhancedDishesProvider provider, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildHeader(provider),
        SizedBox(height: 8),
        _buildFilters(provider),
        SizedBox(height: 12),
        _buildDishCards(provider, context),
      ],
    );
  }

  Widget _buildHeader(EnhancedDishesProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'AI Local Dishes 🤖🍴',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        Text(
          '${provider.filteredDishes.length} dishes',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildFilters(EnhancedDishesProvider provider) {
    final filters = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'];
    
    return SizedBox(
      height: 32,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = provider.selectedDietaryFilter == filter;
          
          return Container(
            margin: EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(
                filter,
                style: TextStyle(
                  fontSize: 11,
                  color: isSelected ? Colors.white : Colors.grey[700],
                ),
              ),
              selected: isSelected,
              onSelected: (selected) => provider.setDietaryFilter(filter),
              selectedColor: Colors.orange,
              backgroundColor: Colors.grey[200],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDishCards(EnhancedDishesProvider provider, BuildContext context) {
    final dishes = provider.filteredDishes;
    
    return SizedBox(
      height: 240,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: dishes.length,
        itemBuilder: (context, index) {
          final dish = dishes[index];
          return Container(
            width: 180,
            margin: EdgeInsets.only(right: 12),
            child: Card(
              elevation: 3,
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () => _showDishDetails(context, dish, provider),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDishHeader(dish),
                    Expanded(child: _buildDishContent(dish)),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDishHeader(Dish dish) {
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
          Center(
            child: Icon(
              Icons.restaurant_menu,
              size: 40,
              color: Colors.white.withOpacity(0.8),
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                dish.category,
                style: TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDishContent(Dish dish) {
    return Padding(
      padding: EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            dish.name,
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          SizedBox(height: 4),
          Text(
            dish.averagePrice,
            style: TextStyle(
              color: Colors.green[700],
              fontWeight: FontWeight.w600,
              fontSize: 11,
            ),
          ),
          SizedBox(height: 4),
          if (dish.recommendedPlaces.isNotEmpty)
            Row(
              children: [
                Icon(Icons.store, size: 10, color: Colors.grey[600]),
                SizedBox(width: 2),
                Expanded(
                  child: Text(
                    dish.recommendedPlaces.first.name,
                    style: TextStyle(fontSize: 9, color: Colors.grey[600]),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          SizedBox(height: 6),
          if (dish.dietaryTags.isNotEmpty)
            Wrap(
              spacing: 2,
              children: dish.dietaryTags.take(2).map<Widget>((tag) => Container(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: _getTagColor(tag),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _getTagIcon(tag),
                  style: TextStyle(fontSize: 8, color: Colors.white),
                ),
              )).toList(),
            ),
        ],
      ),
    );
  }

  void _showDishDetails(BuildContext context, Dish dish, EnhancedDishesProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(dish.name),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(dish.description),
              SizedBox(height: 12),
              Text('Price: ${dish.averagePrice}', 
                style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 8),
              if (dish.recommendedPlaces.isNotEmpty) ...[
                Text('Recommended Places:', 
                  style: TextStyle(fontWeight: FontWeight.bold)),
                ...dish.recommendedPlaces.map((place) => 
                  Text('• ${place.name} (${place.rating}/5)')),
                SizedBox(height: 8),
              ],
              if (dish.culturalSignificance.isNotEmpty) ...[
                Text('Cultural Note:', 
                  style: TextStyle(fontWeight: FontWeight.bold)),
                Text(dish.culturalSignificance),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Add to trip functionality
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('${dish.name} added to trip!')),
              );
            },
            child: Text('Add to Trip'),
          ),
        ],
      ),
    );
  }

  void _showMockData(EnhancedDishesProvider provider) {
    final mockDishes = [
      Dish(
        name: 'Kottu Roti',
        description: 'Stir-fried chopped roti with vegetables',
        averagePrice: 'LKR 450',
        category: 'Street Food',
        recommendedPlaces: [
          RecommendedPlace(
            name: 'Local Street Food',
            type: 'Street Food',
            address: 'Colombo',
            rating: 4.5,
          ),
        ],
        userPhotos: [],
        dietaryTags: ['halal'],
        culturalSignificance: 'Popular late-night street food',
      ),
    ];
    
    provider.setMockData(mockDishes);
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