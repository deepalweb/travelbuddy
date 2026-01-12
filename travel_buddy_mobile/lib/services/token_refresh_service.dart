import 'package:firebase_auth/firebase_auth.dart';
import 'dart:async';
import 'security_service.dart';

class TokenRefreshService {
  static final TokenRefreshService _instance = TokenRefreshService._internal();
  factory TokenRefreshService() => _instance;
  TokenRefreshService._internal();

  final SecurityService _securityService = SecurityService();
  Timer? _refreshTimer;
  String? _currentToken;
  DateTime? _tokenExpiry;

  // Start automatic token refresh
  void startAutoRefresh() {
    print('🔐 Starting automatic token refresh');
    
    // Refresh token every 50 minutes (tokens expire in 1 hour)
    _refreshTimer = Timer.periodic(Duration(minutes: 50), (timer) async {
      await refreshToken();
    });

    // Initial refresh
    refreshToken();
  }

  // Manually refresh token
  Future<String?> refreshToken({bool force = false}) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No user to refresh token');
        return null;
      }

      // Check if token is still valid
      if (!force && _currentToken != null && _tokenExpiry != null) {
        final now = DateTime.now();
        if (_tokenExpiry!.isAfter(now.add(Duration(minutes: 10)))) {
          print('✅ Token still valid for ${_tokenExpiry!.difference(now).inMinutes} minutes');
          return _currentToken;
        }
      }

      // Get fresh token
      final token = await user.getIdToken(true); // Force refresh
      if (token != null) {
        _currentToken = token;
        _tokenExpiry = DateTime.now().add(Duration(hours: 1));
        
        // Store securely
        await _securityService.storeUserToken(token);
        
        print('✅ Token refreshed successfully (expires in 1 hour)');
        return token;
      }

      return null;
    } catch (e) {
      print('❌ Error refreshing token: $e');
      return null;
    }
  }

  // Get current valid token
  Future<String?> getValidToken() async {
    // Check if current token is still valid
    if (_currentToken != null && _tokenExpiry != null) {
      final now = DateTime.now();
      if (_tokenExpiry!.isAfter(now)) {
        return _currentToken;
      }
    }

    // Token expired or missing, refresh it
    return await refreshToken();
  }

  // Check if token needs refresh soon
  bool needsRefresh() {
    if (_tokenExpiry == null) return true;
    
    final now = DateTime.now();
    final timeUntilExpiry = _tokenExpiry!.difference(now);
    
    // Refresh if less than 10 minutes remaining
    return timeUntilExpiry.inMinutes < 10;
  }

  // Stop auto refresh
  void stopAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
    print('🔐 Stopped automatic token refresh');
  }

  // Clear token data
  void clearToken() {
    _currentToken = null;
    _tokenExpiry = null;
    _securityService.deleteSecure('user_token');
  }

  void dispose() {
    stopAutoRefresh();
  }
}
