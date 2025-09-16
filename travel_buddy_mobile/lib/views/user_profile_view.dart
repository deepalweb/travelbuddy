import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sliver_tools/sliver_tools.dart';
import '../providers/user_profile_provider.dart';
import '../providers/community_provider.dart';
import '../models/user_profile.dart';
import '../models/community_post.dart';
import '../models/travel_enums.dart';
import '../widgets/loading_spinner.dart';
import '../widgets/post_grid_tile.dart';
import '../widgets/post_detail_view.dart';
import 'edit_profile_view.dart';

class UserProfileView extends StatelessWidget {
  final String? userId; // If null, shows current user's profile

  const UserProfileView({Key? key, this.userId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<UserProfileProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: LoadingSpinner());
          }

          if (provider.error != null) {
            return Center(child: Text(provider.error!));
          }

          final profile = userId != null
              ? provider.getUserProfile(userId!)
              : provider.currentUserProfile;

          if (profile == null) {
            return const Center(child: Text('Profile not found'));
          }

          return CustomScrollView(
            slivers: [
              _buildProfileHeader(context, profile as UserProfile),
              _buildStats(profile),
              _buildBadges(profile),
              _buildTravelInterests(profile),
              _buildPosts(profile),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, UserProfile profile) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      actions: [
        if (userId == null) // Show edit button only for current user's profile
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => EditProfileView(profile: profile),
                ),
              );
            },
          )
        else // Show follow/message buttons for other users
          PopupMenuButton(
            itemBuilder: (context) => [
              PopupMenuItem(
                child: ListTile(
                  leading: const Icon(Icons.person_add),
                  title: Text(profile.isFollowing ? 'Unfollow' : 'Follow'),
                  onTap: () {
                    Navigator.pop(context);
                    _toggleFollow(context, profile);
                  },
                ),
              ),
              const PopupMenuItem(
                child: ListTile(
                  leading: Icon(Icons.message),
                  title: Text('Message'),
                ),
              ),
              const PopupMenuItem(
                child: ListTile(
                  leading: Icon(Icons.share),
                  title: Text('Share Profile'),
                ),
              ),
            ],
          ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (profile.profileImage.isNotEmpty)
              Image.network(
                profile.profileImage,
                fit: BoxFit.cover,
              ),
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withOpacity(0.7),
                  ],
                ),
              ),
            ),
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Text(
                        profile.username,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (profile.isVerified)
                        const Padding(
                          padding: EdgeInsets.only(left: 8),
                          child: Icon(
                            Icons.verified,
                            color: Colors.blue,
                            size: 20,
                          ),
                        ),
                    ],
                  ),
                  if (profile.currentLocation.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            color: Colors.white70,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            profile.currentLocation,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStats(UserProfile profile) {
    return SliverToBoxAdapter(
      child: Column(
        children: [
          // Bio section
          if (profile.bio.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                profile.bio,
                style: const TextStyle(fontSize: 14),
                textAlign: TextAlign.center,
              ),
            ),
          
          // Follow/Following stats for other users
          if (userId != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Expanded(
                    child: _buildFollowButton(profile),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _sendMessage(profile),
                      child: const Text('Message'),
                    ),
                  ),
                ],
              ),
            ),
          
          // Stats row
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                GestureDetector(
                  onTap: () => _showFollowers(profile),
                  child: _buildStatItem('Followers', profile.followersCount.toString()),
                ),
                GestureDetector(
                  onTap: () => _showFollowing(profile),
                  child: _buildStatItem('Following', profile.followingCount.toString()),
                ),
                _buildStatItem('Posts', profile.stats.totalReviews.toString()),
                _buildStatItem('Countries', profile.stats.countriesVisited.toString()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildBadges(UserProfile profile) {
    if (profile.badges.isEmpty) return const SliverToBoxAdapter(child: SizedBox());

    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Badges',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: profile.badges.length,
              itemBuilder: (context, index) {
                final badge = profile.badges[index];
                return Tooltip(
                  message: badge.description,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Image.network(
                            badge.iconUrl,
                            width: 40,
                            height: 40,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            badge.name,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTravelInterests(UserProfile profile) {
    if (profile.travelInterests.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox());
    }

    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Travel Interests',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: profile.travelInterests.map((interest) {
                return Chip(
                  label: Text(
                    interest.toString().split('.').last,
                    style: const TextStyle(fontSize: 12),
                  ),
                  backgroundColor: Colors.blue[100],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPosts(UserProfile profile) {
    return SliverPadding(
      padding: const EdgeInsets.all(16),
      sliver: MultiSliver(
        children: [
          SliverToBoxAdapter(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Posts',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    // TODO: Navigate to all posts
                  },
                  child: const Text('See All'),
                ),
              ],
            ),
          ),
          const SliverPadding(padding: EdgeInsets.only(top: 16)),
          Consumer<CommunityProvider>(
            builder: (context, communityProvider, child) {
              final posts = communityProvider.posts
                  .where((post) => post.userId == profile.userId)
                  .toList();

              if (posts.isEmpty) {
                return SliverToBoxAdapter(
                  child: Center(
                    child: Text(
                      'No posts yet',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                      ),
                    ),
                  ),
                );
              }

              return SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 4,
                  crossAxisSpacing: 4,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final post = posts[index];
                    return GestureDetector(
                      onTap: () {
                        // TODO: Show post detail
                        showPostDetail(context, post);
                      },
                      child: PostGridTile(post: post),
                    );
                  },
                  childCount: posts.length,
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  void showPostDetail(BuildContext context, CommunityPost post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) {
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: PostDetailView(post: post),
          );
        },
      ),
    );
  }

  Widget _buildFollowButton(UserProfile profile) {
    return ElevatedButton(
      onPressed: () => _toggleFollow(context, profile),
      style: ElevatedButton.styleFrom(
        backgroundColor: profile.isFollowing ? Colors.grey[300] : Colors.blue[600],
        foregroundColor: profile.isFollowing ? Colors.black : Colors.white,
      ),
      child: Text(profile.isFollowing ? 'Following' : 'Follow'),
    );
  }

  void _toggleFollow(BuildContext context, UserProfile profile) async {
    final provider = context.read<UserProfileProvider>();
    try {
      if (profile.isFollowing) {
        await provider.unfollowUser(profile.userId);
      } else {
        await provider.followUser(profile.userId);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to update follow status: $e')),
      );
    }
  }

  void _sendMessage(UserProfile profile) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Messaging ${profile.username} - Feature coming soon!')),
    );
  }

  void _showFollowers(UserProfile profile) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _FollowersScreen(userId: profile.userId, title: 'Followers'),
      ),
    );
  }

  void _showFollowing(UserProfile profile) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _FollowersScreen(userId: profile.userId, title: 'Following'),
      ),
    );
  }
}

class _FollowersScreen extends StatelessWidget {
  final String userId;
  final String title;

  const _FollowersScreen({required this.userId, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: FutureBuilder<List<UserProfile>>(
        future: _getFollowList(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          final users = snapshot.data ?? [];
          
          if (users.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text('No $title yet', style: const TextStyle(fontSize: 18)),
                ],
              ),
            );
          }
          
          return ListView.builder(
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return ListTile(
                leading: CircleAvatar(
                  backgroundImage: user.profileImage.isNotEmpty 
                      ? NetworkImage(user.profileImage) 
                      : null,
                  child: user.profileImage.isEmpty 
                      ? Text(user.username[0].toUpperCase()) 
                      : null,
                ),
                title: Text(user.username),
                subtitle: user.currentLocation.isNotEmpty 
                    ? Text(user.currentLocation) 
                    : null,
                trailing: user.isFollowing 
                    ? const Text('Following', style: TextStyle(color: Colors.blue))
                    : null,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => UserProfileView(userId: user.userId),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  Future<List<UserProfile>> _getFollowList() async {
    // Mock data for now - replace with real API call
    await Future.delayed(const Duration(seconds: 1));
    return [];
  }
}
