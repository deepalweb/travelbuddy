import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import '../services/auth_service.dart';

class AuthStatusScreen extends StatefulWidget {
  const AuthStatusScreen({super.key});

  @override
  State<AuthStatusScreen> createState() => _AuthStatusScreenState();
}

class _AuthStatusScreenState extends State<AuthStatusScreen> {
  bool _isCheckingAuth = true;
  String _authStatus = 'Checking authentication...';
  Map<String, dynamic> _authDetails = {};

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final user = await AuthService.getCurrentUser();
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      
      setState(() {
        _isCheckingAuth = false;
        if (user != null) {
          _authStatus = 'Authenticated';
          _authDetails = {
            'Email': user.email ?? 'Not provided',
            'Display Name': user.displayName ?? 'Not set',
            'UID': user.uid,
            'Email Verified': user.emailVerified ? 'Yes' : 'No',
            'Provider': user.providerData.isNotEmpty 
                ? user.providerData.first.providerId 
                : 'Unknown',
            'App Provider Auth': appProvider.isAuthenticated ? 'Yes' : 'No',
            'Current User': appProvider.currentUser?.username ?? 'Not loaded',
          };
        } else {
          _authStatus = 'Not authenticated';
          _authDetails = {
            'Firebase User': 'null',
            'App Provider Auth': appProvider.isAuthenticated ? 'Yes' : 'No',
          };
        }
      });
    } catch (e) {
      setState(() {
        _isCheckingAuth = false;
        _authStatus = 'Error checking authentication';
        _authDetails = {'Error': e.toString()};
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Authentication Status'),
        backgroundColor: Color(AppConstants.colors['primary']!),
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          _authStatus == 'Authenticated' 
                              ? Icons.check_circle 
                              : _authStatus == 'Not authenticated'
                                  ? Icons.cancel
                                  : Icons.help,
                          color: _authStatus == 'Authenticated' 
                              ? Colors.green 
                              : _authStatus == 'Not authenticated'
                                  ? Colors.orange
                                  : Colors.red,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Status: $_authStatus',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (_isCheckingAuth) ...[
                      const SizedBox(height: 16),
                      const Center(child: CircularProgressIndicator()),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_authDetails.isNotEmpty) ...[
              const Text(
                'Authentication Details:',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: _authDetails.entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 120,
                              child: Text(
                                '${entry.key}:',
                                style: const TextStyle(fontWeight: FontWeight.w500),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                entry.value.toString(),
                                style: const TextStyle(color: Colors.grey),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _checkAuthStatus,
                icon: const Icon(Icons.refresh),
                label: const Text('Refresh Status'),
              ),
            ),
            const SizedBox(height: 16),
            if (_authStatus == 'Authenticated') ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    final appProvider = Provider.of<AppProvider>(context, listen: false);
                    await appProvider.signOut();
                    _checkAuthStatus();
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Sign Out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}