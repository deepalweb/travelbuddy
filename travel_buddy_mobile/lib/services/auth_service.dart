import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  // Email/Password Authentication
  static Future<UserCredential> signInWithEmail(String email, String password) async {
    try {
      return await _auth.signInWithEmailAndPassword(email: email, password: password);
    } catch (e) {
      print('Email Sign-In Error: $e');
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

  // Google Authentication - Temporarily disabled due to compatibility issues
  static Future<UserCredential?> signInWithGoogle() async {
    print('❌ Google Sign-In temporarily disabled');
    print('Please use email sign-in instead.');
    return null;
  }

  static Future<UserCredential?> signInWithGoogleSilent() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signInSilently();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      return await _auth.signInWithCredential(credential);
    } catch (e) {
      print('Silent Google Sign-In Error: $e');
      return null;
    }
  }

  static Future<bool> isGoogleSignInAvailable() async {
    try {
      return await _googleSignIn.isSignedIn();
    } catch (e) {
      return false;
    }
  }

  // Sign Out
  static Future<void> signOut() async {
    try {
      await Future.wait([
        _auth.signOut(),
        _googleSignIn.signOut(),
      ]);
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