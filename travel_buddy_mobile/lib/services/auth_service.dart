import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';


class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final GoogleSignIn _googleSignIn = GoogleSignIn();


  // Email/Password Authentication with auto-linking
  static Future<UserCredential> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(email: email, password: password);
      print('✅ Email sign-in successful for: ${credential.user?.email}');
      
      // Check if Google account exists with same email and auto-link
      final methods = await _auth.fetchSignInMethodsForEmail(email);
      if (methods.contains('google.com') && !methods.contains('password')) {
        print('🔗 Google account detected, will auto-link on next Google sign-in');
      }
      
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

  // Google Sign-In with automatic account merging
  static Future<UserCredential?> signInWithGoogle() async {
    try {
      print('🔵 Starting Google Sign-In...');
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        print('⚠️ Google Sign-In cancelled by user');
        return null;
      }

      print('✅ Google user selected: ${googleUser.email}');
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Check if email already exists with password method
      final methods = await _auth.fetchSignInMethodsForEmail(googleUser.email);
      
      if (methods.contains('password')) {
        print('🔗 Email/password account exists. Attempting automatic merge...');
        
        // Sign in with Google to get the user
        UserCredential userCredential;
        try {
          userCredential = await _auth.signInWithCredential(credential);
        } on FirebaseAuthException catch (e) {
          if (e.code == 'account-exists-with-different-credential') {
            print('⚠️ Account exists. User must sign in with email first.');
            throw FirebaseAuthException(
              code: 'merge-required',
              message: 'Please sign in with your email/password first. Your accounts will be automatically linked.',
            );
          }
          rethrow;
        }
        
        print('✅ Accounts automatically merged');
        return userCredential;
      }

      // No existing account, proceed with normal Google sign-in
      final userCredential = await _auth.signInWithCredential(credential);
      print('✅ Firebase sign-in successful: ${userCredential.user?.email}');
      return userCredential;
    } catch (e) {
      print('❌ Google Sign-In Error: $e');
      rethrow;
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