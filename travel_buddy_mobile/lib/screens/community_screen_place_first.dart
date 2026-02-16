import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../providers/community_provider.dart';
import '../providers/app_provider.dart';
import 'create_place_post_screen.dart';

class CommunityScreenPlaceFirst extends StatefulWidget {
  const CommunityScreenPlaceFirst({super.key});

  @override
  State<CommunityScreenPlaceFirst> createState() => _CommunityScreenPlaceFirstState();
}

class _CommunityScreenPlaceFirstState extends State<CommunityScreenPlaceFirst> {
  String _selectedFilter = 'hot';
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  String _currentLocation = 'Colombo, Sri Lanka';
  String _currentWeather = '28°C';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLocationAndWeather();
      context.read<CommunityProvider>().loadPosts(refresh: true, context: context);
    });
  }

  Future<void> _loadLocationAndWeather() async {
    final appProvider = context.read<AppProvider>();
    if (appProvider.currentLocation != null) {
      setState(() {
        _currentLocation = 'Colombo, Sri Lanka'; // TODO: Get from geocoding
        _currentWeather = '${appProvider.weatherInfo?.temperature.round() ?? 28}°C';
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          _buildLocationBar(),
          _buildWelcomeCard(),
          _buildFilterBar(),
          _buildPlaceCards(),
        ],
      ),
      floatingActionButton: _buildFAB(),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: 64,
      title: _isSearching
          ? TextField(
              controller: _searchController,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'Search places...',
                border: InputBorder.none,
              ),
              onChanged: (value) => setState(() {}),
            )
          : const Text('🌍 TRAVEL BUDDY', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Color(0xFF212529))),
      actions: [
        Stack(
          children: [
            IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
              ),
            ),
          ],
        ),
        IconButton(
          icon: Icon(_isSearching ? Icons.close : Icons.search),
          onPressed: () => setState(() {
            _isSearching = !_isSearching;
            if (!_isSearching) _searchController.clear();
          }),
        ),
      ],
    );
  }

  Widget _buildLocationBar() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        child: Row(
          children: [
            const Icon(Icons.location_on, size: 18, color: Color(0xFF4361EE)),
            const SizedBox(width: 6),
            Text(_currentLocation, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(width: 16),
            const Text('🌤️', style: TextStyle(fontSize: 16)),
            const SizedBox(width: 4),
            Text(_currentWeather, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeCard() {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF4361EE), Color(0xFF2EC4B6)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4361EE).withOpacity(0.3),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(_getGreeting(), style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('✨ New', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text('3 new places match your Foodie style', style: TextStyle(color: Colors.white70, fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return SliverToBoxAdapter(
      child: Container(
        height: 56,
        color: Colors.white,
        margin: const EdgeInsets.only(bottom: 8),
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            _buildFilterChip('🔥 Hot Now', 'hot'),
            _buildFilterChip('📍 Near Me', 'nearby'),
            _buildFilterChip('⭐ Top Rated', 'rated'),
            _buildFilterChip('💰 Budget', 'budget'),
            _buildFilterChip('🍜 Foodie', 'foodie'),
            _buildFilterChip('🤫 Hidden Gems', 'hidden'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String filter) {
    final isSelected = _selectedFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        onSelected: (selected) {
          setState(() => _selectedFilter = filter);
          _applyFilter(filter);
        },
        backgroundColor: const Color(0xFFF8F9FA),
        selectedColor: const Color(0xFF4361EE),
        labelStyle: TextStyle(color: isSelected ? Colors.white : const Color(0xFF212529)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }

  void _applyFilter(String filter) {
    String? filterParam;
    switch (filter) {
      case 'hot':
        filterParam = 'popular';
        break;
      case 'nearby':
        filterParam = 'nearby';
        break;
      case 'rated':
        filterParam = 'top-rated';
        break;
      case 'budget':
        filterParam = 'budget';
        break;
      case 'foodie':
        filterParam = 'foodie';
        break;
      case 'hidden':
        filterParam = 'hidden-gems';
        break;
    }
    context.read<CommunityProvider>().loadPosts(refresh: true, context: context, filter: filterParam);
  }

  Widget _buildPlaceCards() {
    return Consumer<CommunityProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.posts.isEmpty) {
          return const SliverFillRemaining(child: Center(child: CircularProgressIndicator()));
        }

        if (provider.posts.isEmpty) {
          return SliverFillRemaining(child: _buildEmptyState());
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (index >= provider.posts.length) return const SizedBox.shrink();
              final post = provider.posts[index];
              final distance = _calculateDistance(post);
              return _buildPlaceCard(post, distance);
            },
            childCount: provider.posts.length,
          ),
        );
      },
    );
  }

  String _calculateDistance(dynamic post) {
    // TODO: Calculate actual distance using Geolocator
    final distances = ['200m', '500m', '1.2km', '800m', '1.5km'];
    return distances[post.id.hashCode % distances.length];
  }

  double _calculatePlaceValueScore(dynamic post) {
    // Place Value Score = 70% rating + 20% tips + 10% relevance
    final rating = 4.8; // TODO: Get from post
    final tipsQuality = 0.8; // TODO: Calculate from tips
    final relevance = 0.9; // TODO: Calculate from user preferences
    return (rating * 0.7) + (tipsQuality * 5 * 0.2) + (relevance * 5 * 0.1);
  }

  Widget _buildPlaceCard(dynamic post, String distance) {
    final placeValueScore = _calculatePlaceValueScore(post);
    print('🖼️ Post images: ${post.images}');
    print('📍 Post location: ${post.location}');
    print('📝 Post content: ${post.content}');
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Stack(
              children: [
                post.images.isNotEmpty
                    ? Image.network(
                        post.images.first,
                        height: 200,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 200,
                          color: Colors.grey[300],
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.place, size: 64, color: Colors.grey),
                              SizedBox(height: 8),
                              Text('Image not available', style: TextStyle(color: Colors.grey)),
                            ],
                          ),
                        ),
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            height: 200,
                            color: Colors.grey[200],
                            child: Center(
                              child: CircularProgressIndicator(
                                value: loadingProgress.expectedTotalBytes != null
                                    ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                    : null,
                              ),
                            ),
                          );
                        },
                      )
                    : Container(
                        height: 200,
                        color: Colors.grey[300],
                        child: const Icon(Icons.place, size: 64, color: Colors.grey),
                      ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4361EE),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(placeValueScore.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF2EC4B6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on, color: Colors.white, size: 12),
                        const SizedBox(width: 4),
                        Text(distance, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(radius: 16, child: Text(post.userName[0].toUpperCase())),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(post.userName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                          Text(post.location, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2EC4B6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified, size: 12, color: Color(0xFF2EC4B6)),
                          SizedBox(width: 4),
                          Text('Verified', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF2EC4B6))),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(post.content, style: const TextStyle(fontSize: 15, height: 1.4), maxLines: 3, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    _buildInfoChip('💰 25k LKR', Colors.green),
                    _buildInfoChip('⏱️ 10 min wait', Colors.orange),
                    _buildInfoChip('✅ English menu', Colors.blue),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFF6B35).withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.lightbulb_outline, size: 16, color: Color(0xFFFF6B35)),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '💡 Tip: Go before 7PM to avoid crowds and get the freshest food',
                          style: TextStyle(fontSize: 13, color: Color(0xFFFF6B35), fontWeight: FontWeight.w500),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _buildActionButton(Icons.bookmark_border, 'Save', () {}),
                    const SizedBox(width: 16),
                    _buildActionButton(Icons.directions, 'Directions', () {}),
                    const Spacer(),
                    _buildActionButton(Icons.share, 'Share', () {}),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
    );
  }

  Widget _buildActionButton(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF4361EE)),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF4361EE))),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🌴', style: TextStyle(fontSize: 80)),
            const SizedBox(height: 24),
            const Text('Discover Places Near You', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 12),
            const Text('No places to show yet. Start by reviewing your first location!', style: TextStyle(color: Colors.grey, fontSize: 16), textAlign: TextAlign.center),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CreatePlacePostScreen())),
              icon: const Icon(Icons.add_location),
              label: const Text('Add First Place'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4361EE),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFAB() {
    return FloatingActionButton.extended(
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CreatePlacePostScreen())),
      icon: const Icon(Icons.add_location),
      label: const Text('Add Place', style: TextStyle(fontWeight: FontWeight.w600)),
      backgroundColor: const Color(0xFF4361EE),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return '🌅 GOOD MORNING!';
    if (hour < 17) return '☀️ GOOD AFTERNOON!';
    return '🌙 GOOD EVENING!';
  }
}
