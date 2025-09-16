import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../constants/app_constants.dart';
import '../widgets/community_post_card.dart';
import '../services/api_service.dart';
import 'backend_status_screen.dart';
import 'auth_status_screen.dart';
import 'app_permissions_screen.dart';
import 'app_settings_screen.dart';
import 'subscription_plans_screen.dart';
import 'auth_screen.dart';
import 'permissions_screen.dart';
import 'subscription_screen.dart';
import 'favorites_screen.dart';
import 'my_trips_screen.dart';
import 'settings_screen.dart';
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
                // Profile Header
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Color(AppConstants.colors['primary']!),
                          child: user?.profilePicture != null && user!.profilePicture!.isNotEmpty
                              ? ClipOval(
                                  child: user.profilePicture!.startsWith('file://') || user.profilePicture!.startsWith('local://')
                                      ? Image.file(
                                          File(user.profilePicture!.startsWith('file://') 
                                              ? user.profilePicture!.replaceFirst('file://', '')
                                              : user.profilePicture!.replaceFirst('local://', '')),
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Text(
                                              (user.username?.substring(0, 1) ?? 'U').toUpperCase(),
                                              style: const TextStyle(
                                                fontSize: 32,
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            );
                                          },
                                        )
                                      : Image.network(
                                          user.profilePicture!,
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Text(
                                              (user.username?.substring(0, 1) ?? 'U').toUpperCase(),
                                              style: const TextStyle(
                                                fontSize: 32,
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            );
                                          },
                                        ),
                                )
                              : Text(
                                  (user?.username?.substring(0, 1) ?? 'U').toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 32,
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Text(
                                user?.username ?? 'Guest User',
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.share, size: 20),
                                  onPressed: () => _shareProfile(context, user),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.edit, size: 20),
                                  onPressed: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => const EditProfileScreen(),
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (user?.email != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            user!.email!,
                            style: TextStyle(
                              color: Color(AppConstants.colors['textSecondary']!),
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Color(AppConstants.colors['primary']!).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                user?.tier.name.toUpperCase() ?? 'FREE',
                                style: TextStyle(
                                  color: Color(AppConstants.colors['primary']!),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                            if (user?.tier.name != 'free') ...[
                              const SizedBox(width: 8),
                              Icon(
                                Icons.verified,
                                size: 16,
                                color: Color(AppConstants.colors['primary']!),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Stats Cards
                Consumer<CommunityProvider>(
                  builder: (context, communityProvider, child) {
                    final userPosts = communityProvider.posts.where((post) => post.userId == 'mobile_user').length;
                    return Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.article,
                            count: userPosts,
                            label: 'Posts',
                            color: Colors.blue[400]!,
                            onTap: () => _showUserPosts(context),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.people,
                            count: 0, // TODO: Get real followers count
                            label: 'Followers',
                            color: Colors.blue[400]!,
                            onTap: () => _showFollowers(context),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildStatCard(
                            icon: Icons.person_add,
                            count: 0, // TODO: Get real following count
                            label: 'Following',
                            color: Colors.purple[400]!,
                            onTap: () => _showFollowing(context),
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
                        onTap: () => _showUserPosts(context),
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
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.developer_mode),
                        title: const Text('Backend Status'),
                        subtitle: const Text('Check API connectivity'),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const BackendStatusScreen(),
                            ),
                          );
                        },
                      ),
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

  void _showUserPosts(BuildContext context) {
    final communityProvider = context.read<CommunityProvider>();
    final userPosts = communityProvider.posts.where((post) => post.userId == 'mobile_user').toList();
    
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