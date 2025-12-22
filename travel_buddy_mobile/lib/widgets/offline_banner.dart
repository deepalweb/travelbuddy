import 'package:flutter/material.dart';
import '../services/connectivity_service.dart';
import '../services/sync_queue_service.dart';

class OfflineBanner extends StatefulWidget {
  const OfflineBanner({super.key});

  @override
  State<OfflineBanner> createState() => _OfflineBannerState();
}

class _OfflineBannerState extends State<OfflineBanner> {
  bool _isOnline = true;
  int _queueCount = 0;

  @override
  void initState() {
    super.initState();
    _checkStatus();
    
    // Listen to connectivity changes
    ConnectivityService().onlineStream.listen((isOnline) {
      if (mounted) {
        setState(() {
          _isOnline = isOnline;
        });
        _updateQueueCount();
      }
    }).onError((error) {
      print('Connectivity stream error: $error');
    });
  }

  Future<void> _checkStatus() async {
    try {
      final isOnline = await ConnectivityService().checkConnection();
      final queueCount = await SyncQueueService().getQueueCount();
      
      if (mounted) {
        setState(() {
          _isOnline = isOnline;
          _queueCount = queueCount;
        });
      }
    } catch (e) {
      print('Error checking status: $e');
    }
  }

  Future<void> _updateQueueCount() async {
    final queueCount = await SyncQueueService().getQueueCount();
    if (mounted) {
      setState(() {
        _queueCount = queueCount;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isOnline && _queueCount == 0) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: _isOnline ? Colors.orange[100] : Colors.red[100],
      child: Row(
        children: [
          Icon(
            _isOnline ? Icons.sync : Icons.cloud_off,
            size: 16,
            color: _isOnline ? Colors.orange[800] : Colors.red[800],
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _isOnline 
                  ? 'Syncing $_queueCount item${_queueCount > 1 ? 's' : ''}...'
                  : 'Offline Mode - Changes will sync when online',
              style: TextStyle(
                fontSize: 12,
                color: _isOnline ? Colors.orange[800] : Colors.red[800],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (!_isOnline && _queueCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red[800],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '$_queueCount',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
