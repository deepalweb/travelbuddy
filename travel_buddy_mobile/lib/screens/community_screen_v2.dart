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
  String? _selectedHashtag;
  final TextEditingController _searchController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadPosts(refresh: true, context: context);
    });
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
          onPressed: _showSearchDialog,
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
          _applyFilter();
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
              onPressed: () {
                setState(() {
                  _selectedHashtag = _selectedHashtag == _trendingHashtags[index] 
                      ? null 
                      : _trendingHashtags[index];
                });
                _applyFilter();
              },
              backgroundColor: _selectedHashtag == _trendingHashtags[index] 
                  ? Colors.blue[600] 
                  : Colors.blue[50],
              labelStyle: TextStyle(
                color: _selectedHashtag == _trendingHashtags[index] 
                    ? Colors.white 
                    : Colors.blue[700],
                fontWeight: FontWeight.w500,
              ),
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
  
  void _applyFilter() {
    String? filterParam;
    switch (_selectedFilter) {
      case FeedFilter.popular:
        filterParam = 'popular';
        break;
      case FeedFilter.trending:
        filterParam = 'trending';
        break;
      case FeedFilter.nearby:
        filterParam = 'nearby';
        break;
      default:
        filterParam = null;
    }
    
    context.read<CommunityProvider>().loadPosts(
      refresh: true,
      context: context,
      filter: filterParam,
      hashtag: _selectedHashtag,
    );
  }
  
  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search Posts'),
        content: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Search by content, location, or user...',
            prefixIcon: Icon(Icons.search),
          ),
          autofocus: true,
          onSubmitted: (value) {
            Navigator.pop(context);
            _performSearch(value);
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _performSearch(_searchController.text);
            },
            child: const Text('Search'),
          ),
        ],
      ),
    );
  }
  
  void _performSearch(String query) {
    if (query.trim().isEmpty) return;
    
    // Filter posts locally by content, location, or username
    final provider = context.read<CommunityProvider>();
    final allPosts = provider.posts;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Searching for "$query"...')),
    );
    
    // TODO: Implement backend search API
    // For now, show message that search is coming soon
    Future.delayed(const Duration(seconds: 1), () {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Search feature coming soon!')),
      );
    });
  }
}
