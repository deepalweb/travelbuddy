import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class AppPermissionsScreen extends StatefulWidget {
  const AppPermissionsScreen({super.key});

  @override
  State<AppPermissionsScreen> createState() => _AppPermissionsScreenState();
}

class _AppPermissionsScreenState extends State<AppPermissionsScreen> {
  Map<Permission, PermissionStatus> _permissions = {};
  bool _isLoading = false;

  final List<Permission> _requiredPermissions = [
    Permission.location,
    Permission.locationWhenInUse,
    Permission.camera,
    Permission.storage,
    Permission.notification,
    Permission.phone,
  ];

  @override
  void initState() {
    super.initState();
    _checkPermissions();
  }

  Future<void> _checkPermissions() async {
    setState(() => _isLoading = true);
    
    final permissions = <Permission, PermissionStatus>{};
    for (final permission in _requiredPermissions) {
      permissions[permission] = await permission.status;
    }
    
    setState(() {
      _permissions = permissions;
      _isLoading = false;
    });
  }

  Future<void> _requestPermission(Permission permission) async {
    final status = await permission.request();
    setState(() {
      _permissions[permission] = status;
    });
    
    if (status.isPermanentlyDenied) {
      _showSettingsDialog(permission);
    }
  }

  void _showSettingsDialog(Permission permission) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Permission Required'),
        content: Text(
          'This permission is required for the app to function properly. '
          'Please enable it in app settings.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              openAppSettings();
            },
            child: const Text('Open Settings'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Permissions'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _checkPermissions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text(
                  'Manage app permissions to ensure full functionality',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
                const SizedBox(height: 16),
                ..._permissions.entries.map((entry) => 
                  _buildPermissionTile(entry.key, entry.value)
                ),
              ],
            ),
    );
  }

  Widget _buildPermissionTile(Permission permission, PermissionStatus status) {
    final info = _getPermissionInfo(permission);
    
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListTile(
        leading: Icon(
          info['icon'],
          color: _getStatusColor(status),
        ),
        title: Text(info['title']),
        subtitle: Text(info['description']),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: _getStatusColor(status).withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                _getStatusText(status),
                style: TextStyle(
                  color: _getStatusColor(status),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            if (!status.isGranted) ...[
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.settings),
                onPressed: () => _requestPermission(permission),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _getPermissionInfo(Permission permission) {
    switch (permission) {
      case Permission.location:
        return {
          'title': 'Location (Always)',
          'description': 'Access location for nearby places and navigation',
          'icon': Icons.location_on,
        };
      case Permission.locationWhenInUse:
        return {
          'title': 'Location (When in Use)',
          'description': 'Access location while using the app',
          'icon': Icons.my_location,
        };
      case Permission.camera:
        return {
          'title': 'Camera',
          'description': 'Take photos for posts and profile pictures',
          'icon': Icons.camera_alt,
        };
      case Permission.storage:
        return {
          'title': 'Storage',
          'description': 'Save and access photos and files',
          'icon': Icons.storage,
        };
      case Permission.notification:
        return {
          'title': 'Notifications',
          'description': 'Receive travel alerts and updates',
          'icon': Icons.notifications,
        };
      case Permission.phone:
        return {
          'title': 'Phone',
          'description': 'Make emergency calls',
          'icon': Icons.phone,
        };
      default:
        return {
          'title': permission.toString(),
          'description': 'App permission',
          'icon': Icons.security,
        };
    }
  }

  Color _getStatusColor(PermissionStatus status) {
    switch (status) {
      case PermissionStatus.granted:
        return Colors.green;
      case PermissionStatus.denied:
        return Colors.orange;
      case PermissionStatus.permanentlyDenied:
        return Colors.red;
      case PermissionStatus.restricted:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(PermissionStatus status) {
    switch (status) {
      case PermissionStatus.granted:
        return 'Granted';
      case PermissionStatus.denied:
        return 'Denied';
      case PermissionStatus.permanentlyDenied:
        return 'Blocked';
      case PermissionStatus.restricted:
        return 'Restricted';
      default:
        return 'Unknown';
    }
  }
}