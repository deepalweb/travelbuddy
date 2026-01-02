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
  String _searchQuery = '';
  List<dynamic> _filteredPosts = [];
  
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
        Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined, color: Colors.black, size: 26),
              onPressed: _showNotifications,
            ),
            Positioned(
              right: 8,
              top: 8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                child: const Text(
                  '3',
                  style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
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

        // Apply local search filter
        final posts = _searchQuery.isEmpty 
            ? provider.posts 
            : provider.posts.where((post) {
                final content = post.content?.toLowerCase() ?? '';
                final location = post.location?.toLowerCase() ?? '';
                final username = post.userName?.toLowerCase() ?? '';
                final query = _searchQuery.toLowerCase();
                return content.contains(query) || location.contains(query) || username.contains(query);
              }).toList();

        if (posts.isEmpty) {
          return SliverFillRemaining(child: _buildEmptyState());
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (index >= posts.length) {
                if (provider.hasMorePosts && _searchQuery.isEmpty) {
                  provider.loadPosts(context: context);
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return const SizedBox.shrink();
              }
              
              return EnhancedStoryCard(
                post: posts[index],
                onLike: () => _handleLike(posts[index]),
                onComment: () => _handleComment(posts[index]),
                onShare: () => _handleShare(posts[index]),
                onUserTap: () => _showUserProfile(posts[index].userId),
                onReport: () => _reportPost(posts[index]),
                onDelete: () => _handleDelete(posts[index]),
                currentUserId: context.read<AppProvider>().currentUser?.mongoId ?? 
                              context.read<AppProvider>().currentUser?.uid,
              );
            },
            childCount: posts.length + (provider.hasMorePosts && _searchQuery.isEmpty ? 1 : 0),
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
    if (query.trim().isEmpty) {
      setState(() => _searchQuery = '');
      return;
    }
    
    setState(() => _searchQuery = query.trim());
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Searching for "$query"...'), duration: const Duration(seconds: 1)),
    );
  }
  
  void _handleLike(dynamic post) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Post liked!'), duration: Duration(seconds: 1)),
    );
  }
  
  void _handleComment(dynamic post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add Comment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                decoration: const InputDecoration(
                  hintText: 'Write a comment...',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
                autofocus: true,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Comment posted!')),
                  );
                },
                child: const Text('Post Comment'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _handleShare(dynamic post) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Share Post', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy Link'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Link copied to clipboard')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share to...'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Opening share menu...')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showUserProfile(String? userId) {
    if (userId == null) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('User Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 16),
            Text('User ID: $userId', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Travel Enthusiast'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(children: [const Text('125', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Posts', style: TextStyle(fontSize: 12))]),
                Column(children: [const Text('1.2K', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Followers', style: TextStyle(fontSize: 12))]),
                Column(children: [const Text('340', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Following', style: TextStyle(fontSize: 12))]),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Follow')),
        ],
      ),
    );
  }
  
  void _reportPost(dynamic post) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Post'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Why are you reporting this post?'),
            const SizedBox(height: 16),
            ListTile(
              title: const Text('Spam'),
              onTap: () => _submitReport('Spam'),
            ),
            ListTile(
              title: const Text('Inappropriate Content'),
              onTap: () => _submitReport('Inappropriate'),
            ),
            ListTile(
              title: const Text('Harassment'),
              onTap: () => _submitReport('Harassment'),
            ),
            ListTile(
              title: const Text('False Information'),
              onTap: () => _submitReport('False Info'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ],
      ),
    );
  }
  
  void _submitReport(String reason) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Post reported for: $reason. Thank you for keeping our community safe.')),
    );
  }
  
  void _handleDelete(dynamic post) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this post? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      try {
        await context.read<CommunityProvider>().deletePost(post.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Post deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete post: $e')),
          );
        }
      }
    }
  }
  
  void _showNotifications() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.favorite, color: Colors.red)),
              title: const Text('John liked your post'),
              subtitle: const Text('2 hours ago'),
            ),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.comment, color: Colors.blue)),
              title: const Text('Sarah commented on your post'),
              subtitle: const Text('5 hours ago'),
            ),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person_add, color: Colors.green)),
              title: const Text('Mike started following you'),
              subtitle: const Text('1 day ago'),
            ),
          ],
        ),
      ),
    );
  }
}
