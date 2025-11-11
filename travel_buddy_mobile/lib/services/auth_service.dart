import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:io' show Platform;
import 'google_signin_helper.dart';

class AuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  
  // Create GoogleSignIn instance with platform-specific configuration
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // Only use serverClientId on Android to avoid iOS issues
    serverClientId: Platform.isAndroid 
        ? '45425409967-ela9ibo2h0b713amblatn1pg956j7n3c.apps.googleusercontent.com' 
        : null,
  );

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

  // Google Authentication with PigeonUserDetails fix
  static Future<UserCredential?> signInWithGoogle() async {
    try {
      print('🔄 Attempting Google Sign-In with compatibility fixes...');
      
      // Use the helper class that handles PigeonUserDetails issues
      final userCredential = await GoogleSignInHelper.signInWithGoogleSafe();
      
      if (userCredential != null) {
        print('✅ Google Sign-In successful for: ${userCredential.user?.email}');
        return userCredential;
      }
      
      print('❌ Google Sign-In cancelled by user');
      return null;
      
    } catch (e) {
      print('❌ Google Sign-In Error: $e');
      
      // Handle specific error types
      final errorString = e.toString().toLowerCase();
      
      if (errorString.contains('pigeonuserdetails') || 
          errorString.contains('type cast') ||
          errorString.contains('list<object?>') ||
          errorString.contains('cast') ||
          errorString.contains('null check operator')) {
        print('⚠️ Google Sign-In compatibility issue detected - using fallback');
        throw 'Google Sign-In compatibility issue. Please use email sign-in instead.';
      }
      
      if (errorString.contains('network') || errorString.contains('timeout')) {
        throw 'Network error. Please check your internet connection.';
      }
      
      if (errorString.contains('play services') || errorString.contains('resolution required')) {
        throw 'Google Play Services required. Please update Google Play Services.';
      }
      
      if (errorString.contains('developer error') || errorString.contains('api not enabled')) {
        throw 'Google Sign-In configuration error. Please contact support.';
      }
      
      // Generic error
      throw 'Google Sign-In failed: ${e.toString()}';
    }
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
      return await GoogleSignInHelper.isAvailable();
    } catch (e) {
      print('⚠️ Google Sign-In availability check failed: $e');
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