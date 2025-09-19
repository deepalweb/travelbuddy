import 'package:flutter/material.dart';
import '../models/community_post.dart';
import '../models/travel_enums.dart';
import '../services/api_service.dart';

class CommunityProvider with ChangeNotifier {
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

  Future<void> loadPosts({bool refresh = false}) async {
    if (_isLoading) return;

    if (refresh) {
      _currentPage = 1;
      _posts.clear();
      _hasMorePosts = true;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newPosts = await _apiService.getCommunityPosts(
        page: _currentPage,
        limit: 20,
      );

      if (newPosts.isNotEmpty) {
        if (refresh) {
          _posts = newPosts;
        } else {
          _posts.addAll(newPosts);
        }
        
        // For now, assume we have more posts if we got the full limit
        _hasMorePosts = newPosts.length >= 20;
        _currentPage++;
      } else {
        _hasMorePosts = false;
      }
    } catch (e) {
      _error = 'Failed to load posts: $e';
      print('Community provider error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
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

    try {
      await _apiService.toggleLike(postId, username: 'mobile_user');
    } catch (e) {
      // Revert on error
      _posts[postIndex] = post;
      notifyListeners();
    }
  }

  Future<bool> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    bool allowComments = true,
    String visibility = 'public',
  }) async {
    try {
      print('🚀 Creating post with content: $content');
      final newPost = await _apiService.createPost(
        content: content,
        location: location,
        images: images,
        postType: postType,
        hashtags: hashtags,
        allowComments: allowComments,
        visibility: visibility,
        userId: '507f1f77bcf86cd799439011', // Consistent mobile user ID
        username: 'Mobile User',
      );

      if (newPost != null) {
        print('✅ Post created successfully: ${newPost.id}');
        _posts.insert(0, newPost);
        notifyListeners();
        
        // Also refresh the feed to ensure we have the latest data
        await loadPosts(refresh: true);
        return true;
      } else {
        print('❌ Post creation returned null');
      }
      return false;
    } catch (e) {
      print('❌ Error creating post: $e');
      _error = 'Failed to create post: $e';
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> searchPosts(String query) async {
    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final searchResults = await _apiService.searchPosts(query);
      _posts = searchResults;
      _hasMorePosts = false; // No pagination for search
    } catch (e) {
      _error = 'Failed to search posts: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> filterPosts(PostType? postType) async {
    if (_isLoading) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final allPosts = await _apiService.getCommunityPosts(page: 1, limit: 100);
      if (postType != null) {
        _posts = allPosts.where((post) => post.postType == postType).toList();
      } else {
        _posts = allPosts;
      }
      _hasMorePosts = false;
    } catch (e) {
      _error = 'Failed to filter posts: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleBookmark(String postId) async {
    try {
      final success = await _apiService.toggleBookmark(postId);
      if (success) {
        final postIndex = _posts.indexWhere((post) => post.id == postId);
        if (postIndex != -1) {
          final post = _posts[postIndex];
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
            isSaved: !post.isSaved,
            metadata: post.metadata,
          );
          notifyListeners();
        }
      }
      return success;
    } catch (e) {
      _error = 'Failed to toggle bookmark: $e';
      notifyListeners();
      return false;
    }
  }
}