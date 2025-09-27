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
        limit: 10,
      );

      if (newPosts.isNotEmpty) {
        if (refresh) {
          _posts = newPosts;
        } else {
          _posts.addAll(newPosts);
        }
        
        _hasMorePosts = newPosts.length >= 10;
        _currentPage++;
      } else {
        _hasMorePosts = false;
      }
    } catch (e) {
      _error = 'Failed to load posts: $e';
      print('Community provider error: $e');
      
      if (_posts.isNotEmpty) {
        print('💾 Keeping ${_posts.length} optimistic posts visible despite fetch error');
        _error = 'Using offline posts - backend unavailable';
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadLocalPosts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localPosts = prefs.getStringList('local_posts') ?? [];
      
      final posts = localPosts.map((postJson) {
        try {
          final json = jsonDecode(postJson) as Map<String, dynamic>;
          return CommunityPost(
            id: json['id'] ?? '',
            userId: json['userId'] ?? '',
            userName: json['userName'] ?? 'User',
            userAvatar: json['userAvatar'] ?? '',
            content: json['content'] ?? '',
            images: List<String>.from(json['images'] ?? []),
            location: json['location'] ?? '',
            createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
            likesCount: json['likesCount'] ?? 0,
            commentsCount: json['commentsCount'] ?? 0,
            isLiked: json['isLiked'] ?? false,
            postType: PostType.fromString(json['postType'] ?? 'story'),
            isSaved: json['isSaved'] ?? false,
            metadata: {},
          );
        } catch (e) {
          print('❌ Error parsing local post: $e');
          return null;
        }
      }).where((post) => post != null).cast<CommunityPost>().toList();
      
      _posts = posts;
      print('📺 [FEED] Loaded ${posts.length} posts from local storage');
      if (posts.isNotEmpty) {
        print('📺 [FEED] First local post: "${posts.first.content}"');
        print('📺 [FEED] First local post user: ${posts.first.userName}');
      }
      notifyListeners();
      print('📺 [FEED] Notified listeners after loading local posts');
    } catch (e) {
      print('❌ [PROVIDER] Error loading local posts: $e');
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
      _posts[postIndex] = post;
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
      return false;
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
    BuildContext? context,
  }) async {
    try {
      CurrentUser? currentUser;
      if (context != null) {
        final appProvider = Provider.of<AppProvider>(context, listen: false);
        currentUser = appProvider.currentUser;
        print('👤 [PROVIDER] Current user: ${currentUser?.username}');
        print('👤 [PROVIDER] Current user UID: ${currentUser?.uid}');
        print('👤 [PROVIDER] Profile picture: "${currentUser?.profilePicture}"');
        print('👤 [PROVIDER] Profile picture is empty: ${currentUser?.profilePicture?.isEmpty}');
        print('👤 [PROVIDER] Profile picture is fallback: ${currentUser?.profilePicture?.contains("unsplash")}');
      }
      
      final optimisticPost = CommunityPost(
        id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
        userId: currentUser?.uid ?? '507f1f77bcf86cd799439011',
        userName: currentUser?.username ?? 'Mobile User',
        userAvatar: (currentUser?.profilePicture?.isNotEmpty == true) 
            ? currentUser!.profilePicture! 
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
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
      print('📺 [FEED] Post added to feed at index 0');
      print('📺 [FEED] Total posts now: ${_posts.length}');
      print('📺 [FEED] Post content: "${optimisticPost.content}"');
      print('📺 [FEED] Post user: ${optimisticPost.userName}');
      print('📺 [FEED] Post avatar: ${optimisticPost.userAvatar}');
      notifyListeners();
      print('📺 [FEED] Notified listeners - UI should update');
      
      await _savePostLocally(optimisticPost);
      _tryBackendSaveInBackground(optimisticPost, currentUser);
      
      return true;
    } catch (e) {
      print('❌ [PROVIDER] Error creating post: $e');
      return true;
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
      final newPost = await _apiService.createPost(
        content: post.content,
        location: post.location,
        images: post.images,
        postType: post.postType.name,
        hashtags: [],
        allowComments: true,
        visibility: 'public',
        userId: currentUser?.uid ?? '507f1f77bcf86cd799439011',
        username: currentUser?.username ?? 'Mobile User',
      );
      
      if (newPost != null && newPost.id.isNotEmpty && !newPost.id.startsWith('temp_')) {
        final index = _posts.indexWhere((p) => p.id == post.id);
        if (index != -1) {
          _posts[index] = newPost;
          notifyListeners();
        }
      }
    } catch (e) {
      print('⚠️ [PROVIDER] Backend save failed: $e - keeping local post');
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
}