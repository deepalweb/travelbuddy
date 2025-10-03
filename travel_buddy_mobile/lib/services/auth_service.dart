import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../models/user.dart';
import 'storage_service.dart';
import 'api_service.dart';
import 'auth_error_handler.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final StorageService _storage = StorageService();
  final ApiService _api = ApiService();

  User? get currentFirebaseUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<CurrentUser?> signInWithEmail(String email, String password) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        return await _createOrUpdateUser(credential.user!);
      }
      return null;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<CurrentUser?> registerWithEmail(
    String email,
    String password,
    String username,
  ) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        await credential.user!.updateDisplayName(username);
        return await _createOrUpdateUser(credential.user!, isNewUser: true);
      }
      return null;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
    await _storage.clearUser();
  }

  Future<CurrentUser?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      if (userCredential.user != null) {
        return await _createOrUpdateUser(userCredential.user!);
      }
      return null;
    } catch (e) {
      print('Google Sign-In error: $e');
      throw 'Google Sign-In failed: ${e.toString()}';
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  Future<CurrentUser?> getCurrentUser() async {
    final firebaseUser = _auth.currentUser;
    if (firebaseUser != null) {
      // Try to get from local storage first
      final localUser = await _storage.getUser();
      if (localUser != null) {
        return localUser;
      }
      // If not in local storage, create from Firebase user
      return await _createOrUpdateUser(firebaseUser);
    }
    return null;
  }

  Future<CurrentUser?> updateUserProfile({
    String? username,
    String? email,
    String? bio,
    String? website,
    String? location,
    String? birthday,
    List<String>? languages,
    List<String>? interests,
    List<String>? budgetPreferences,
    bool? showBirthdayToOthers,
    bool? showLocationToOthers,
    String? profilePicture,
    String? travelStyle,
  }) async {
    final firebaseUser = _auth.currentUser;
    if (firebaseUser == null) return null;

    try {
      // Update Firebase user if needed (skip photoURL for base64 images)
      if (username != null && username != firebaseUser.displayName) {
        await firebaseUser.updateDisplayName(username);
      }
      // Skip Firebase photoURL update for base64 images (too long)
      if (profilePicture != null && !profilePicture.startsWith('data:image') && profilePicture != firebaseUser.photoURL) {
        await firebaseUser.updatePhotoURL(profilePicture);
      }

      // Get current local user
      final currentUser = await _storage.getUser();
      if (currentUser != null) {
        // Create updated user with new data
        final updatedUser = currentUser.copyWith(
          username: username ?? currentUser.username,
          email: email ?? currentUser.email,
          bio: bio ?? currentUser.bio,
          website: website ?? currentUser.website,
          location: location ?? currentUser.location,
          birthday: birthday ?? currentUser.birthday,
          languages: languages ?? currentUser.languages,
          interests: interests ?? currentUser.interests,
          budgetPreferences: budgetPreferences ?? currentUser.budgetPreferences,
          showBirthdayToOthers: showBirthdayToOthers ?? currentUser.showBirthdayToOthers,
          showLocationToOthers: showLocationToOthers ?? currentUser.showLocationToOthers,
          profilePicture: profilePicture ?? currentUser.profilePicture,
        );

        // Save to local storage
        await _storage.saveUser(updatedUser);

        // Update backend if possible
        try {
          await _api.updateUser(updatedUser.mongoId ?? firebaseUser.uid, {
            'username': updatedUser.username,
            'email': updatedUser.email,
            'bio': updatedUser.bio,
            'website': updatedUser.website,
            'location': updatedUser.location,
            'birthday': updatedUser.birthday,
            'languages': updatedUser.languages,
            'interests': updatedUser.interests,
            'budgetPreferences': updatedUser.budgetPreferences,
            'showBirthdayToOthers': updatedUser.showBirthdayToOthers,
            'showLocationToOthers': updatedUser.showLocationToOthers,
            'profilePicture': updatedUser.profilePicture,
            'travelStyle': travelStyle,
          });
        } catch (e) {
          print('Backend update failed, but local update succeeded: $e');
        }

        return updatedUser;
      }
    } catch (e) {
      print('Error updating user profile: $e');
    }
    return null;
  }

  Future<CurrentUser?> _createOrUpdateUser(User firebaseUser, {bool isNewUser = false}) async {
    try {
      print('👤 [AUTH] Creating user from Firebase:');
      print('👤 [AUTH] Display Name: ${firebaseUser.displayName}');
      print('👤 [AUTH] Email: ${firebaseUser.email}');
      print('👤 [AUTH] Photo URL: ${firebaseUser.photoURL}');
      print('👤 [AUTH] Provider Data: ${firebaseUser.providerData.map((p) => '${p.providerId}: ${p.photoURL}').join(', ')}');
      
      // Create user data for backend
      final userData = {
        'firebaseUid': firebaseUser.uid,
        'username': firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
        'email': firebaseUser.email,
        'profilePicture': firebaseUser.photoURL ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      };
      
      print('👤 [AUTH] User data for backend: $userData');

      // Try to create/update user in backend (with timeout)
      CurrentUser? backendUser;
      try {
        backendUser = await _api.createUser(userData).timeout(
          const Duration(seconds: 10),
          onTimeout: () => null,
        );
      } catch (e) {
        print('Backend user creation failed: $e');
        backendUser = null;
      }
      
      // Create local user (always works)
      final localUser = CurrentUser(
        username: userData['username']!,
        email: userData['email'],
        mongoId: backendUser?.mongoId ?? firebaseUser.uid,
        uid: firebaseUser.uid,
        profilePicture: userData['profilePicture'],
        subscriptionStatus: backendUser?.subscriptionStatus ?? SubscriptionStatus.none,
        tier: backendUser?.tier ?? SubscriptionTier.free,
        homeCurrency: backendUser?.homeCurrency ?? 'USD',
        language: backendUser?.language ?? 'en',
      );
      
      // Save to local storage
      await _storage.saveUser(localUser);
      return localUser;
    } catch (e) {
      print('Error creating/updating user: $e');
      throw AuthErrorHandler.getReadableError(e);
    }
  }

  String _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'No user found with this email address.';
      case 'wrong-password':
        return 'Incorrect password.';
      case 'email-already-in-use':
        return 'An account already exists with this email address.';
      case 'weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return e.message ?? 'An authentication error occurred.';
    }
  }
}