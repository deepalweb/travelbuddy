import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../providers/app_provider.dart';
import '../services/auth_service.dart';

class AuthStatusScreen extends StatefulWidget {
  const AuthStatusScreen({super.key});

  @override
  State<AuthStatusScreen> createState() => _AuthStatusScreenState();
}

class _AuthStatusScreenState extends State<AuthStatusScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Authorization Status'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Consumer<AppProvider>(
        builder: (context, appProvider, child) {
          final user = appProvider.currentUser;
          final firebaseUser = FirebaseAuth.instance.currentUser;
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildAuthStatusCard(appProvider.isAuthenticated),
                const SizedBox(height: 16),
                _buildCurrentUserCard(user),
                const SizedBox(height: 16),
                _buildFirebaseUserCard(firebaseUser),
                const SizedBox(height: 16),
                _buildAuthMethodsCard(),
                const SizedBox(height: 16),
                _buildPermissionsCard(),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildAuthStatusCard(bool isAuthenticated) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isAuthenticated ? Icons.check_circle : Icons.cancel,
                  color: isAuthenticated ? Colors.green : Colors.red,
                ),
                const SizedBox(width: 8),
                Text(
                  'Authentication Status',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
              style: TextStyle(
                color: isAuthenticated ? Colors.green : Colors.red,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentUserCard(user) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Current User (App)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (user != null) ...[
              _buildInfoRow('Username', user.username),
              _buildInfoRow('Email', user.email ?? 'Not provided'),
              _buildInfoRow('Subscription', user.tier.toString().split('.').last.toUpperCase()),
              _buildInfoRow('Profile Picture', user.profilePicture != null ? 'Set' : 'Not set'),
              _buildInfoRow('MongoDB ID', user.mongoId ?? 'Not set'),
            ] else ...[
              const Text('No user data available', style: TextStyle(color: Colors.grey)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFirebaseUserCard(User? firebaseUser) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Firebase User',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (firebaseUser != null) ...[
              _buildInfoRow('UID', firebaseUser.uid),
              _buildInfoRow('Display Name', firebaseUser.displayName ?? 'Not set'),
              _buildInfoRow('Email', firebaseUser.email ?? 'Not provided'),
              _buildInfoRow('Email Verified', firebaseUser.emailVerified ? 'Yes' : 'No'),
              _buildInfoRow('Photo URL', firebaseUser.photoURL != null ? 'Set' : 'Not set'),
              _buildInfoRow('Provider', _getProviderInfo(firebaseUser)),
              _buildInfoRow('Created', firebaseUser.metadata.creationTime?.toString() ?? 'Unknown'),
              _buildInfoRow('Last Sign In', firebaseUser.metadata.lastSignInTime?.toString() ?? 'Unknown'),
            ] else ...[
              const Text('No Firebase user', style: TextStyle(color: Colors.grey)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAuthMethodsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Available Auth Methods',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildAuthMethodRow('Email/Password', Icons.email, true),
            _buildAuthMethodRow('Google Sign-In', Icons.login, true),
            _buildAuthMethodRow('Anonymous', Icons.person_outline, false),
            _buildAuthMethodRow('Phone', Icons.phone, false),
            _buildAuthMethodRow('Apple Sign-In', Icons.apple, false),
          ],
        ),
      ),
    );
  }

  Widget _buildPermissionsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'App Permissions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildPermissionRow('Location', Icons.location_on, true),
            _buildPermissionRow('Camera', Icons.camera_alt, true),
            _buildPermissionRow('Storage', Icons.storage, true),
            _buildPermissionRow('Notifications', Icons.notifications, true),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontFamily: 'monospace'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAuthMethodRow(String method, IconData icon, bool available) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: available ? Colors.green : Colors.grey),
          const SizedBox(width: 8),
          Text(method),
          const Spacer(),
          Text(
            available ? 'Available' : 'Not implemented',
            style: TextStyle(
              color: available ? Colors.green : Colors.grey,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPermissionRow(String permission, IconData icon, bool granted) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: granted ? Colors.green : Colors.orange),
          const SizedBox(width: 8),
          Text(permission),
          const Spacer(),
          Text(
            granted ? 'Granted' : 'Pending',
            style: TextStyle(
              color: granted ? Colors.green : Colors.orange,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  String _getProviderInfo(User user) {
    final providers = user.providerData.map((info) => info.providerId).toList();
    if (providers.contains('google.com')) return 'Google';
    if (providers.contains('password')) return 'Email/Password';
    return providers.isNotEmpty ? providers.first : 'Unknown';
  }
}