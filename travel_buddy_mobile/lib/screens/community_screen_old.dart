import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../widgets/community_post_card.dart';
import '../widgets/community_insights_widget.dart';
import '../widgets/community_quick_actions.dart';
import '../widgets/community_stories.dart';
import '../models/travel_enums.dart';
import 'create_post_screen.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  PostType? _selectedFilter;
  bool _showSearch = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadPosts(refresh: true);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _showSearch ? _buildSearchField() : const Text('Community'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchController.clear();
                }
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              final result = await Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const CreatePostScreen(),
                ),
              );
              // Post already added optimistically in provider
              // No need to refresh as it would override the new post
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'For You', icon: Icon(Icons.home, size: 20)),
            Tab(text: 'Following', icon: Icon(Icons.people, size: 20)),
            Tab(text: 'Trending', icon: Icon(Icons.trending_up, size: 20)),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildStoriesSection(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPostsList('for_you'),
                _buildPostsList('following'),
                _buildPostsList('trending'),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const CreatePostScreen(),
            ),
          );
          // Post already added optimistically in provider
          // No need to refresh as it would override the new post
        },
        backgroundColor: Colors.blue[600],
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildSearchField() {
    return TextField(
      controller: _searchController,
      autofocus: true,
      style: const TextStyle(color: Colors.white),
      decoration: const InputDecoration(
        hintText: 'Search posts, places, users...',
        hintStyle: TextStyle(color: Colors.white70),
        border: InputBorder.none,
      ),
      onChanged: (value) {
        if (value.isNotEmpty) {
          context.read<CommunityProvider>().searchPosts(value);
        } else {
          context.read<CommunityProvider>().loadPosts(refresh: true);
        }
      },
    );
  }

  Widget _buildStoriesSection() {
    return const CommunityStories();
  }

  Widget _buildPostsList(String type) {
    return Consumer2<AppProvider, CommunityProvider>(
      builder: (context, appProvider, communityProvider, child) {
        print('📺 [UI] Building posts list for tab: $type');
        print('📊 [UI] Posts count: ${communityProvider.posts.length}');
        print('🔄 [UI] Is loading: ${communityProvider.isLoading}');
        print('⚠️ [UI] Error: ${communityProvider.error}');
        
        if (!appProvider.isAuthenticated) {
          print('🚫 [UI] User not authenticated');
          return _buildUnauthenticatedView();
        }

        if (communityProvider.isLoading && communityProvider.posts.isEmpty) {
          print('⏳ [UI] Loading with empty posts');
          return const Center(child: CircularProgressIndicator());
        }

        if (communityProvider.error != null && communityProvider.posts.isEmpty) {
          print('❌ [UI] Error with empty posts');
          return _buildErrorView(communityProvider);
        }

        if (communityProvider.posts.isEmpty) {
          print('💭 [UI] No posts available');
          return _buildEmptyView();
        }
        
        print('✅ [UI] Rendering ${communityProvider.posts.length} posts');
        if (communityProvider.posts.isNotEmpty) {
          print('🔍 [UI] First post: ${communityProvider.posts.first.content}');
        }

        return RefreshIndicator(
          onRefresh: () => communityProvider.loadPosts(refresh: true),
          child: ListView.builder(
            itemCount: communityProvider.posts.length + 
                (communityProvider.hasMorePosts ? 1 : 0) + 
                (type == 'for_you' ? 2 : 0), // Add space for widgets in 'for_you' tab
            itemBuilder: (context, index) {
              // Add quick actions and insights for 'for_you' tab
              if (type == 'for_you') {
                if (index == 0) {
                  return const CommunityQuickActions();
                }
                if (index == 1) {
                  return const CommunityInsightsWidget();
                }
                // Adjust index for posts
                index -= 2;
              }
              
              if (index == communityProvider.posts.length) {
                if (communityProvider.hasMorePosts) {
                  communityProvider.loadPosts();
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return const SizedBox.shrink();
              }

              return CommunityPostCard(
                post: communityProvider.posts[index],
              );
            },
          ),
        );
      },
    );
  }

  void _showFilterDialog() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Filter Posts',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  const Text('Post Type:', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('All'),
                        selected: _selectedFilter == null,
                        onSelected: (selected) {
                          setModalState(() {
                            _selectedFilter = selected ? null : _selectedFilter;
                          });
                        },
                      ),
                      ...PostType.values.map((type) => FilterChip(
                        label: Text(type.displayName),
                        selected: _selectedFilter == type,
                        onSelected: (selected) {
                          setModalState(() {
                            _selectedFilter = selected ? type : null;
                          });
                        },
                      )),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setState(() {
                              _selectedFilter = null;
                            });
                            Navigator.pop(context);
                          },
                          child: const Text('Clear'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            setState(() {});
                            Navigator.pop(context);
                            context.read<CommunityProvider>().filterPosts(_selectedFilter);
                          },
                          child: const Text('Apply'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildUnauthenticatedView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'Join the Community',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Sign in to share your travel experiences\nand connect with fellow travelers',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              // Navigate to login
            },
            icon: const Icon(Icons.login),
            label: const Text('Sign In'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(CommunityProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'Something went wrong',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            provider.error ?? 'Unknown error',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => provider.loadPosts(refresh: true),
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.forum_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          const Text(
            'No Posts Yet',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to share your travel experience!',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const CreatePostScreen(),
                ),
              );
            },
            icon: const Icon(Icons.add),
            label: const Text('Create Post'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}