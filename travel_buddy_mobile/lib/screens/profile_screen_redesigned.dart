import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import 'auth_screen.dart';
import 'edit_profile_screen.dart';
import 'travel_preferences_screen.dart';
import 'social_links_screen.dart';
import '../models/travel_style.dart';
import 'security_settings_screen.dart';
import 'subscription_plans_screen.dart';

class ProfileScreenRedesigned extends StatefulWidget {
  const ProfileScreenRedesigned({super.key});

  @override
  State<ProfileScreenRedesigned> createState() => _ProfileScreenRedesignedState();
}

class _ProfileScreenRedesignedState extends State<ProfileScreenRedesigned> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, int> _stats = {};
  bool _loadingStats = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadStats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    final user = context.read<AppProvider>().currentUser;
    if (user?.mongoId == null) return;
    
    try {
      final response = await ApiService().getUserStats();
      setState(() {
        _stats = {
          'posts': response['totalPosts'] ?? 0,
          'followers': response['followersCount'] ?? 0,
          'following': response['followingCount'] ?? 0,
          'visited': response['placesVisited'] ?? 0,
        };
        _loadingStats = false;
      });
    } catch (e) {
      setState(() => _loadingStats = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, _) {
        final user = appProvider.currentUser;
        
        return Scaffold(
          body: NestedScrollView(
            headerSliverBuilder: (context, innerBoxIsScrolled) => [
              SliverAppBar(
                expandedHeight: 280,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  background: _buildGradientHeader(user),
                ),
                actions: [
                  IconButton(
                    icon: Icon(appProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode),
                    onPressed: () => appProvider.toggleDarkMode(),
                  ),
                ],
                bottom: TabBar(
                  controller: _tabController,
                  tabs: const [
                    Tab(text: 'Overview'),
                    Tab(text: 'Personal'),
                    Tab(text: 'Preferences'),
                    Tab(text: 'Security'),
                  ],
                ),
              ),
            ],
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(appProvider),
                _buildPersonalTab(user),
                _buildPreferencesTab(appProvider),
                _buildSecurityTab(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGradientHeader(user) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.blue[700]!, Colors.purple[600]!],
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.white,
              child: user?.profilePicture != null
                  ? ClipOval(child: Image.network(user.profilePicture, width: 100, height: 100, fit: BoxFit.cover))
                  : Text(user?.username?[0].toUpperCase() ?? 'U', style: const TextStyle(fontSize: 40)),
            ),
            const SizedBox(height: 12),
            Text(
              user?.fullName ?? user?.username ?? 'Guest',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            Text(
              user?.email ?? '',
              style: const TextStyle(fontSize: 14, color: Colors.white70),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatBadge('Posts', _stats['posts'] ?? 0),
                _buildStatBadge('Followers', _stats['followers'] ?? 0),
                _buildStatBadge('Following', _stats['following'] ?? 0),
                _buildStatBadge('Visited', _stats['visited'] ?? 0),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBadge(String label, int count) {
    return Column(
      children: [
        Text(
          count.toString(),
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.white70),
        ),
      ],
    );
  }

  Widget _buildOverviewTab(AppProvider appProvider) {
    final travelStyle = appProvider.currentUser?.travelStyle;
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildCard(
          'Travel Personality',
          Icons.explore,
          Colors.purple,
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                travelStyle?.displayName ?? 'Not set',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(travelStyle?.description ?? 'Set your travel style to get personalized recommendations'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildCard(
          'Achievements',
          Icons.emoji_events,
          Colors.amber,
          Column(
            children: [
              _buildAchievement('🌍', 'Explorer', 'Visited 10+ places'),
              _buildAchievement('📸', 'Photographer', 'Shared 5+ posts'),
              _buildAchievement('⭐', 'Reviewer', 'Left 3+ reviews'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _buildCard(
          'Subscription',
          Icons.workspace_premium,
          Colors.blue,
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${appProvider.currentUser?.tier.name.toUpperCase() ?? 'FREE'} Plan',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('Upgrade to unlock premium features'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SubscriptionPlansScreen())),
                child: const Text('Upgrade Now'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalTab(user) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard('Full Name', user?.fullName ?? 'Not set', Icons.person),
        _buildInfoCard('Email', user?.email ?? 'Not set', Icons.email),
        _buildInfoCard('Phone', user?.phone ?? 'Not set', Icons.phone),
        _buildInfoCard('Status', user?.status ?? 'Not set', Icons.edit_note),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen())),
          icon: const Icon(Icons.edit),
          label: const Text('Edit Profile'),
        ),
      ],
    );
  }

  Widget _buildPreferencesTab(AppProvider appProvider) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildCard(
          'Budget Range',
          Icons.attach_money,
          Colors.green,
          const Text('Set your travel budget preferences'),
        ),
        const SizedBox(height: 16),
        _buildCard(
          'Travel Pace',
          Icons.speed,
          Colors.orange,
          const Text('Choose your preferred travel pace'),
        ),
        const SizedBox(height: 16),
        _buildCard(
          'Interests',
          Icons.favorite,
          Colors.red,
          const Text('Select your travel interests'),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TravelPreferencesScreen())),
          icon: const Icon(Icons.tune),
          label: const Text('Manage Preferences'),
        ),
      ],
    );
  }

  Widget _buildSecurityTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildInfoCard('Password', '••••••••', Icons.lock),
        _buildInfoCard('Two-Factor Auth', 'Disabled', Icons.security),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsScreen())),
          icon: const Icon(Icons.shield),
          label: const Text('Security Settings'),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () async {
            await context.read<AppProvider>().signOut();
            if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const AuthScreen()));
          },
          icon: const Icon(Icons.logout),
          label: const Text('Sign Out'),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
        ),
      ],
    );
  }

  Widget _buildCard(String title, IconData icon, Color color, Widget content) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 12),
            content,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String label, String value, IconData icon) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        subtitle: Text(value),
      ),
    );
  }

  Widget _buildAchievement(String emoji, String title, String description) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 32)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                Text(description, style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
