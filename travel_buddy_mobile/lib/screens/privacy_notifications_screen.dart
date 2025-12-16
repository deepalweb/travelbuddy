import 'package:flutter/material.dart';
import '../services/api_service.dart';

class PrivacyNotificationsScreen extends StatefulWidget {
  const PrivacyNotificationsScreen({super.key});

  @override
  State<PrivacyNotificationsScreen> createState() => _PrivacyNotificationsScreenState();
}

class _PrivacyNotificationsScreenState extends State<PrivacyNotificationsScreen> {
  String profileVisibility = 'public';
  bool hideTravel = false;
  bool hideActivity = false;
  bool emailNotifications = true;
  bool pushNotifications = true;
  bool tripNotifications = true;
  bool dealNotifications = true;
  bool communityNotifications = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final settings = await ApiService().getPrivacySettings();
      setState(() {
        profileVisibility = settings['profileVisibility'] ?? 'public';
        hideTravel = settings['hideTravel'] ?? false;
        hideActivity = settings['hideActivity'] ?? false;
        emailNotifications = settings['emailNotifications'] ?? true;
        pushNotifications = settings['pushNotifications'] ?? true;
        tripNotifications = settings['tripNotifications'] ?? true;
        dealNotifications = settings['dealNotifications'] ?? true;
        communityNotifications = settings['communityNotifications'] ?? true;
      });
    } catch (e) {
      // Ignore load errors
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy & Notifications')),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Privacy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Profile Visibility', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: profileVisibility,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'public', child: Text('Public - Anyone can see')),
                      DropdownMenuItem(value: 'private', child: Text('Private - Only you')),
                      DropdownMenuItem(value: 'friends', child: Text('Friends Only')),
                    ],
                    onChanged: (v) {
                      setState(() => profileVisibility = v!);
                      _saveSettings();
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Hide Travel History'),
                  subtitle: const Text('Don\'t show my trips publicly'),
                  value: hideTravel,
                  onChanged: (v) {
                    setState(() => hideTravel = v);
                    _saveSettings();
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Hide Activity'),
                  subtitle: const Text('Don\'t show my posts and reviews'),
                  value: hideActivity,
                  onChanged: (v) {
                    setState(() => hideActivity = v);
                    _saveSettings();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.email),
                  title: const Text('Email Notifications'),
                  value: emailNotifications,
                  onChanged: (v) {
                    setState(() => emailNotifications = v);
                    _saveSettings();
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.notifications),
                  title: const Text('Push Notifications'),
                  value: pushNotifications,
                  onChanged: (v) {
                    setState(() => pushNotifications = v);
                    _saveSettings();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('Trip Updates'),
                  subtitle: const Text('Notifications about your trips'),
                  value: tripNotifications,
                  onChanged: (v) {
                    setState(() => tripNotifications = v);
                    _saveSettings();
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Deals & Offers'),
                  subtitle: const Text('Special deals and promotions'),
                  value: dealNotifications,
                  onChanged: (v) {
                    setState(() => dealNotifications = v);
                    _saveSettings();
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Community Alerts'),
                  subtitle: const Text('Likes, comments, and follows'),
                  value: communityNotifications,
                  onChanged: (v) {
                    setState(() => communityNotifications = v);
                    _saveSettings();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Future<void> _saveSettings() async {
    try {
      await ApiService().updatePrivacySettings({
        'profileVisibility': profileVisibility,
        'hideTravel': hideTravel,
        'hideActivity': hideActivity,
        'emailNotifications': emailNotifications,
        'pushNotifications': pushNotifications,
        'tripNotifications': tripNotifications,
        'dealNotifications': dealNotifications,
        'communityNotifications': communityNotifications,
      });
    } catch (e) {
      // Ignore save errors
    }
  }
}
