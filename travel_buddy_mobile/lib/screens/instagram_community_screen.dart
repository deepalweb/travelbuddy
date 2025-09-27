import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../widgets/instagram_post_card.dart';
import '../widgets/instagram_stories.dart';
import 'create_post_screen.dart';

class InstagramCommunityScreen extends StatefulWidget {
  const InstagramCommunityScreen({super.key});

  @override
  State<InstagramCommunityScreen> createState() => _InstagramCommunityScreenState();
}

class _InstagramCommunityScreenState extends State<InstagramCommunityScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadPosts(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: _buildAppBar(),
      body: _buildBody(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      title: const Text(
        'TravelBuddy',
        style: TextStyle(
          color: Colors.black,
          fontSize: 24,
          fontWeight: FontWeight.w600,
          fontFamily: 'Billabong',
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.favorite_border, color: Colors.black, size: 26),
          onPressed: () {},
        ),
        IconButton(
          icon: const Icon(Icons.send_outlined, color: Colors.black, size: 26),
          onPressed: () {},
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

  Widget _buildBody() {
    return Consumer2<AppProvider, CommunityProvider>(
      builder: (context, appProvider, communityProvider, child) {
        if (!appProvider.isAuthenticated) {
          return _buildUnauthenticatedView();
        }

        return RefreshIndicator(
          onRefresh: () => communityProvider.loadPosts(refresh: true),
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
                          communityProvider.loadPosts();
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
}