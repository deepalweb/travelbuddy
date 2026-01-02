import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';

class AdvancedPrivacyScreen extends StatefulWidget {
  const AdvancedPrivacyScreen({super.key});

  @override
  State<AdvancedPrivacyScreen> createState() => _AdvancedPrivacyScreenState();
}

class _AdvancedPrivacyScreenState extends State<AdvancedPrivacyScreen> {
  bool _isLoading = true;
  
  // Profile Visibility
  bool _profilePublic = true;
  bool _showEmail = false;
  bool _showPhone = false;
  bool _showLocation = true;
  
  // Activity Privacy
  bool _showTravelHistory = true;
  bool _showFavorites = true;
  bool _showPosts = true;
  bool _showFollowers = true;
  
  // Search & Discovery
  bool _allowSearch = true;
  bool _allowRecommendations = true;
  bool _showInNearby = true;
  
  // Data Sharing
  bool _shareAnalytics = true;
  bool _shareWithPartners = false;
  bool _personalizedAds = false;

  @override
  void initState() {
    super.initState();
    _loadPrivacySettings();
  }

  Future<void> _loadPrivacySettings() async {
    try {
      final settings = await ApiService().getPrivacySettings();
      if (mounted) {
        setState(() {
          _profilePublic = settings['profilePublic'] ?? true;
          _showEmail = settings['showEmail'] ?? false;
          _showPhone = settings['showPhone'] ?? false;
          _showLocation = settings['showLocation'] ?? true;
          _showTravelHistory = settings['showTravelHistory'] ?? true;
          _showFavorites = settings['showFavorites'] ?? true;
          _showPosts = settings['showPosts'] ?? true;
          _showFollowers = settings['showFollowers'] ?? true;
          _allowSearch = settings['allowSearch'] ?? true;
          _allowRecommendations = settings['allowRecommendations'] ?? true;
          _showInNearby = settings['showInNearby'] ?? true;
          _shareAnalytics = settings['shareAnalytics'] ?? true;
          _shareWithPartners = settings['shareWithPartners'] ?? false;
          _personalizedAds = settings['personalizedAds'] ?? false;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    try {
      await ApiService().updatePrivacySettings({
        'profilePublic': _profilePublic,
        'showEmail': _showEmail,
        'showPhone': _showPhone,
        'showLocation': _showLocation,
        'showTravelHistory': _showTravelHistory,
        'showFavorites': _showFavorites,
        'showPosts': _showPosts,
        'showFollowers': _showFollowers,
        'allowSearch': _allowSearch,
        'allowRecommendations': _allowRecommendations,
        'showInNearby': _showInNearby,
        'shareAnalytics': _shareAnalytics,
        'shareWithPartners': _shareWithPartners,
        'personalizedAds': _personalizedAds,
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Privacy settings saved'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Advanced Privacy')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Advanced Privacy'),
        actions: [
          TextButton(
            onPressed: _saveSettings,
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSection(
            'Profile Visibility',
            Icons.visibility,
            Colors.blue,
            [
              _buildSwitch('Public Profile', _profilePublic, (v) => setState(() => _profilePublic = v),
                subtitle: 'Anyone can view your profile'),
              _buildSwitch('Show Email', _showEmail, (v) => setState(() => _showEmail = v)),
              _buildSwitch('Show Phone', _showPhone, (v) => setState(() => _showPhone = v)),
              _buildSwitch('Show Location', _showLocation, (v) => setState(() => _showLocation = v)),
            ],
          ),
          
          _buildSection(
            'Activity Privacy',
            Icons.timeline,
            Colors.green,
            [
              _buildSwitch('Show Travel History', _showTravelHistory, (v) => setState(() => _showTravelHistory = v)),
              _buildSwitch('Show Favorites', _showFavorites, (v) => setState(() => _showFavorites = v)),
              _buildSwitch('Show Posts', _showPosts, (v) => setState(() => _showPosts = v)),
              _buildSwitch('Show Followers', _showFollowers, (v) => setState(() => _showFollowers = v)),
            ],
          ),
          
          _buildSection(
            'Search & Discovery',
            Icons.search,
            Colors.purple,
            [
              _buildSwitch('Allow Search', _allowSearch, (v) => setState(() => _allowSearch = v),
                subtitle: 'Let others find you by name'),
              _buildSwitch('Allow Recommendations', _allowRecommendations, (v) => setState(() => _allowRecommendations = v),
                subtitle: 'Appear in suggested travelers'),
              _buildSwitch('Show in Nearby', _showInNearby, (v) => setState(() => _showInNearby = v),
                subtitle: 'Visible to nearby travelers'),
            ],
          ),
          
          _buildSection(
            'Data Sharing',
            Icons.share,
            Colors.orange,
            [
              _buildSwitch('Share Analytics', _shareAnalytics, (v) => setState(() => _shareAnalytics = v),
                subtitle: 'Help improve the app'),
              _buildSwitch('Share with Partners', _shareWithPartners, (v) => setState(() => _shareWithPartners = v),
                subtitle: 'For better travel deals'),
              _buildSwitch('Personalized Ads', _personalizedAds, (v) => setState(() => _personalizedAds = v),
                subtitle: 'Relevant advertisements'),
            ],
          ),
          
          const SizedBox(height: 24),
          Card(
            color: Colors.red.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.warning, color: Colors.red, size: 32),
                  const SizedBox(height: 8),
                  const Text('Danger Zone', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: _exportData,
                    icon: const Icon(Icons.download),
                    label: const Text('Export My Data'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                  ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: _deleteAccount,
                    icon: const Icon(Icons.delete_forever),
                    label: const Text('Delete Account'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, Color color, List<Widget> children) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
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
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildSwitch(String title, bool value, Function(bool) onChanged, {String? subtitle}) {
    return SwitchListTile(
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey[600])) : null,
      value: value,
      onChanged: onChanged,
      contentPadding: EdgeInsets.zero,
    );
  }

  Future<void> _exportData() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Data'),
        content: const Text('Download all your data in JSON format?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Export')),
        ],
      ),
    );
    
    if (confirm == true) {
      try {
        await ApiService().exportUserData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Data export started. Check your email.'), backgroundColor: Colors.green),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Export failed: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }

  Future<void> _deleteAccount() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text('This action is permanent. All your data will be deleted. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
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
        await ApiService().deleteAccount();
        if (mounted) {
          final appProvider = context.read<AppProvider>();
          await appProvider.signOut();
          Navigator.of(context).pushNamedAndRemoveUntil('/auth', (route) => false);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }
  }
}
