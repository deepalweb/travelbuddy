import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/place_section.dart';
import '../models/place.dart';
import '../providers/app_provider.dart';
import '../widgets/place_card.dart';
import '../screens/place_details_screen.dart';

class SectionPlacesScreen extends StatefulWidget {
  final PlaceSection section;

  const SectionPlacesScreen({
    super.key,
    required this.section,
  });

  @override
  State<SectionPlacesScreen> createState() => _SectionPlacesScreenState();
}

class _SectionPlacesScreenState extends State<SectionPlacesScreen> {
  List<Place> _places = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _places = List.from(widget.section.places);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(widget.section.emoji),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.section.title,
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
              ],
            ),
            Text(
              widget.section.subtitle,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          return Column(
            children: [
              // Results count
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      '${_places.length} places found',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    if (_isLoading)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                  ],
                ),
              ),
              
              // Places List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _places.length + (_hasMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index == _places.length) {
                      // Load more button
                      return _buildLoadMoreButton(appProvider);
                    }
                    
                    final place = _places[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: PlaceCard(
                        place: place,
                        compact: false, // Use full card
                        isFavorite: appProvider.favoriteIds.contains(place.id),
                        onFavoriteToggle: () async {
                          await appProvider.toggleFavorite(place.id);
                        },
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => PlaceDetailsScreen(place: place),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLoadMoreButton(AppProvider appProvider) {
    return Container(
      margin: const EdgeInsets.only(bottom: 100),
      child: ElevatedButton(
        onPressed: _isLoading ? null : () => _loadMorePlaces(appProvider),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blue,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.refresh, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    _hasMore ? 'Load More Places' : 'No More Places',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _loadMorePlaces(AppProvider appProvider) async {
    if (_isLoading) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      final newPlaces = await appProvider.loadMoreForSection(
        widget.section.id,
        _currentPage + 1,
      );
      
      if (newPlaces.isNotEmpty) {
        // Deduplicate places by ID
        final existingIds = _places.map((p) => p.id).toSet();
        final uniqueNewPlaces = newPlaces.where((p) => !existingIds.contains(p.id)).toList();
        
        setState(() {
          _places.addAll(uniqueNewPlaces);
          _currentPage++;
          _hasMore = uniqueNewPlaces.length >= 5; // Adjusted threshold
        });
      } else {
        setState(() {
          _hasMore = false;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading more places: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}