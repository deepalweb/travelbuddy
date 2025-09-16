import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import '../services/permission_service.dart';
import '../constants/app_constants.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  final PermissionService _permissionService = PermissionService();
  Map<String, bool> _permissions = {};
  LocationPermission _locationPermission = LocationPermission.denied;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);
    
    try {
      final permissions = await _permissionService.checkAllPermissions();
      final locationPermission = await _permissionService.getLocationPermissionStatus();
      
      setState(() {
        _permissions = permissions;
        _locationPermission = locationPermission;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Permissions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _checkPermissions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.security,
                                color: Color(AppConstants.colors['primary']!),
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                'Permission Status',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Travel Buddy needs these permissions to provide the best experience.',
                            style: TextStyle(fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Location Permission
                  _buildPermissionCard(
                    'Location Access',
                    'Find nearby places and provide personalized recommendations',
                    Icons.location_on,
                    _permissions['location'] ?? false,
                    _permissionService.getLocationPermissionStatusText(_locationPermission),
                    _permissionService.getLocationPermissionStatusColor(_locationPermission),
                    () async {
                      final granted = await _permissionService.requestLocationPermission();
                      if (!granted) {
                        if (mounted) {
                          await PermissionService.showLocationPermissionRationale(context);
                        }
                      }
                      _checkPermissions();
                    },
                  ),
                  
                  const SizedBox(height: 12),
                  
                  // Location Service
                  _buildPermissionCard(
                    'Location Service',
                    'Device location services must be enabled',
                    Icons.gps_fixed,
                    _permissions['locationService'] ?? false,
                    _permissions['locationService'] == true ? 'Enabled' : 'Disabled',
                    _permissions['locationService'] == true ? Colors.green : Colors.red,
                    () async {
                      await _permissionService.openLocationSettings();
                      _checkPermissions();
                    },
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Feature Requirements
                  const Text(
                    'Feature Requirements',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  _buildFeatureCard(
                    'Nearby Places',
                    'Requires location access',
                    Icons.explore,
                    _permissions['location'] ?? false,
                  ),
                  
                  _buildFeatureCard(
                    'Navigation & Directions',
                    'Requires location access',
                    Icons.directions,
                    _permissions['location'] ?? false,
                  ),
                  
                  _buildFeatureCard(
                    'Safety Features',
                    'Requires location access',
                    Icons.security,
                    _permissions['location'] ?? false,
                  ),
                  
                  _buildFeatureCard(
                    'Personalized Recommendations',
                    'Requires location access',
                    Icons.auto_awesome,
                    _permissions['location'] ?? false,
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _checkPermissions,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Refresh Status'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Color(AppConstants.colors['primary']!),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _permissionService.openAppSettings(),
                          icon: const Icon(Icons.settings),
                          label: const Text('App Settings'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildPermissionCard(
    String title,
    String description,
    IconData icon,
    bool isGranted,
    String statusText,
    Color statusColor,
    VoidCallback onTap,
  ) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isGranted ? Colors.green[100] : Colors.red[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            icon,
            color: isGranted ? Colors.green : Colors.red,
          ),
        ),
        title: Text(title),
        subtitle: Text(description),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: statusColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: statusColor.withOpacity(0.3)),
              ),
              child: Text(
                statusText,
                style: TextStyle(
                  color: statusColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (!isGranted)
              TextButton(
                onPressed: onTap,
                child: const Text('Enable', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        onTap: !isGranted ? onTap : null,
      ),
    );
  }

  Widget _buildFeatureCard(
    String title,
    String requirement,
    IconData icon,
    bool isAvailable,
  ) {
    return Card(
      child: ListTile(
        leading: Icon(
          icon,
          color: isAvailable ? Colors.green : Colors.grey,
        ),
        title: Text(title),
        subtitle: Text(requirement),
        trailing: Icon(
          isAvailable ? Icons.check_circle : Icons.cancel,
          color: isAvailable ? Colors.green : Colors.red,
        ),
      ),
    );
  }
}