import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../config/environment.dart';
import '../models/user.dart';

class AuthApiService {
  static final AuthApiService _instance = AuthApiService._internal();
  factory AuthApiService() => _instance;
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 20),
    sendTimeout: const Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  AuthApiService._internal() {
    // Add Firebase Auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        await _addAuthHeader(options);
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the request with new token
            final retryOptions = error.requestOptions;
            await _addAuthHeader(retryOptions);
            final response = await _dio.fetch(retryOptions);
            handler.resolve(response);
            return;
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<void> _addAuthHeader(RequestOptions options) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final token = await user.getIdToken(true); // Force refresh token
        options.headers['Authorization'] = 'Bearer $token';
        options.headers['X-Firebase-UID'] = user.uid;
        
        // Add user context to request
        if (!options.data?.containsKey('userId') && options.method != 'GET') {
          options.data ??= {};
          if (options.data is Map) {
            options.data['userId'] = user.uid;
          }
        }
        
        // Add userId to query params for GET requests
        if (options.method == 'GET' && !options.queryParameters.containsKey('userId')) {
          options.queryParameters['userId'] = user.uid;
        }
        
        print('✅ Added Firebase auth headers for user: ${user.email}');
      } else {
        print('⚠️ No Firebase user found for auth headers');
      }
    } catch (e) {
      print('❌ Error adding auth header: $e');
    }
  }

  Future<bool> _refreshToken() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await user.getIdToken(true); // Force refresh
        return true;
      }
    } catch (e) {
      print('❌ Error refreshing token: $e');
    }
    return false;
  }

  // Get current authenticated user info
  Map<String, dynamic>? getCurrentUserInfo() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return {
        'uid': user.uid,
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