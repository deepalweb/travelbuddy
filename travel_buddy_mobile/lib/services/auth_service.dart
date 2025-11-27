import 'package:firebase_auth/firebase_auth.dart';


class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;


  // Email/Password Authentication
  static Future<UserCredential> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      print('✅ Email sign-in successful for: ${credential.user?.email}');
      return credential;
    } catch (e) {
      print('❌ Email Sign-In Error: $e');
      rethrow;
    }
  }

  static Future<UserCredential> registerWithEmail(String email, String password, String username) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(email: email, password: password);
      await credential.user?.updateDisplayName(username);
      return credential;
    } catch (e) {
      print('Email Registration Error: $e');
      rethrow;
    }
  }



  // Sign Out
  static Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e) {
      print('Sign Out Error: $e');
      rethrow;
    }
  }

  // User Management
  static Future<User?> getCurrentUser() async {
    return _auth.currentUser;
  }

  static Future<User?> updateUserProfile({String? displayName, String? photoURL}) async {
    try {
      final user = _auth.currentUser;
      if (user != null) {
        await user.updateDisplayName(displayName);
        if (photoURL != null) await user.updatePhotoURL(photoURL);
        await user.reload();
        return _auth.currentUser;
      }
      return null;
    } catch (e) {
      print('Update Profile Error: $e');
      rethrow;
    }
  }

  static User? get currentUser => _auth.currentUser;
  static Stream<User?> get authStateChanges => _auth.authStateChanges();
}