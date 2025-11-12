// import 'package:google_sign_in/google_sign_in.dart'; // Google Sign-in disabled
// import 'package:firebase_auth/firebase_auth.dart'; // Firebase disabled

class GoogleSignInService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );
  
  static final FirebaseAuth _auth = FirebaseAuth.instance;

  static Future<UserCredential?> signInWithGoogle() async {
    print('❌ Firebase authentication disabled');
    throw 'Firebase authentication has been disabled. Please use email authentication.';
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