import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'home_viewmodel.dart';
import '../../providers/app_provider.dart';
import '../../widgets/place_card.dart';
import '../place_details_screen.dart';

class ExploreView extends StatefulWidget {
  const ExploreView({super.key});

  @override
  State<ExploreView> createState() => _ExploreViewState();
}

class _ExploreViewState extends State<ExploreView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      if (appProvider.placeSections.isEmpty) {
        appProvider.loadPlaceSections();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        _buildAppBar(),
        _buildProfileCard(),
        _buildSafetyAlert(),
        _buildQuickActions(),
        _buildCategoryPlaces(),
        // Extra space for bottom nav
        const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
      ],
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      pinned: true,
      backgroundColor: const Color(0xFF111714).withOpacity(0.8),
      leading: IconButton(
        icon: const Icon(Icons.security, color: Colors.white),
        style: IconButton.styleFrom(
          backgroundColor: Colors.red,
          shape: const CircleBorder(),
        ),
        onPressed: () {
          Navigator.pushNamed(context, '/safety');
        },
      ),
      title: const Text(
        'Your Day',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.settings, color: Colors.white),
          onPressed: () {
            // Handle settings button press
          },
        ),
      ],
    );
  }

  Widget _buildProfileCard() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Profile image section
                Expanded(
                  flex: 1,
                  child: AspectRatio(
                    aspectRatio: 16/9,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.horizontal(
                          left: Radius.circular(16)
                        ),
                        image: const DecorationImage(
                          image: NetworkImage(
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCMio2LGPEqBXVt4myWWOytIYu6UlvtXlZjqC9MqrpqJMaIhNwodPb1gvC09__DcUF65iJ8bQuYIuX7mEGydQr9cdxxWJPEbQLz1cNIT79PB0FcEPD7tsQWu9E3QLqV-TpTdK3krbR8KrBLJtJa4uxwSUrpWIo1JOkfgLJ2c9XNNd775wTv0yY8g_JAM5ebuRSozoiBYc7e0yRiFxMwjigL7n4jArm8av6qVwggI6zo3pJnb3TJhMQprKNzHtbcYcAcmxTXCHdI0v0',
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
                // Info section
                Expanded(
                  flex: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Consumer<HomeViewModel>(
                          builder: (context, viewModel, child) {
                            return Text(
                              '${viewModel.getTimeBasedGreeting()} Alex!',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 8),
                        Consumer<HomeViewModel>(
                          builder: (context, viewModel, child) {
                            return Column(
                              children: [
                                _buildInfoRow(Icons.location_on, 'Current Location'),
                                const SizedBox(height: 4),
                                _buildInfoRow(
                                  Icons.wb_sunny, 
                                  '${viewModel.weatherData?['emoji'] ?? '☀️'} ${viewModel.weatherData?['temp'] ?? 'Loading...'}'
                                ),
                                const SizedBox(height: 4),
                                _buildInfoRow(Icons.schedule, viewModel.currentTime),
                              ],
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF9EB7A8), size: 18),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF9EB7A8),
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildSafetyAlert() {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final location = appProvider.currentLocation;
        if (location == null) return const SliverToBoxAdapter(child: SizedBox.shrink());
        
        return SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Container(
              padding: const EdgeInsets.all(12.0),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                border: Border.all(
                  color: Colors.green.withOpacity(0.5),
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.security, color: Colors.green, size: 24),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Safety Center: Emergency services & contacts',
                      style: TextStyle(
                        color: Colors.green,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/safety');
                    },
                    child: const Text(
                      'Open',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.only(top: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF111714).withOpacity(0.8),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildQuickActionButton(
                icon: Icons.airplane_ticket,
                label: 'My Trip',
                hasNotification: true,
              ),
              _buildQuickActionButton(
                icon: Icons.map,
                label: 'Map',
              ),
              _buildQuickActionButton(
                icon: Icons.local_offer,
                label: 'Deals',
                badge: '🔥 2',
              ),
              _buildQuickActionButton(
                icon: Icons.security,
                label: 'Safety Hub',
                onTap: () => Navigator.pushNamed(context, '/safety'),
              ),
              _buildQuickActionButton(
                icon: Icons.checklist,
                label: 'Planner',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    bool hasNotification = false,
    String? badge,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 112,
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF29382F),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(icon, color: Colors.white, size: 24),
                if (hasNotification)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF38E07B),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                if (badge != null)
                  Positioned(
                    top: -8,
                    right: -16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }



  Widget _buildMoodButton({
    required IconData icon,
    required String label,
    bool isSelected = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: OutlinedButton.icon(
        onPressed: () {
          // Handle mood selection
        },
        icon: Icon(
          icon,
          color: isSelected ? const Color(0xFF38E07B) : Colors.white,
        ),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isSelected
                ? const Color(0xFF38E07B)
                : const Color(0xFF3D5245),
            width: isSelected ? 2 : 1,
          ),
          backgroundColor: isSelected
              ? const Color(0xFF38E07B).withOpacity(0.1)
              : Colors.transparent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryPlaces() {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        if (appProvider.placeSections.isEmpty) {
          return const SliverToBoxAdapter(child: SizedBox.shrink());
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final section = appProvider.placeSections[index];
              return Container(
                margin: const EdgeInsets.only(top: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          Text(
                            section.emoji,
                            style: const TextStyle(fontSize: 24),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            section.title,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const Spacer(),
                          TextButton(
                            onPressed: () {
                              appProvider.setSelectedCategory(section.category);
                              Navigator.pushNamed(context, '/places');
                            },
                            child: const Text(
                              'See All',
                              style: TextStyle(color: Color(0xFF38E07B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 200,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: section.places.take(5).length,
                        itemBuilder: (context, placeIndex) {
                          final place = section.places[placeIndex];
                          return Container(
                            width: 160,
                            margin: const EdgeInsets.only(right: 12),
                            child: PlaceCard(
                              place: place,
                              compact: true,
                              isFavorite: appProvider.favoriteIds.contains(place.id),
                              onFavoriteToggle: () => appProvider.toggleFavorite(place.id),
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
                ),
              );
            },
            childCount: appProvider.placeSections.length,
          ),
        );
      },
    );
  }


}