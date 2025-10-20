import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/community_post.dart';
import '../models/travel_enums.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import 'app_provider.dart';

class CommunityProvider with ChangeNotifier {
  CurrentUser? _lastKnownUser;
  final ApiService _apiService = ApiService();
  
  List<CommunityPost> _posts = [];
  bool _isLoading = false;
  String? _error;
  int _currentPage = 1;
  bool _hasMorePosts = true;

  List<CommunityPost> get posts => _posts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasMorePosts => _hasMorePosts;

  Future<void> loadPosts({bool refresh = false, BuildContext? context}) async {
    if (_isLoading && !refresh) return;

    if (refresh) {
      _currentPage = 1;
      _posts.clear();
      _hasMorePosts = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Always fetch fresh data from backend to get latest posts
      final backendPosts = await _apiService.getCommunityPosts(
        page: _currentPage,
        limit: 20,
      );

      if (backendPosts.isNotEmpty) {
        // Update posts with current user profile data
        final updatedPosts = await _syncPostsWithUserProfile(backendPosts, context);
        
        if (refresh || _currentPage == 1) {
          // On refresh or first load, replace all posts with fresh backend data
          _posts = updatedPosts;
        } else {
          // On load more, add new posts
          final localIds = _posts.map((p) => p.id).toSet();
          final newBackendPosts = updatedPosts.where((p) => !localIds.contains(p.id)).toList();
          _posts.addAll(newBackendPosts);
        }
        
        _posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        _hasMorePosts = backendPosts.length >= 20;
        _currentPage++;
        print('✅ Loaded ${backendPosts.length} posts from backend');
        
        // Update local cache with fresh data
        await _updateLocalCache();
        
        // Clear any previous errors
        _error = null;
      } else {
        _hasMorePosts = false;
        print('📭 No posts from backend (empty response)');
      }
    } catch (e) {
      _error = 'Failed to load posts: $e';
      print('❌ Backend API failed: $e');
      _hasMorePosts = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> _updateLocalCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final postsJson = _posts.take(20).map((post) => jsonEncode({
        'id': post.id,
        'userId': post.userId,
        'userName': post.userName,
        'userAvatar': post.userAvatar,
        'content': post.content,
        'images': post.images,
        'location': post.location,
        'createdAt': post.createdAt.toIso8601String(),
        'likesCount': post.likesCount,
        'commentsCount': post.commentsCount,
        'isLiked': post.isLiked,
        'postType': post.postType.name,
        'isSaved': post.isSaved,
      })).toList();
      
      await prefs.setStringList('local_posts', postsJson);
      await prefs.setInt('posts_cache_timestamp', DateTime.now().millisecondsSinceEpoch);
    } catch (e) {
      print('❌ Error updating local cache: $e');
    }
  }
  
