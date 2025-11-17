import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';

class GoogleSignInService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );
  
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  static Future<UserCredential?> signInWithGoogle() async {
    try {
      print('❌ Google Sign-In not available - PigeonUserDetails compatibility issue');
      print('Google Sign in error: Google Sign-In is currently unavailable. Please use email sign-in instead');
      return null;
    } catch (e) {
      print('Google Sign-In error: $e');
      return null;
    }
  }

  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      print('Sign out error: $e');
    }
  }

  static User? getCurrentUser() {
    return _auth.currentUser;
  }

  static bool isSignedIn() {
    return _auth.currentUser != null;
  }
}