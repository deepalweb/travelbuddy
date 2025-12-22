import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import '../config/environment.dart';
import 'sync_queue_service.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final _connectivity = Connectivity();
  final _controller = StreamController<bool>.broadcast();
  bool _isOnline = true;
  StreamSubscription? _subscription;

  Stream<bool> get onlineStream => _controller.stream;
  bool get isOnline => _isOnline;

  Future<void> initialize() async {
    _isOnline = await checkConnection();
    
    _subscription = _connectivity.onConnectivityChanged.listen((result) async {
      final wasOffline = !_isOnline;
      _isOnline = await checkConnection();
      _controller.add(_isOnline);
      
      print('📡 Connection: ${_isOnline ? "ONLINE" : "OFFLINE"}');
      
      // Trigger sync when coming back online
      if (wasOffline && _isOnline) {
        print('🔄 Connection restored, processing sync queue...');
        await SyncQueueService().processQueue();
      }
    });
  }

  Future<bool> checkConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      if (result == ConnectivityResult.none) return false;
      
      // Verify actual internet access
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/health'),
      ).timeout(const Duration(seconds: 5));
      
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }
}
