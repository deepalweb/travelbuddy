import '../models/user.dart';
import 'storage_service.dart';

class MockAuthService {
  static final MockAuthService _instance = MockAuthService._internal();
  factory MockAuthService() => _instance;
  MockAuthService._internal();

  final StorageService _storage = StorageService();
  CurrentUser? _currentUser;

  bool get isAuthenticated => _currentUser != null;
  CurrentUser? get currentUser => _currentUser;

  Future<bool> signIn(String email, String password) async {
    // Mock authentication - always succeeds
    _currentUser = CurrentUser(
      username: email.split('@')[0],
      email: email,
      mongoId: 'mock_${DateTime.now().millisecondsSinceEpoch}',
      uid: 'mock_${DateTime.now().millisecondsSinceEpoch}',
    );
    
    await _storage.saveUser(_currentUser!);
    return true;
  }

  Future<bool> register(String email, String password, String username) async {
    // Mock registration - always succeeds
    _currentUser = CurrentUser(
      username: username,
      email: email,
      mongoId: 'mock_${DateTime.now().millisecondsSinceEpoch}',
      uid: 'mock_${DateTime.now().millisecondsSinceEpoch}',
    );
    
    await _storage.saveUser(_currentUser!);
    return true;
  }

  Future<void> signOut() async {
    _currentUser = null;
    await _storage.clearUser();
  }

  Future<void> initialize() async {
    _currentUser = await _storage.getUser();
  }
}