  Future<List<CommunityPost>> _syncPostsWithUserProfile(List<CommunityPost> posts, BuildContext? context) async {
    if (context == null) return posts;
    
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      final currentUser = appProvider.currentUser;
      
      if (currentUser == null) return posts;
      
      // Update posts from current user with latest profile data
      return posts.map((post) {
        if (post.userId == currentUser.mongoId || post.userId == currentUser.uid) {
          return CommunityPost(
            id: post.id,
            userId: post.userId,
            userName: currentUser.username ?? post.userName,
            userAvatar: currentUser.profilePicture?.startsWith('http') == true 
                ? currentUser.profilePicture! 
                : post.userAvatar,
            content: post.content,
            images: post.images,
            location: post.location,
            createdAt: post.createdAt,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            isLiked: post.isLiked,
            postType: post.postType,
            hashtags: post.hashtags,
            metadata: post.metadata,
          );
        }
        return post;
      }).toList();
    } catch (e) {
      print('⚠️ Profile sync failed: $e');
      return posts;
    }
  }


  
  Future<void> syncWithBackend() async {
    try {
      print('🌐 [PROVIDER] Starting background sync with backend...');
      
      final backendPosts = await _apiService.getCommunityPosts(page: 1, limit: 10);
      
      if (backendPosts.isNotEmpty) {
        final localIds = _posts.map((p) => p.id).toSet();
        final newBackendPosts = backendPosts.where((p) => !localIds.contains(p.id)).toList();
        
        if (newBackendPosts.isNotEmpty) {
          _posts.addAll(newBackendPosts);
          _posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          notifyListeners();
          print('✅ [PROVIDER] Synced ${newBackendPosts.length} new posts from backend');
        } else {
          print('💾 [PROVIDER] No new posts from backend');
        }
      }
    } catch (e) {
      print('⚠️ [PROVIDER] Background sync failed: $e - using local posts only');
    }
  }

  Future<void> toggleLike(String postId) async {
    final postIndex = _posts.indexWhere((post) => post.id == postId);
    if (postIndex == -1) return;

    final post = _posts[postIndex];
    final wasLiked = post.isLiked;

    // Optimistic update
    _posts[postIndex] = CommunityPost(
      id: post.id,
      userId: post.userId,
      userName: post.userName,
      userAvatar: post.userAvatar,
      content: post.content,
      images: post.images,
      location: post.location,
      createdAt: post.createdAt,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
      commentsCount: post.commentsCount,
      isLiked: !wasLiked,
      postType: post.postType,
      metadata: post.metadata,
    );
    notifyListeners();

    // Skip backend sync for temporary posts
    if (!postId.startsWith('temp_')) {
      try {
        // Try backend API for real posts only
        final success = await _apiService.toggleLike(postId);
        if (success) {
          print('✅ Like synced to backend');
        } else {
          print('⚠️ Backend like API not available');
        }
      } catch (e) {
        print('⚠️ Backend unavailable - like saved locally');
      }
    } else {
      print('💾 Local-only post - like saved locally');
    }
  }

  Future<bool> toggleBookmark(String postId) async {
    final postIndex = _posts.indexWhere((post) => post.id == postId);
    if (postIndex == -1) return false;

    final post = _posts[postIndex];
    final wasBookmarked = post.isSaved;

    // Optimistic update
    _posts[postIndex] = CommunityPost(
      id: post.id,
      userId: post.userId,
      userName: post.userName,
      userAvatar: post.userAvatar,
      content: post.content,
      images: post.images,
      location: post.location,
      createdAt: post.createdAt,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isLiked: post.isLiked,
      postType: post.postType,
      isSaved: !wasBookmarked,
      metadata: post.metadata,
    );
    notifyListeners();

    // Sync with backend
    try {
      final success = await _apiService.toggleBookmark(postId);
      if (success) {
        print('✅ Bookmark synced to backend');
      } else {
        // Revert on failure
        _posts[postIndex] = post;
        notifyListeners();
        print('❌ Bookmark sync failed - reverted');
        return false;
      }
    } catch (e) {
      // Revert on error
      _posts[postIndex] = post;
      notifyListeners();
      print('❌ Bookmark error - reverted: $e');
      return false;
    }
    return true;
  }

  Future<bool> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    bool allowComments = true,
    String visibility = 'public',
    BuildContext? context,
  }) async {
    try {
      CurrentUser? currentUser;
      if (context != null) {
        final appProvider = Provider.of<AppProvider>(context, listen: false);
        currentUser = appProvider.currentUser;
      }
      
      // Try backend first for immediate sync
      try {
        final newPost = await _apiService.createPost(
          content: content,
          location: location,
          images: images,
          postType: postType,
          hashtags: hashtags,
          allowComments: allowComments,
          visibility: visibility,
        );
        
        if (newPost != null && newPost.id.isNotEmpty) {
          // Insert at beginning of posts list
          _posts.insert(0, newPost);
          notifyListeners();
          await _savePostLocally(newPost);
          print('✅ Post created and synced to backend immediately');
          
          // Clear any previous errors
          _error = null;
          
          // Force refresh to get latest posts after a short delay
          await Future.delayed(Duration(milliseconds: 500));
          await loadPosts(refresh: true, context: context);
          return true;
        } else {
          print('⚠️ Backend returned invalid post data, using optimistic update');
        }
      } catch (e) {
        print('⚠️ Backend create failed, using optimistic update: $e');
        _error = 'Post creation may be delayed. Check your connection.';
      }
      
      // Fallback to optimistic update
      String userAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
      if (currentUser?.profilePicture?.isNotEmpty == true) {
        final pic = currentUser!.profilePicture!;
        if (pic.startsWith('http')) {
          userAvatar = pic;
        }
      }
      
      final optimisticPost = CommunityPost(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        userId: currentUser?.mongoId ?? currentUser?.uid ?? '507f1f77bcf86cd799439011',
        userName: currentUser?.username ?? 'Mobile User',
        userAvatar: userAvatar,
        content: content,
        images: images,
        location: location,
        createdAt: DateTime.now(),
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        postType: _getPostTypeFromString(postType),
        isSaved: false,
        metadata: {},
      );
      
      _posts.insert(0, optimisticPost);
      notifyListeners();
      await _savePostLocally(optimisticPost);
      
      // Try background sync
      _tryBackendSaveInBackground(optimisticPost, currentUser);
      
      // Clear error since we have an optimistic post
      _error = null;
      
      return true;
    } catch (e) {
      print('❌ [PROVIDER] Error creating post: $e');
      return false;
    }
  }
  
  Future<void> _clearPostsCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('posts_cache_timestamp');
      print('🗑️ Cleared posts cache to force refresh for other users');
    } catch (e) {
      print('❌ Error clearing posts cache: $e');
    }
  }
  
  Future<void> _savePostLocally(CommunityPost post) async {
    try {
      final postJson = {
        'id': post.id,
        'userId': post.userId,
        'userName': post.userName,
        'userAvatar': post.userAvatar,
        'content': post.content,
        'images': post.images,
        'location': post.location,
        'createdAt': post.createdAt.toIso8601String(),
        'likesCount': post.likesCount,
        'commentsCount': post.commentsCount,
        'isLiked': post.isLiked,
        'postType': post.postType.name,
        'isSaved': post.isSaved,
      };
      
      final prefs = await SharedPreferences.getInstance();
      final existingPosts = prefs.getStringList('local_posts') ?? [];
      existingPosts.insert(0, jsonEncode(postJson));
      
      if (existingPosts.length > 50) {
        existingPosts.removeRange(50, existingPosts.length);
      }
      
      await prefs.setStringList('local_posts', existingPosts);
    } catch (e) {
      print('❌ [PROVIDER] Error saving post locally: $e');
    }
  }
  
  Future<void> _tryBackendSaveInBackground(CommunityPost post, CurrentUser? currentUser) async {
    try {
      print('🌐 Attempting to sync post to backend...');
      final newPost = await _apiService.createPost(
        content: post.content,
        location: post.location,
        images: post.images,
        postType: post.postType.name,
        hashtags: [],
        allowComments: true,
        visibility: 'public',
      );
      
      if (newPost != null && newPost.id.isNotEmpty && !newPost.id.startsWith('temp_')) {
        // Backend success - replace temp post with real post
        final index = _posts.indexWhere((p) => p.id == post.id);
        if (index != -1) {
          _posts[index] = newPost;
          await _updateLocalPost(post.id, newPost);
          notifyListeners();
          print('✅ Post synced to backend with ID: ${newPost.id}');
          
          // Clear cache to force refresh for other users
          await _clearPostsCache();
        }
      } else {
        print('⚠️ Backend returned invalid post data');
      }
    } catch (e) {
      print('❌ Backend sync failed: $e - keeping local post');
      // Post remains local-only with temp ID
    }
  }
  
  // Force refresh for all users (call this when new posts are created)
  Future<void> refreshFeed() async {
    await loadPosts(refresh: true);
  }
  
  Future<void> _updateLocalPost(String tempId, CommunityPost realPost) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existingPosts = prefs.getStringList('local_posts') ?? [];
      
      // Find and replace the temp post
      for (int i = 0; i < existingPosts.length; i++) {
        final postData = jsonDecode(existingPosts[i]);
        if (postData['id'] == tempId) {
          final updatedPost = {
            'id': realPost.id,
            'userId': realPost.userId,
            'userName': realPost.userName,
            'userAvatar': realPost.userAvatar,
            'content': realPost.content,
            'images': realPost.images,
            'location': realPost.location,
            'createdAt': realPost.createdAt.toIso8601String(),
            'likesCount': realPost.likesCount,
            'commentsCount': realPost.commentsCount,
            'isLiked': realPost.isLiked,
            'postType': realPost.postType.name,
            'isSaved': realPost.isSaved,
          };
          existingPosts[i] = jsonEncode(updatedPost);
          break;
        }
      }
      
      await prefs.setStringList('local_posts', existingPosts);
    } catch (e) {
      print('❌ Error updating local post: $e');
    }
  }
  
  PostType _getPostTypeFromString(String postType) {
    switch (postType.toLowerCase()) {
      case 'photo': return PostType.photo;
      case 'review': return PostType.review;
      case 'tip': return PostType.tip;
      case 'experience': return PostType.experience;
      case 'question': return PostType.question;
      case 'tripDiary': return PostType.tripDiary;
      default: return PostType.story;
    }
  }
  
  Future<void> _syncUserProfileToBackend(CurrentUser user) async {
    try {
      final userId = user.mongoId ?? user.uid;
      if (userId == null) return;
      
      await _apiService.updateUser({
        'username': user.username,
        'email': user.email,
        'profilePicture': user.profilePicture?.startsWith('http') == true ? user.profilePicture : null,
        'tier': user.tier.name ?? 'free',
      });
      print('✅ User profile synced to backend');
    } catch (e) {
      print('⚠️ Profile sync failed: $e');
    }
  }
  
  void updateUserProfileInPosts(CurrentUser user) {
    bool hasChanges = false;
    
    for (int i = 0; i < _posts.length; i++) {
      final post = _posts[i];
      if (post.userId == user.mongoId || post.userId == user.uid || post.userName == user.username) {
        _posts[i] = CommunityPost(
          id: post.id,
          userId: post.userId,
          userName: user.username ?? post.userName,
          userAvatar: user.profilePicture?.startsWith('http') == true 
              ? user.profilePicture! 
              : post.userAvatar,
          content: post.content,
          images: post.images,
          location: post.location,
          createdAt: post.createdAt,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          isLiked: post.isLiked,
          postType: post.postType,
          hashtags: post.hashtags,
          metadata: post.metadata,
          isSaved: post.isSaved,
        );
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      notifyListeners();
      print('✅ Updated ${_posts.where((p) => p.userId == user.mongoId || p.userId == user.uid).length} posts with new profile data');
    }
  }
}