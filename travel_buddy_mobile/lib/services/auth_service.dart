// Simple auth service without Firebase
class AuthService {
  static Future<void> signInWithEmail(String email, String password) async {
    print('Email sign-in disabled - Firebase removed');
    throw 'Email authentication disabled. Firebase has been removed from this app.';
  }

  static Future<void> registerWithEmail(String email, String password, String username) async {
    print('Email registration disabled - Firebase removed');
    throw 'Email registration disabled. Firebase has been removed from this app.';
  }

  static Future<void> signInWithGoogle() async {
    print('Google Sign-in disabled - Firebase removed');
    throw 'Google Sign-in disabled. Firebase has been removed from this app.';
  }

  static Future<void> signOut() async {
    print('Sign out - no Firebase to sign out from');
  }

  static Future<void> getCurrentUser() async {
    return null;
  }

  static bool get currentUser => false;
  static Stream<bool> get authStateChanges => Stream.value(false);
}