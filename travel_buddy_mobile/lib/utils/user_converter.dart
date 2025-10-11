import 'package:firebase_auth/firebase_auth.dart';
import '../models/user.dart';

class UserConverter {
  static CurrentUser? fromFirebaseUser(User? firebaseUser) {
    if (firebaseUser == null) return null;
    
    return CurrentUser(
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username: firebaseUser.displayName,
      profilePicture: firebaseUser.photoURL,
    );
  }
}