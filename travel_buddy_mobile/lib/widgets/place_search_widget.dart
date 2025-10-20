import 'package:flutter/material.dart';
import '../models/place_model.dart';
import '../services/place_service.dart';

class PlaceSearchWidget extends StatefulWidget {
  final Function(Place) onPlaceSelected;
  final String? hintText;

  const PlaceSearchWidget({
    Key? key,
    required this.onPlaceSelected,
    this.hintText,
  }) : super(key: key);

  @override
  State<PlaceSearchWidget> createState() => _PlaceSearchWidgetState();
}

class _PlaceSearchWidgetState extends State<PlaceSearchWidget> {
  final TextEditingController _controller = TextEditingController();
  final PlaceService _placeService = PlaceService();
  List<Place> _searchResults = [];
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: widget.hintText ?? 'Search places...',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _isLoading 
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          onChanged: _onSearchChanged,
        ),
        if (_searchResults.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            constraints: const BoxConstraints(maxHeight: 300),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _searchResults.length,
              itemBuilder: (context, index) {
                final place = _searchResults[index];
                return PlaceListTile(
                  place: place,
                  onTap: () => _selectPlace(place),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  void _onSearchChanged(String query) async {
    if (query.length < 3) {
      setState(() => _searchResults.clear());
      return;
    }

    setState(() => _isLoading = true);

    try {
      final results = await _placeService.searchPlaces(query);
      setState(() {
        _searchResults = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Search error: $e')),
      );
    }
  }

  void _selectPlace(Place place) {
    _controller.text = place.name;
    setState(() => _searchResults.clear());
    widget.onPlaceSelected(place);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

class PlaceListTile extends StatelessWidget {
  final Place place;
  final VoidCallback onTap;

  const PlaceListTile({
    Key? key,
    required this.place,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        child: Icon(_getCategoryIcon(place.category)),
      ),
      title: Text(
        place.name,
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(place.address),
          if (place.rating != null)
            Row(
              children: [
                const Icon(Icons.star, size: 16, color: Colors.amber),
                Text(' ${place.rating!.toStringAsFixed(1)}'),
                if (place.reviewCount != null)
                  Text(' (${place.reviewCount} reviews)'),
              ],
            ),
        ],
      ),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'restaurant':
      case 'food':
        return Icons.restaurant;
      case 'hotel':
      case 'lodging':
        return Icons.hotel;
      case 'gas_station':
        return Icons.local_gas_station;
      case 'hospital':
        return Icons.local_hospital;
      case 'bank':
        return Icons.account_balance;
      case 'shopping':
        return Icons.shopping_cart;
      default:
        return Icons.place;
    }
  }
}