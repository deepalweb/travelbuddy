import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../widgets/instagram_post_card.dart';
import '../widgets/instagram_stories.dart';
import 'create_post_screen.dart';
import 'user_profile_screen.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  @override
  void initState() {
    super.initState();
    print('🚀 [INSTAGRAM] Initializing community screen');
    
    final provider = context.read<CommunityProvider>();
    
    // Load local posts immediately (instant)
    provider.loadLocalPosts();
    print('💾 [INSTAGRAM] Loading local posts instantly');
    
    // Sync with backend after 1 second delay
    Timer(Duration(seconds: 1), () {
      if (mounted) {
        print('🌐 [INSTAGRAM] Starting background sync');
        provider.syncWithBackend();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildInstagramAppBar(),
      body: _buildInstagramBody(),
    );
  }

  PreferredSizeWidget _buildInstagramAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      title: const Text(
        'TravelBuddy',
        style: TextStyle(
          color: Colors.black,
          fontSize: 24,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.black, size: 26),
          onPressed: () => _showUserSearch(),
        ),
        IconButton(
          icon: const Icon(Icons.add_box_outlined, color: Colors.black, size: 26),
          onPressed: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const CreatePostScreen(),
              ),
            );
          },
        ),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 0.5,
          color: Colors.grey[300],
        ),
      ),
    );
  }

  Widget _buildInstagramBody() {
    return Consumer2<AppProvider, CommunityProvider>(
      builder: (context, appProvider, communityProvider, child) {
        print('📺 [FEED] Building Instagram body');
        print('📺 [FEED] Posts count: ${communityProvider.posts.length}');
        print('📺 [FEED] Is loading: ${communityProvider.isLoading}');
        print('📺 [FEED] Error: ${communityProvider.error}');
        print('📺 [FEED] User authenticated: ${appProvider.isAuthenticated}');
        
        if (communityProvider.posts.isNotEmpty) {
          print('📺 [FEED] First post content: "${communityProvider.posts.first.content}"');
          print('📺 [FEED] First post ID: ${communityProvider.posts.first.id}');
          print('📺 [FEED] First post user: ${communityProvider.posts.first.userName}');
          print('📺 [FEED] First post avatar: ${communityProvider.posts.first.userAvatar}');
        } else {
          print('📺 [FEED] No posts to display');
        }
        
        if (!appProvider.isAuthenticated) {
          return _buildUnauthenticatedView();
        }

        return RefreshIndicator(
          onRefresh: () => communityProvider.loadPosts(refresh: true, context: context),
          child: CustomScrollView(
            slivers: [
              // Stories Section
              const SliverToBoxAdapter(
                child: InstagramStories(),
              ),
              
              // Posts List
              if (communityProvider.isLoading && communityProvider.posts.isEmpty)
                const SliverFillRemaining(
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (communityProvider.posts.isEmpty)
                SliverFillRemaining(child: _buildEmptyView())
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      if (index >= communityProvider.posts.length) {
                        if (communityProvider.hasMorePosts) {
                          communityProvider.loadPosts(context: context);
                          return const Padding(
                            padding: EdgeInsets.all(16),
                            child: Center(child: CircularProgressIndicator()),
                          );
                        }
                        return const SizedBox.shrink();
                      }
                      
                      return InstagramPostCard(
                        post: communityProvider.posts[index],
                      );
                    },
                    childCount: communityProvider.posts.length + 
                        (communityProvider.hasMorePosts ? 1 : 0),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUnauthenticatedView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 24),
          const Text(
            'Welcome to TravelBuddy',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            'Sign in to share your travel experiences\nand connect with fellow travelers',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3797EF),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text('Sign In', style: TextStyle(fontSize: 16)),
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
          Icon(Icons.camera_alt_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 24),
          const Text(
            'No Posts Yet',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            'Start sharing your travel adventures!',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
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
            label: const Text('Share Your First Post'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3797EF),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showUserSearch() {
    showSearch(
      context: context,
      delegate: UserSearchDelegate(),
    );
  }
}

class UserSearchDelegate extends SearchDelegate<String> {
  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      IconButton(
        icon: const Icon(Icons.clear),
        onPressed: () => query = '',
      ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, ''),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildSearchResults(context);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _buildSearchResults(context);
  }

  Widget _buildSearchResults(BuildContext context) {
    if (query.isEmpty) {
      return const Center(
        child: Text('Search for users by name'),
      );
    }

    final provider = context.read<CommunityProvider>();
    final users = provider.posts
        .where((post) => post.userName.toLowerCase().contains(query.toLowerCase()))
        .map((post) => {
              'userId': post.userId,
              'userName': post.userName,
              'userAvatar': post.userAvatar,
            })
        .toSet()
        .toList();

    if (users.isEmpty) {
      return const Center(
        child: Text('No users found'),
      );
    }

    return ListView.builder(
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: user['userAvatar']!.isNotEmpty && !user['userAvatar']!.contains('unsplash')
                ? NetworkImage(user['userAvatar']!)
                : null,
            child: user['userAvatar']!.isEmpty || user['userAvatar']!.contains('unsplash')
                ? Text(user['userName']![0].toUpperCase())
                : null,
          ),
          title: Text(user['userName']!),
          subtitle: const Text('Traveler'),
          onTap: () {
            close(context, '');
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => UserProfileScreen(
                  userId: user['userId']!,
                  userName: user['userName']!,
                ),
              ),
            );
          },
        );
      },
    );
  }
}