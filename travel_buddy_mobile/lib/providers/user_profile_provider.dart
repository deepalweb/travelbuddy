import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../models/travel_badge.dart';
import '../models/travel_stats.dart';
import '../models/travel_enums.dart';
import '../services/api_service.dart';

class UserProfileProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  UserProfile? _currentUserProfile;
  Map<String, UserProfile> _cachedProfiles = {};
  bool _isLoading = false;
  String? _error;

  UserProfile? get currentUserProfile => _currentUserProfile;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadCurrentUserProfile() async {
    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final userData = await _apiService.getUserProfile('mobile_user');
      if (userData != null) {
        _currentUserProfile = userData;
        _cachedProfiles[_currentUserProfile!.userId] = _currentUserProfile!;
      }
    } catch (e) {
      _error = 'Failed to load user profile: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<UserProfile?> getUserProfile(String userId) async {
    if (_cachedProfiles.containsKey(userId)) {
      return _cachedProfiles[userId];
    }

    try {
      final profile = await _apiService.getUserProfile(userId);
      if (profile != null) {
        _cachedProfiles[userId] = profile;
      }
      return profile;
    } catch (e) {
      _error = 'Failed to load user profile: $e';
      return null;
    }
  }

  Future<void> updateProfile({
    String? bio,
    String? profileImage,
    List<TravelInterest>? travelInterests,
    TravelerType? travelerType,
    String? currentLocation,
    Map<String, dynamic>? preferences,
  }) async {
    if (_currentUserProfile == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final updatedData = await _apiService.updateUserProfile({
        if (bio != null) 'bio': bio,
        if (profileImage != null) 'profileImage': profileImage,
        if (travelInterests != null)
          'travelInterests': travelInterests.map((e) => e.toString().split('.').last).toList(),
        if (travelerType != null)
          'travelerType': travelerType.toString().split('.').last,
        if (currentLocation != null) 'currentLocation': currentLocation,
        if (preferences != null) 'preferences': preferences,
      });

      _currentUserProfile = UserProfile.fromJson(updatedData);
      _cachedProfiles[_currentUserProfile!.userId] = _currentUserProfile!;
    } catch (e) {
      _error = 'Failed to update profile: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> followUser(String userId) async {
    try {
      await _apiService.followUser(userId);
      // Update local follower counts
      if (_currentUserProfile != null) {
        _currentUserProfile = _currentUserProfile!.copyWith(
          followingCount: _currentUserProfile!.followingCount + 1,
        );
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to follow user: $e';
      notifyListeners();
    }
  }

  Future<void> unfollowUser(String userId) async {
    try {
      await _apiService.unfollowUser(userId);
      // Update local follower counts
      if (_currentUserProfile != null) {
        _currentUserProfile = _currentUserProfile!.copyWith(
          followingCount: _currentUserProfile!.followingCount - 1,
        );
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to unfollow user: $e';
      notifyListeners();
    }
  }
}
