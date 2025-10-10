import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
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
import 'travel_style_selection_screen.dart';
import '../models/travel_style.dart';
import '../services/usage_tracking_service.dart';

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
                    final userPosts = communityProvider.posts.where((post) => post.userId == user?.mongoId).length;
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
                            icon: Icons.place,
                            count: appProvider.travelStats?.totalPlacesVisited ?? 0,
                            label: 'Visited',
                            color: Colors.green[400]!,
                            onTap: () => _showTravelInsights(context, appProvider),
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
                        leading: const Icon(Icons.explore),
                        title: const Text('Travel Style'),
                        subtitle: Text(appProvider.userTravelStyle?.displayName ?? 'Not set - tap to choose'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (appProvider.userTravelStyle != null)
                              Text(
                                appProvider.userTravelStyle!.emoji,
                                style: const TextStyle(fontSize: 16),
                              ),
                            const SizedBox(width: 8),
                            const Icon(Icons.chevron_right),
                          ],
                        ),
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const TravelStyleSelectionScreen(),
                            ),
                          );
                        },
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
    final userPosts = communityProvider.posts.where((post) => post.userId == user?.mongoId).toList();
    
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
      useSafeArea: true,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text(
              'Share Profile',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy Profile Link'),
              onTap: () async {
                Navigator.pop(context);
                final profileUrl = 'https://travelbuddy.com/profile/${user?.mongoId ?? user?.uid}';
                try {
                  await Clipboard.setData(ClipboardData(text: profileUrl));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Profile link copied!')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Failed to copy link')),
                    );
                  }
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Profile Text'),
              onTap: () async {
                Navigator.pop(context);
                try {
                  await Share.share(profileText);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Sharing failed')),
                    );
                  }
                }
              },
            ),
            SafeArea(
              child: SizedBox(height: 16),
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
          body: FutureBuilder(
            future: _getFollowersCount(context, context.read<AppProvider>().currentUser),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.people_outline, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('No followers yet', style: TextStyle(fontSize: 18)),
                    Text('Share your profile to get followers!'),
                  ],
                ),
              );
            },
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
          body: FutureBuilder(
            future: _getFollowingCount(context, context.read<AppProvider>().currentUser),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.person_add_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('Not following anyone yet', style: TextStyle(fontSize: 18)),
                    Text('Discover and follow other travelers!'),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
  
  void _showTravelInsights(BuildContext context, AppProvider appProvider) {
    final travelStats = appProvider.travelStats;
    final userInsights = UsageTrackingService().getUserInsights();
    
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const Text('Travel Insights'),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Travel Statistics
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your Travel Statistics',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildInsightCard(
                                'Places Visited',
                                '${travelStats?.totalPlacesVisited ?? 0}',
                                Icons.place,
                                Colors.green,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildInsightCard(
                                'This Month',
                                '${travelStats?.placesVisitedThisMonth ?? 0}',
                                Icons.calendar_today,
                                Colors.blue,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: _buildInsightCard(
                                'Distance',
                                '${travelStats?.totalDistanceKm.toStringAsFixed(1) ?? '0.0'}km',
                                Icons.route,
                                Colors.orange,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildInsightCard(
                                'Streak',
                                '${travelStats?.currentStreak ?? 0} days',
                                Icons.local_fire_department,
                                Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Preferences
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Your Preferences',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 16),
                        ListTile(
                          leading: Icon(Icons.explore, color: Colors.blue[600]),
                          title: const Text('Travel Style'),
                          subtitle: Text(appProvider.userTravelStyle?.displayName ?? 'Not set'),
                          trailing: Text(appProvider.userTravelStyle?.emoji ?? '🗺️'),
                        ),
                        ListTile(
                          leading: Icon(Icons.category, color: Colors.purple[600]),
                          title: const Text('Favorite Category'),
                          subtitle: Text(travelStats?.favoriteCategory ?? 'Exploring'),
                          trailing: const Icon(Icons.star),
                        ),
                        ListTile(
                          leading: Icon(Icons.favorite, color: Colors.red[600]),
                          title: const Text('Saved Places'),
                          subtitle: Text('${appProvider.favoritePlaces.length} favorites'),
                          trailing: const Icon(Icons.bookmark),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildInsightCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            title,
            style: const TextStyle(fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
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
              child: _buildProfileImage(),
            )
          : _buildInitials(),
    );
  }
  
  Widget _buildProfileImage() {
    final profilePicture = user.profilePicture!;
    
    try {
      if (profilePicture.startsWith('data:image')) {
        return Image.memory(
          base64Decode(profilePicture.split(',')[1]),
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('❌ [PROFILE] Base64 image error: $error');
            return _buildInitials();
          },
        );
      } else if (profilePicture.startsWith('http')) {
        return Image.network(
          profilePicture,
          width: radius * 2,
          height: radius * 2,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            print('❌ [PROFILE] Network image error: $error');
            return _buildInitials();
          },
        );
      } else {
        // Local file path - use placeholder instead
        print('⚠️ [PROFILE] Local file detected, using initials: $profilePicture');
        return _buildInitials();
      }
    } catch (e) {
      print('❌ [PROFILE] Image loading error: $e');
      return _buildInitials();
    }
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