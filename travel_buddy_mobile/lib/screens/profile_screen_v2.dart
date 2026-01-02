import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:convert';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../constants/app_constants.dart';
import '../services/api_service.dart';

import 'auth_status_screen.dart';
import 'app_permissions_screen.dart';
import 'app_settings_screen.dart';
import 'subscription_plans_screen.dart';
import 'auth_screen.dart';
import 'favorites_screen.dart';
import 'help_support_screen.dart';
import 'edit_profile_screen.dart';
import 'travel_style_selection_screen.dart';
import 'profile_picture_upload_screen.dart';
import 'travel_preferences_screen.dart';
import 'social_links_screen.dart';
import 'security_settings_screen.dart';
import 'privacy_notifications_screen.dart';
import '../widgets/profile_completion_widget.dart';

class ProfileScreenV2 extends StatefulWidget {
  final bool previewMode;
  
  const ProfileScreenV2({super.key, this.previewMode = false});

  @override
  State<ProfileScreenV2> createState() => _ProfileScreenV2State();
}

class _ProfileScreenV2State extends State<ProfileScreenV2> {
  Map<String, int>? _cachedStats;
  List<Map<String, dynamic>> _badges = [];
  List<Map<String, dynamic>> _activities = [];
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() => _isLoadingStats = true);
    
    final appProvider = context.read<AppProvider>();
    final stats = await _getBatchedStats(appProvider.currentUser);
    final badges = await _loadBadges(appProvider.currentUser);
    final activities = await _loadActivities(appProvider.currentUser);
    
    if (mounted) {
      setState(() {
        _cachedStats = stats;
        _badges = badges;
        _activities = activities;
        _isLoadingStats = false;
      });
    }
  }

  Future<Map<String, int>> _getBatchedStats(user) async {
    try {
      final response = await ApiService().getUserStats();
      return {
        'posts': response['totalPosts'] ?? 0,
        'followers': response['followersCount'] ?? 0,
        'following': response['followingCount'] ?? 0,
        'visited': response['placesVisited'] ?? 0,
      };
    } catch (e) {
      return {'posts': 0, 'followers': 0, 'following': 0, 'visited': 0};
    }
  }

  Future<List<Map<String, dynamic>>> _loadBadges(user) async {
    final stats = _cachedStats ?? await _getBatchedStats(user);
    final badges = <Map<String, dynamic>>[];
    
    if (stats['visited']! >= 5) badges.add({'icon': '🌍', 'title': 'Explorer', 'desc': 'Visited 5+ places'});
    if (stats['posts']! >= 10) badges.add({'icon': '📸', 'title': 'Storyteller', 'desc': '10+ posts shared'});
    if (stats['followers']! >= 50) badges.add({'icon': '⭐', 'title': 'Influencer', 'desc': '50+ followers'});
    if (stats['visited']! >= 20) badges.add({'icon': '🏆', 'title': 'Adventurer', 'desc': '20+ places visited'});
    
    return badges;
  }

  Future<List<Map<String, dynamic>>> _loadActivities(user) async {
    if (user?.mongoId == null) return [];
    
    try {
      final response = await ApiService().getUserStats();
      final activities = <Map<String, dynamic>>[];
      
      // Recent posts
      if (response['totalPosts'] != null && response['totalPosts'] > 0) {
        activities.add({
          'icon': Icons.article,
          'text': 'Posted ${response['totalPosts']} travel stories',
          'time': 'Recently',
          'color': Colors.blue,
        });
      }
      
      // Followers gained
      if (response['followersCount'] != null && response['followersCount'] > 0) {
        activities.add({
          'icon': Icons.person_add,
          'text': 'Gained ${response['followersCount']} followers',
          'time': 'This month',
          'color': Colors.purple,
        });
      }
      
      // Places visited
      if (response['placesVisited'] != null && response['placesVisited'] > 0) {
        activities.add({
          'icon': Icons.place,
          'text': 'Visited ${response['placesVisited']} places',
          'time': 'All time',
          'color': Colors.green,
        });
      }
      
      // Following
      if (response['followingCount'] != null && response['followingCount'] > 0) {
        activities.add({
          'icon': Icons.people,
          'text': 'Following ${response['followingCount']} travelers',
          'time': 'Active',
          'color': Colors.orange,
        });
      }
      
      return activities.take(4).toList();
    } catch (e) {
      print('❌ Error loading activities: $e');
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final user = appProvider.currentUser;
        
        return Scaffold(
          appBar: AppBar(
            title: Text(widget.previewMode ? 'Profile Preview' : 'Profile'),
            actions: widget.previewMode ? null : [
              IconButton(
                icon: const Icon(Icons.visibility),
                tooltip: 'Preview Profile',
                onPressed: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => const ProfileScreenV2(previewMode: true),
                )),
              ),
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadProfileData,
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _loadProfileData,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (!widget.previewMode) ProfileCompletionWidget(user: user, onTap: () {}),
                  const SizedBox(height: 16),
                  
                  // Profile Header
                  _buildProfileHeader(user, appProvider),
                  const SizedBox(height: 16),
                  
                  // Badges Section
                  if (_badges.isNotEmpty) ...[
                    _buildBadgesSection(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Activity Timeline
                  if (!widget.previewMode && _activities.isNotEmpty) ...[
                    _buildActivityTimeline(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Analytics Card
                  if (!widget.previewMode) ...[
                    _buildAnalyticsCard(),
                    const SizedBox(height: 16),
                  ],
                  
                  // Organized Menu
                  if (!widget.previewMode) _buildOrganizedMenu(appProvider),
                  
                  if (!widget.previewMode) ...[
                    const SizedBox(height: 16),
                    _buildSignOutButton(appProvider),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildProfileHeader(user, AppProvider appProvider) {
    final stats = _cachedStats ?? {'posts': 0, 'followers': 0, 'following': 0, 'visited': 0};
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: widget.previewMode ? null : () => Navigator.push(context, 
                    MaterialPageRoute(builder: (_) => const ProfilePictureUploadScreen())),
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.blue,
                        child: Text(user?.username?[0]?.toUpperCase() ?? 'U',
                          style: const TextStyle(fontSize: 32, color: Colors.white)),
                      ),
                      if (!widget.previewMode)
                        Positioned(
                          bottom: 0, right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle),
                            child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? user?.username ?? 'Guest',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      Text(user?.email ?? '', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text('${user?.tier.name.toUpperCase() ?? 'FREE'} PLAN',
                              style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (!widget.previewMode)
                  IconButton(icon: const Icon(Icons.share), onPressed: () => _shareProfile(user)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatColumn(Icons.article, stats['posts']!, 'Posts', _isLoadingStats),
                _buildStatColumn(Icons.people, stats['followers']!, 'Followers', _isLoadingStats),
                _buildStatColumn(Icons.person_add, stats['following']!, 'Following', _isLoadingStats),
                _buildStatColumn(Icons.place, stats['visited']!, 'Visited', _isLoadingStats),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatColumn(IconData icon, int count, String label, bool loading) {
    return Column(
      children: [
        Icon(icon, size: 24, color: Colors.blue),
        const SizedBox(height: 4),
        loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
          : Text('$count', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildBadgesSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.emoji_events, color: Colors.amber),
                SizedBox(width: 8),
                Text('Achievements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: _badges.map((badge) => _buildBadge(badge)).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(Map<String, dynamic> badge) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.amber.shade100, Colors.orange.shade100]),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(badge['icon'], style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 6),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(badge['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              Text(badge['desc'], style: TextStyle(fontSize: 10, color: Colors.grey[700])),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActivityTimeline() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.timeline, color: Colors.blue),
                SizedBox(width: 8),
                Text('Recent Activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            ..._activities.take(4).map((activity) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (activity['color'] as Color).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(activity['icon'], size: 16, color: activity['color']),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(activity['text'], style: const TextStyle(fontSize: 14)),
                        Text(activity['time'], style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsCard() {
    final stats = _cachedStats ?? {'posts': 0, 'followers': 0, 'following': 0, 'visited': 0};
    final totalEngagement = stats['posts']! + stats['followers']! + stats['visited']!;
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.analytics, color: Colors.purple),
                SizedBox(width: 8),
                Text('Profile Analytics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildAnalyticTile('Total Engagement', '$totalEngagement', Colors.purple)),
                const SizedBox(width: 12),
                Expanded(child: _buildAnalyticTile('Avg. Posts/Week', '${(stats['posts']! / 4).toStringAsFixed(1)}', Colors.blue)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildAnalyticTile('Profile Views', '${stats['followers']! * 3}', Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _buildAnalyticTile('Engagement Rate', '${((stats['posts']! / (stats['followers']! + 1)) * 100).toStringAsFixed(0)}%', Colors.orange)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildOrganizedMenu(AppProvider appProvider) {
    return Card(
      child: Column(
        children: [
          ExpansionTile(
            leading: const Icon(Icons.favorite),
            title: const Text('My Content'),
            children: [
              ListTile(
                leading: const Icon(Icons.favorite_border),
                title: const Text('Favorites'),
                subtitle: Text('${appProvider.favoriteIds.length} places'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoritesScreen())),
              ),
              ListTile(
                leading: const Icon(Icons.bookmark_border),
                title: const Text('Saved Posts'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {},
              ),
            ],
          ),
          const Divider(height: 1),
          ExpansionTile(
            leading: const Icon(Icons.person),
            title: const Text('Profile Settings'),
            children: [
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Edit Profile'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen())),
              ),
              ListTile(
                leading: const Icon(Icons.explore),
                title: const Text('Travel Style'),
                subtitle: Text(appProvider.userTravelStyle?.displayName ?? 'Not set'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TravelStyleSelectionScreen())),
              ),
              ListTile(
                leading: const Icon(Icons.tune),
                title: const Text('Preferences'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TravelPreferencesScreen())),
              ),
            ],
          ),
          const Divider(height: 1),
          ExpansionTile(
            leading: const Icon(Icons.security),
            title: const Text('Security & Privacy'),
            children: [
              ListTile(
                leading: const Icon(Icons.lock),
                title: const Text('Security'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsScreen())),
              ),
              ListTile(
                leading: const Icon(Icons.privacy_tip),
                title: const Text('Privacy'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyNotificationsScreen())),
              ),
            ],
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.workspace_premium),
            title: const Text('Subscription'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionPlansScreen())),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.help),
            title: const Text('Help & Support'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HelpSupportScreen())),
          ),
        ],
      ),
    );
  }

  Widget _buildSignOutButton(AppProvider appProvider) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () async {
          await appProvider.signOut();
          if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AuthScreen()));
        },
        style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
        child: const Text('Sign Out'),
      ),
    );
  }

  void _shareProfile(user) {
    Share.share('Check out my Travel Buddy profile!\n\n🌍 ${user?.username ?? 'Traveler'}\n📧 ${user?.email ?? ''}\n\n#TravelBuddy');
  }
}
