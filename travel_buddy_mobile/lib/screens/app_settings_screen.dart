import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class AppSettingsScreen extends StatefulWidget {
  const AppSettingsScreen({super.key});

  @override
  State<AppSettingsScreen> createState() => _AppSettingsScreenState();
}

class _AppSettingsScreenState extends State<AppSettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSection(
                'Appearance',
                [
                  _buildSwitchTile(
                    'Dark Mode',
                    'Use dark theme',
                    Icons.dark_mode,
                    appProvider.isDarkMode,
                    (value) => appProvider.toggleDarkMode(),
                  ),
                ],
              ),
              _buildSection(
                'Notifications',
                [
                  _buildSwitchTile(
                    'Push Notifications',
                    'Receive travel alerts and updates',
                    Icons.notifications,
                    appProvider.notificationsEnabled,
                    (value) => appProvider.setNotifications(value),
                  ),
                  _buildSwitchTile(
                    'Deal Alerts',
                    'Get notified about travel deals',
                    Icons.local_offer,
                    appProvider.dealAlertsEnabled,
                    (value) => appProvider.setDealAlerts(value),
                  ),
                ],
              ),
              _buildSection(
                'Location',
                [
                  _buildTile(
                    'Search Radius',
                    '${appProvider.selectedRadius ~/ 1000} km',
                    Icons.location_searching,
                    () => _showRadiusDialog(appProvider),
                  ),
                ],
              ),
              _buildSection(
                'Data & Storage',
                [
                  _buildTile(
                    'Clear Cache',
                    'Free up storage space',
                    Icons.cleaning_services,
                    () => _clearCache(appProvider),
                  ),
                  _buildTile(
                    'Refresh Places',
                    'Force reload nearby places',
                    Icons.refresh,
                    () => _refreshPlaces(appProvider),
                  ),
                ],
              ),
              _buildSection(
                'About',
                [
                  _buildTile(
                    'App Version',
                    '1.0.0',
                    Icons.info,
                    null,
                  ),
                  _buildTile(
                    'Privacy Policy',
                    'View privacy policy',
                    Icons.privacy_tip,
                    () => _showPrivacyPolicy(),
                  ),
                  _buildTile(
                    'Terms of Service',
                    'View terms of service',
                    Icons.description,
                    () => _showTermsOfService(),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Card(
          child: Column(children: children),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildSwitchTile(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    Function(bool) onChanged,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: Switch(
        value: value,
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildTile(
    String title,
    String subtitle,
    IconData icon,
    VoidCallback? onTap,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: onTap != null ? const Icon(Icons.chevron_right) : null,
      onTap: onTap,
    );
  }

  void _showRadiusDialog(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search Radius'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [5, 10, 20, 50, 100].map((km) {
            final radius = km * 1000;
            return RadioListTile<int>(
              title: Text('$km km'),
              value: radius,
              groupValue: appProvider.selectedRadius,
              onChanged: (value) {
                if (value != null) {
                  appProvider.setSelectedRadius(value);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _clearCache(AppProvider appProvider) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text('This will clear all cached data. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await appProvider.clearCache();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache cleared successfully')),
              );
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _refreshPlaces(AppProvider appProvider) async {
    await appProvider.forceRefreshPlaces();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Places refreshed')),
    );
  }

  void _showPrivacyPolicy() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Privacy Policy'),
        content: const SingleChildScrollView(
          child: Text(
            'Travel Buddy Privacy Policy\n\n'
            'We collect location data to provide nearby places and navigation features. '
            'Your data is stored securely and never shared without consent.\n\n'
            'For full privacy policy, visit our website.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showTermsOfService() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Terms of Service'),
        content: const SingleChildScrollView(
          child: Text(
            'Travel Buddy Terms of Service\n\n'
            'By using this app, you agree to our terms and conditions. '
            'The app is provided as-is for travel assistance purposes.\n\n'
            'For full terms, visit our website.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}