import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/providers/auth_provider.dart';
import '../../../shared/services/places_service.dart';
import '../../../core/models/place.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PlacesService _placesService = PlacesService();
  List<Place> _nearbyPlaces = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadNearbyPlaces();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('TravelBuddy'),
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundImage: authProvider.currentUser?.profilePicture != null
                      ? NetworkImage(authProvider.currentUser!.profilePicture!)
                      : null,
                  child: authProvider.currentUser?.profilePicture == null
                      ? Text(authProvider.currentUser?.username.substring(0, 1).toUpperCase() ?? 'U')
                      : null,
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadNearbyPlaces,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Consumer<AuthProvider>(
                builder: (context, authProvider, child) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Welcome back, ${authProvider.currentUser?.username ?? 'Traveler'}!',
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Discover amazing places around you',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              Text(
                'Nearby Places',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _nearbyPlaces.isEmpty
                      ? const Center(
                          child: Text('No places found nearby'),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _nearbyPlaces.length,
                          itemBuilder: (context, index) {
                            final place = _nearbyPlaces[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.place),
                                title: Text(place.name),
                                subtitle: Text(place.formattedAddress),
                                trailing: place.rating != null
                                    ? Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.star, color: Colors.amber, size: 16),
                                          Text(place.rating!.toStringAsFixed(1)),
                                        ],
                                      )
                                    : null,
                                onTap: () {
                                  // Navigate to place details
                                },
                              ),
                            );
                          },
                        ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _loadNearbyPlaces() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Use default location (can be enhanced with actual location)
      final places = await _placesService.getNearbyPlaces(
        lat: 37.7749,
        lng: -122.4194,
        query: 'tourist attractions',
      );
      
      setState(() {
        _nearbyPlaces = places;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading places: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}