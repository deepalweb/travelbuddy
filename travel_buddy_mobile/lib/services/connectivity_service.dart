import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

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
      _isOnline = await checkConnection();
      _controller.add(_isOnline);
      print('📡 Connection: ${_isOnline ? "ONLINE" : "OFFLINE"}');
    });
  }

  Future<bool> checkConnection() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return result != ConnectivityResult.none;
    } catch (e) {
      return false;
    }
  }

  void dispose() {
    _subscription?.cancel();
    _controller.close();
  }
}
