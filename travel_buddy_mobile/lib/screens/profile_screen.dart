import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/community_post_card.dart';
import '../services/api_service.dart';

import 'auth_status_screen.dart';
import 'app_permissions_screen.dart';
import 'app_settings_screen.dart';
import 'subscription_plans_screen.dart';
import 'auth_screen.dart';
import 'favorites_screen.dart';
import 'my_trips_screen.dart';
import 'help_support_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final user = appProvider.currentUser;
        
        return Scaffold(
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
              IconButton(
                icon: Icon(
                  appProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode,
                ),
                onPressed: () => appProvider.toggleDarkMode(),
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Profile Header (Compact)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        _ProfilePicture(user: user, radius: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      user?.username ?? 'Guest User',
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Color(AppConstants.colors['primary']!).withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      user?.tier.name.toUpperCase() ?? 'FREE',
                                      style: TextStyle(
                                        color: Color(AppConstants.colors['primary']!),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              if (user?.email != null)
                                Text(
                                  user!.email!,
                                  style: TextStyle(
                                    color: Color(AppConstants.colors['textSecondary']!),
                                    fontSize: 12,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.share, size: 18),
                          onPressed: () => _shareProfile(context, user),
                          style: IconButton.styleFrom(
                            minimumSize: const Size(32, 32),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit, size: 18),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => const EditProfileScreen(),
                              ),
                            );
                          },
                          style: IconButton.styleFrom(
                            minimumSize: const Size(32, 32),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Stats Cards
                Consumer<CommunityProvider>(
                  builder: (context, communityProvider, child) {
                    final userPosts = communityProvider.posts.where((post) => post.userId == (user?.mongoId ?? user?.uid ?? 'mobile_user')).length;
                    return Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.article,
                            count: userPosts,
                            label: 'Posts',
                            color: Colors.blue[400]!,
                            onTap: () => _showUserPosts(context, user),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FutureBuilder<int>(
                            future: _getFollowersCount(context, user),
                            builder: (context, snapshot) => _buildStatCard(
                              icon: Icons.people,
                              count: snapshot.data ?? 0,
                              label: 'Followers',
                              color: Colors.blue[400]!,
                              onTap: () => _showFollowers(context),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: FutureBuilder<int>(
                            future: _getFollowingCount(context, user),
                            builder: (context, snapshot) => _buildStatCard(
                              icon: Icons.person_add,
                              count: snapshot.data ?? 0,
                              label: 'Following',
                              color: Colors.purple[400]!,
                              onTap: () => _showFollowing(context),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.favorite,
                            count: appProvider.favoritePlaces.length,
                            label: 'Favorites',
                            color: Colors.red[400]!,
                            onTap: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (context) => const FavoritesScreen()),
                            ),
                          ),
                        ),

                      ],
                    );
                  },
                ),
                
                const SizedBox(height: 16),
                
                // Menu Items
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.favorite),
                        title: const Text('My Favorites'),
                        subtitle: Text('${appProvider.favoritePlaces.length} saved places'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const FavoritesScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.map),
                        title: const Text('My Trip Plans'),
                        subtitle: Text('${appProvider.tripPlans.length} saved plans'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const MyTripsScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.article),
                        title: const Text('My Posts'),
                        subtitle: const Text('View your travel posts'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => _showUserPosts(context, user),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.bookmark),
                        title: const Text('Saved Posts'),
                        subtitle: const Text('Your bookmarked content'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => _showBookmarkedPosts(context),
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.person),
                        title: const Text('Edit Profile'),
                        subtitle: const Text('Update your information'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const EditProfileScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.workspace_premium),
                        title: const Text('Subscription'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const SubscriptionPlansScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.security),
                        title: const Text('App Permissions'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const AppPermissionsScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.settings),
                        title: const Text('Settings'),
                        subtitle: const Text('App preferences & privacy'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const AppSettingsScreen(),
                            ),
                          );
                        },
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.help),
                        title: const Text('Help & Support'),
                        subtitle: const Text('FAQ, guides & contact'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const HelpSupportScreen(),
                            ),
                          );
                        },
                      ),
                      // Debug options (only in debug mode)
                      if (kDebugMode) ...[
                        const Divider(height: 1),

                        ListTile(
                          leading: const Icon(Icons.security),
                          title: const Text('Authorization Status'),
                          subtitle: const Text('Check auth methods & user data'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => const AuthStatusScreen(),
                              ),
                            );
                          },
                        ),
                      ],
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Sign Out Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      await appProvider.signOut();
                      if (context.mounted) {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => const AuthScreen(),
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(AppConstants.colors['error']!),
                    ),
                    child: const Text('Sign Out'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required int count,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 8),
              Text(
                count.toString(),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(label, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  void _showUserPosts(BuildContext context, user) {
    final communityProvider = context.read<CommunityProvider>();
    final userPosts = communityProvider.posts.where((post) => post.userId == (user?.mongoId ?? user?.uid ?? 'mobile_user')).toList();
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('My Posts'),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: userPosts.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.article_outlined, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No posts yet', style: TextStyle(fontSize: 18)),
                      Text('Share your travel experiences!'),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: userPosts.length,
                  itemBuilder: (context, index) {
                    return CommunityPostCard(post: userPosts[index]);
                  },
                ),
        ),
      ),
    );
  }

  void _showBookmarkedPosts(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Saved Posts'),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: FutureBuilder(
            future: context.read<ApiService>().getBookmarkedPosts(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              final bookmarkedPosts = snapshot.data ?? [];
              
              if (bookmarkedPosts.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bookmark_outline, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No saved posts', style: TextStyle(fontSize: 18)),
                      Text('Bookmark posts to save them here!'),
                    ],
                  ),
                );
              }
              
              return ListView.builder(
                itemCount: bookmarkedPosts.length,
                itemBuilder: (context, index) {
                  return CommunityPostCard(post: bookmarkedPosts[index]);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Future<int> _getSavedPostsCount(BuildContext context) async {
    try {
      final bookmarkedPosts = await context.read<ApiService>().getBookmarkedPosts();
      return bookmarkedPosts.length;
    } catch (e) {
      return 0;
    }
  }

  Future<int> _getFollowersCount(BuildContext context, user) async {
    if (user?.mongoId == null) return 0;
    try {
      final followers = await context.read<ApiService>().getFollowers(user.mongoId);
      return followers.length;
    } catch (e) {
      return 0;
    }
  }

  Future<int> _getFollowingCount(BuildContext context, user) async {
    if (user?.mongoId == null) return 0;
    try {
      final following = await context.read<ApiService>().getFollowing(user.mongoId);
      return following.length;
    } catch (e) {
      return 0;
    }
  }

  void _shareProfile(BuildContext context, user) {
    final profileText = '''Check out ${user?.username ?? 'this user'}'s Travel Buddy profile!

🌍 ${user?.username ?? 'Traveler'}
📧 ${user?.email ?? 'Travel enthusiast'}
🎯 ${user?.tier.toString().split('.').last.toUpperCase() ?? 'FREE'} Member

Join Travel Buddy and discover amazing places together!

#TravelBuddy #Travel #Explore''';

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Share Profile',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy Profile Link'),
              onTap: () {
                // Copy to clipboard
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Profile link copied!')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Profile Text'),
              onTap: () {
                Navigator.pop(context);
                // In production, use share_plus package
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Sharing profile...')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showFollowers(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Followers'),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.people_outline, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('No followers yet', style: TextStyle(fontSize: 18)),
                Text('Share your profile to get followers!'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showFollowing(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Following'),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.person_add_outlined, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('Not following anyone yet', style: TextStyle(fontSize: 18)),
                Text('Discover and follow other travelers!'),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfilePicture extends StatelessWidget {
  final dynamic user;
  final double radius;
  
  const _ProfilePicture({required this.user, required this.radius});
  
  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: Color(AppConstants.colors['primary']!),
      child: user?.profilePicture != null && user!.profilePicture!.isNotEmpty
          ? ClipOval(
              child: user.profilePicture!.startsWith('data:image')
                  ? Image.memory(
                      base64Decode(user.profilePicture!.split(',')[1]),
                      width: radius * 2,
                      height: radius * 2,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => _buildInitials(),
                    )
                  : Image.network(
                      user.profilePicture!,
                      width: radius * 2,
                      height: radius * 2,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => _buildInitials(),
                    ),
            )
          : _buildInitials(),
    );
  }
  
  Widget _buildInitials() {
    return Text(
      (user?.username?.substring(0, 1) ?? 'U').toUpperCase(),
      style: TextStyle(
        fontSize: radius * 0.8,
        color: Colors.white,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}