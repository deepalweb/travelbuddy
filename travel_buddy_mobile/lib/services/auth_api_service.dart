import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user.dart';
import 'mobile_api_client.dart';

class AuthApiService {
  static final AuthApiService _instance = AuthApiService._internal();
  factory AuthApiService() => _instance;
  
  final Dio _dio = MobileApiClient.instance.dio;

  AuthApiService._internal();

  // Get current authenticated user info
  Map<String, dynamic>? getCurrentUserInfo() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return {
        'firebaseUid': user.uid,
        'email': user.email,
        'displayName': user.displayName,
        'photoURL': user.photoURL,
      };
    }
    return null;
  }

  // Sync user profile with backend
  Future<CurrentUser?> syncUserProfile(CurrentUser localUser) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        print('❌ No authenticated user to sync');
        return null;
      }

      final userData = {
        'uid': user.uid,
        'email': user.email,
        'username': localUser.username ?? user.displayName,
        'profilePicture': localUser.profilePicture ?? user.photoURL,
        'bio': localUser.bio,
        'website': localUser.website,
        'location': localUser.location,
        'birthday': localUser.birthday,
        'languages': localUser.languages,
        'travelInterests': localUser.travelInterests,
        'budgetPreference': localUser.budgetPreference,
        'interests': localUser.interests,
        'budgetPreferences': localUser.budgetPreferences,
        'showBirthdayToOthers': localUser.showBirthdayToOthers,
        'showLocationToOthers': localUser.showLocationToOthers,
        'travelStyle': localUser.travelStyle?.name,
        'subscriptionStatus': localUser.subscriptionStatus.name,
        'tier': localUser.tier.name,
        'trialEndDate': localUser.trialEndDate,
        'subscriptionEndDate': localUser.subscriptionEndDate,
        'homeCurrency': localUser.homeCurrency,
        'language': localUser.language,
        'selectedInterests': localUser.selectedInterests?.map((e) => e.name).toList(),
        'hasCompletedWizard': localUser.hasCompletedWizard,
      };

      final response = await _dio.post('/api/users/sync', data: userData);
      
      if (response.statusCode == 200) {
        final backendUser = CurrentUser.fromJson(response.data);
        print('✅ User profile synced with backend');
        return backendUser;
      }
    } catch (e) {
      print('❌ Error syncing user profile: $e');
    }
    return null;
  }

  // Get user profile from backend
  Future<CurrentUser?> getUserProfile() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return null;

      final response = await _dio.get('/api/users/profile');
      
      if (response.statusCode == 200) {
        return CurrentUser.fromJson(response.data);
      }
    } catch (e) {
      print('❌ Error getting user profile: $e');
    }
    return null;
  }

  // Update user profile on backend
  Future<bool> updateUserProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _dio.put('/api/users/profile', data: updates);
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error updating user profile: $e');
      return false;
    }
  }

  // Get authenticated Dio instance for other services
  Dio get authenticatedDio => _dio;
}
