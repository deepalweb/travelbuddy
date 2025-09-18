import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
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
            children: [
              // Appearance Section
              _buildSectionHeader('Appearance'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    SwitchListTile(
                      title: const Text('Dark Mode'),
                      subtitle: const Text('Use dark theme'),
                      value: appProvider.isDarkMode,
                      onChanged: (value) => appProvider.toggleDarkMode(),
                      secondary: Icon(
                        appProvider.isDarkMode ? Icons.dark_mode : Icons.light_mode,
                      ),
                    ),
                  ],
                ),
              ),

              // Location Section
              _buildSectionHeader('Location'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.location_on),
                      title: const Text('Location Services'),
                      subtitle: Text(
                        appProvider.currentLocation != null 
                          ? 'Enabled' 
                          : 'Disabled'
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        // Navigate to location settings
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.my_location),
                      title: const Text('Current Location'),
                      subtitle: Text(
                        appProvider.currentLocation != null
                          ? '${appProvider.currentLocation!.latitude.toStringAsFixed(4)}, ${appProvider.currentLocation!.longitude.toStringAsFixed(4)}'
                          : 'Not available'
                      ),
                      onTap: () async {
                        await appProvider.getCurrentLocation();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Location updated')),
                        );
                      },
                    ),
                  ],
                ),
              ),

              // Notifications Section
              _buildSectionHeader('Notifications'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    SwitchListTile(
                      title: const Text('Push Notifications'),
                      subtitle: const Text('Receive travel updates'),
                      value: appProvider.notificationsEnabled,
                      onChanged: (value) => appProvider.setNotifications(value),
                      secondary: const Icon(Icons.notifications),
                    ),
                    const Divider(height: 1),
                    SwitchListTile(
                      title: const Text('Deal Alerts'),
                      subtitle: const Text('Get notified about new deals'),
                      value: appProvider.dealAlertsEnabled,
                      onChanged: (value) => appProvider.setDealAlerts(value),
                      secondary: const Icon(Icons.local_offer),
                    ),
                  ],
                ),
              ),

              // Data & Privacy Section
              _buildSectionHeader('Data & Privacy'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.storage),
                      title: const Text('Clear Cache'),
                      subtitle: const Text('Free up storage space'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _showClearCacheDialog(appProvider),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.privacy_tip),
                      title: const Text('Privacy Policy'),
                      trailing: const Icon(Icons.open_in_new),
                      onTap: () {
                        // TODO: Open privacy policy
                      },
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.description),
                      title: const Text('Terms of Service'),
                      trailing: const Icon(Icons.open_in_new),
                      onTap: () {
                        // TODO: Open terms of service
                      },
                    ),
                  ],
                ),
              ),

              // Developer Section
              _buildSectionHeader('Developer'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.bug_report),
                      title: const Text('Backend Test'),
                      subtitle: const Text('Test backend connectivity'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        Navigator.of(context).pushNamed('/backend-test');
                      },
                    ),
                  ],
                ),
              ),

              // About Section
              _buildSectionHeader('About'),
              Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.info),
                      title: const Text('App Version'),
                      subtitle: const Text('1.0.0'),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.feedback),
                      title: const Text('Send Feedback'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        // TODO: Open feedback form
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
        ),
      ),
    );
  }

  void _showClearCacheDialog(AppProvider appProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text('This will clear all cached data including images and API responses. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
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
}