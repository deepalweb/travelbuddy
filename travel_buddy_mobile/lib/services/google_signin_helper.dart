import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:io' show Platform;

class GoogleSignInHelper {
  static GoogleSignIn? _googleSignIn;
  
  static GoogleSignIn get instance {
    _googleSignIn ??= GoogleSignIn(
      scopes: ['email', 'profile'],
      // Use different configurations for different platforms
      serverClientId: Platform.isAndroid 
          ? '45425409967-ela9ibo2h0b713amblatn1pg956j7n3c.apps.googleusercontent.com'
          : null,
    );
    return _googleSignIn!;
  }
  
  /// Alternative Google Sign-In method that handles PigeonUserDetails issues
  static Future<UserCredential?> signInWithGoogleSafe() async {
    try {
      print('🔄 Starting safe Google Sign-In process...');
      
      // Method 1: Try standard Google Sign-In
      try {
        return await _standardGoogleSignIn();
      } catch (e) {
        print('⚠️ Standard method failed: $e');
        
        // If PigeonUserDetails error, try alternative method
        if (e.toString().contains('PigeonUserDetails') || 
            e.toString().contains('type cast')) {
          print('🔄 Trying alternative Google Sign-In method...');
          return await _alternativeGoogleSignIn();
        }
        rethrow;
      }
    } catch (e) {
      print('❌ All Google Sign-In methods failed: $e');
      rethrow;
    }
  }
  
  static Future<UserCredential?> _standardGoogleSignIn() async {
    final GoogleSignInAccount? googleUser = await instance.signIn();
    if (googleUser == null) return null;
    
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );
    
    return await FirebaseAuth.instance.signInWithCredential(credential);
  }
  
  static Future<UserCredential?> _alternativeGoogleSignIn() async {
    try {
      // Create a new GoogleSignIn instance with minimal configuration
      final alternativeGoogleSignIn = GoogleSignIn(
        scopes: ['email'],
        // No serverClientId to avoid compatibility issues
      );
      
      // Sign out first to ensure clean state
      await alternativeGoogleSignIn.signOut();
      
      final GoogleSignInAccount? googleUser = await alternativeGoogleSignIn.signIn();
      if (googleUser == null) return null;
      
      print('✅ Alternative method: Got Google user: ${googleUser.email}');
      
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.idToken == null) {
        throw 'Failed to get ID token from Google';
      }
      
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      
      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      print('✅ Alternative Google Sign-In successful!');
      return userCredential;
      
    } catch (e) {
      print('❌ Alternative Google Sign-In failed: $e');
      rethrow;
    }
  }
  
  static Future<bool> isAvailable() async {
    try {
      // Simple availability check without triggering PigeonUserDetails
      final googleSignIn = GoogleSignIn(scopes: ['email']);
      await googleSignIn.signInSilently();
      return true;
    } catch (e) {
      // If we get PigeonUserDetails error, Google Sign-In is not compatible
      if (e.toString().contains('PigeonUserDetails')) {
        return false;
      }
      return true; // Other errors don't necessarily mean unavailable
    }
  }
}