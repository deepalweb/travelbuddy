import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../firebase_options.dart';
import '../config/environment.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FirebaseService {
  static bool _initialized = false;
  
  static Future<void> initializeFirebase() async {
    if (_initialized) return;
    
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      _initialized = true;
      print('✅ Firebase initialized successfully');
      
      // Set up auth state listener
      _setupAuthStateListener();
      
    } catch (e) {
      print('❌ Firebase initialization failed: $e');
      rethrow;
    }
  }
  
  static void _setupAuthStateListener() {
    FirebaseAuth.instance.authStateChanges().listen((User? user) {
      if (user != null) {
        print('✅ User signed in: ${user.email}');
        _syncUserWithBackend(user);
      } else {
        print('ℹ️ No user signed in - authentication required');
        // Don't attempt any backend operations without a user
      }
    });
  }
  
  static Future<void> _syncUserWithBackend(User user) async {
    try {
      final token = await user.getIdToken();
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/auth/firebase-login'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ User synced with backend: ${data['user']?['username']}');
      } else {
        print('⚠️ Backend sync failed: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Error syncing user with backend: $e');
    }
  }
  
  static Future<String?> getCurrentUserToken() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        return await user.getIdToken();
      }
      return null;
    } catch (e) {
      print('❌ Error getting user token: $e');
      return null;
    }
  }
  
  static User? getCurrentUser() {
    return FirebaseAuth.instance.currentUser;
  }
  
  static bool get isUserSignedIn {
    return FirebaseAuth.instance.currentUser != null;
  }
}