import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/community_provider.dart';
import '../widgets/enhanced_story_card.dart';
import 'create_post_screen.dart';

enum FeedFilter { recent, popular, trending, nearby }

class CommunityScreenV2 extends StatefulWidget {
  const CommunityScreenV2({super.key});

  @override
  State<CommunityScreenV2> createState() => _CommunityScreenV2State();
}

class _CommunityScreenV2State extends State<CommunityScreenV2> with SingleTickerProviderStateMixin {
  FeedFilter _selectedFilter = FeedFilter.recent;
  final List<String> _trendingHashtags = ['Travel', 'Adventure', 'Culture', 'Food', 'Photography', 'Beach'];
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadPosts(refresh: true, context: context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: _buildAppBar(),
      body: _buildBody(),
      floatingActionButton: _buildFAB(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0.5,
      title: const Text(
        'Community',
        style: TextStyle(color: Colors.black, fontSize: 22, fontWeight: FontWeight.w700),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.black, size: 26),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: Colors.black, size: 26),
          onPressed: () {},
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildBody() {
    return CustomScrollView(
      slivers: [
        // Filter Tabs
        SliverToBoxAdapter(child: _buildFilterTabs()),
        
        // Hashtag Chips
        SliverToBoxAdapter(child: _buildHashtagChips()),
        
        // Feed
        _buildFeed(),
      ],
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      height: 56,
      color: Colors.white,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: [
          _buildFilterChip('Recent', FeedFilter.recent, Icons.access_time),
          _buildFilterChip('Popular', FeedFilter.popular, Icons.trending_up),
          _buildFilterChip('Trending', FeedFilter.trending, Icons.local_fire_department),
          _buildFilterChip('Nearby', FeedFilter.nearby, Icons.location_on),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, FeedFilter filter, IconData icon) {
    final isSelected = _selectedFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: isSelected ? Colors.white : Colors.grey[700]),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
        onSelected: (selected) {
          setState(() => _selectedFilter = filter);
          // TODO: Load filtered posts
        },
        backgroundColor: Colors.grey[100],
        selectedColor: Colors.blue[600],
        labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.grey[800]),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  Widget _buildHashtagChips() {
    return Container(
      height: 50,
      color: Colors.white,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _trendingHashtags.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ActionChip(
              label: Text('#${_trendingHashtags[index]}'),
              onPressed: () {},
              backgroundColor: Colors.blue[50],
              labelStyle: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.w500),
              side: BorderSide.none,
            ),
          );
        },
      ),
    );
  }

  Widget _buildFeed() {
    return Consumer<CommunityProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.posts.isEmpty) {
          return const SliverFillRemaining(
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (provider.posts.isEmpty) {
          return SliverFillRemaining(child: _buildEmptyState());
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (index >= provider.posts.length) {
                if (provider.hasMorePosts) {
                  provider.loadPosts(context: context);
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return const SizedBox.shrink();
              }
              
              return EnhancedStoryCard(post: provider.posts[index]);
            },
            childCount: provider.posts.length + (provider.hasMorePosts ? 1 : 0),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.explore_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No Stories Yet',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to share your travel story!',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildFAB() {
    return FloatingActionButton.extended(
      onPressed: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const CreatePostScreen()),
        );
      },
      icon: const Icon(Icons.add),
      label: const Text('Share Story'),
      backgroundColor: Colors.blue[600],
    );
  }
}
