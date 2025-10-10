import 'dart:convert';
import 'dart:math';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/community_post.dart' as community;
import '../models/travel_enums.dart';

class MockBackendService {
  static final MockBackendService _instance = MockBackendService._internal();
  factory MockBackendService() => _instance;
  MockBackendService._internal();

  // Simulate database collections
  static const String _postsKey = 'mock_db_posts';
  static const String _likesKey = 'mock_db_likes';
  static const String _commentsKey = 'mock_db_comments';

  // Mock API: Get Community Posts
  Future<List<community.CommunityPost>> getCommunityPosts({int page = 1, int limit = 10}) async {
    await Future.delayed(Duration(milliseconds: 500)); // Simulate network delay
    
    final prefs = await SharedPreferences.getInstance();
    final postsJson = prefs.getStringList(_postsKey) ?? [];
    
    final posts = postsJson.map((json) {
      try {
        final data = jsonDecode(json);
        return community.CommunityPost.fromJson(data);
      } catch (e) {
        return null;
      }
    }).where((post) => post != null).cast<community.CommunityPost>().toList();
    
    // Sort by creation date (newest first)
    posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    
    // Paginate
    final startIndex = (page - 1) * limit;
    final endIndex = startIndex + limit;
    
    if (startIndex >= posts.length) return [];
    
    final paginatedPosts = posts.sublist(
      startIndex, 
      endIndex > posts.length ? posts.length : endIndex
    );
    
    print('📊 Mock DB: Loaded ${paginatedPosts.length} posts (page $page)');
    return paginatedPosts;
  }

  // Mock API: Create Post
  Future<community.CommunityPost?> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    bool allowComments = true,
    String visibility = 'public',
    String? userId,
    String? username,
  }) async {
    await Future.delayed(Duration(milliseconds: 800)); // Simulate network delay
    
    // Generate real post ID
    final postId = 'post_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(1000)}';
    
    final newPost = community.CommunityPost(
      id: postId,
      userId: userId ?? 'user_${Random().nextInt(1000)}',
      userName: username ?? 'Mock User',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      content: content,
      images: images,
      location: location,
      createdAt: DateTime.now(),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      postType: _getPostTypeFromString(postType),
      hashtags: hashtags,
    );
    
    // Save to mock database
    final prefs = await SharedPreferences.getInstance();
    final existingPosts = prefs.getStringList(_postsKey) ?? [];
    existingPosts.insert(0, jsonEncode(newPost.toJson()));
    
    // Keep only last 100 posts
    if (existingPosts.length > 100) {
      existingPosts.removeRange(100, existingPosts.length);
    }
    
    await prefs.setStringList(_postsKey, existingPosts);
    
    print('✅ Mock DB: Post created with ID: $postId');
    return newPost;
  }

  // Mock API: Toggle Like
  Future<bool> toggleLike(String postId, {String? userId, String? username}) async {
    await Future.delayed(Duration(milliseconds: 300)); // Simulate network delay
    
    final prefs = await SharedPreferences.getInstance();
    
    // Update post likes count
    final postsJson = prefs.getStringList(_postsKey) ?? [];
    bool postFound = false;
    
    for (int i = 0; i < postsJson.length; i++) {
      final postData = jsonDecode(postsJson[i]);
      if (postData['id'] == postId) {
        final currentLikes = postData['likesCount'] ?? 0;
        final isLiked = postData['isLiked'] ?? false;
        
        postData['likesCount'] = isLiked ? currentLikes - 1 : currentLikes + 1;
        postData['isLiked'] = !isLiked;
        
        postsJson[i] = jsonEncode(postData);
        postFound = true;
        break;
      }
    }
    
    if (postFound) {
      await prefs.setStringList(_postsKey, postsJson);
      
      // Store like record
      final likes = prefs.getStringList(_likesKey) ?? [];
      final likeId = '${postId}_${userId ?? 'anonymous'}';
      
      if (likes.contains(likeId)) {
        likes.remove(likeId);
      } else {
        likes.add(likeId);
      }
      
      await prefs.setStringList(_likesKey, likes);
      print('✅ Mock DB: Like toggled for post $postId');
      return true;
    }
    
    return false;
  }

  // Mock API: Toggle Bookmark
  Future<bool> toggleBookmark(String postId) async {
    await Future.delayed(Duration(milliseconds: 300)); // Simulate network delay
    
    final prefs = await SharedPreferences.getInstance();
    final bookmarks = prefs.getStringList('mock_db_bookmarks') ?? [];
    
    if (bookmarks.contains(postId)) {
      bookmarks.remove(postId);
      print('✅ Mock DB: Bookmark removed for post $postId');
    } else {
      bookmarks.add(postId);
      print('✅ Mock DB: Bookmark added for post $postId');
    }
    
    await prefs.setStringList('mock_db_bookmarks', bookmarks);
    return true;
  }

  // Mock API: Add Comment
  Future<community.Comment> addComment(String postId, String content) async {
    await Future.delayed(Duration(milliseconds: 600)); // Simulate network delay
    
    final commentId = 'comment_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(1000)}';
    
    final comment = community.Comment(
      id: commentId,
      postId: postId,
      userId: 'user_${Random().nextInt(1000)}',
      userName: 'Mock Commenter',
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      content: content,
      createdAt: DateTime.now(),
    );
    
    // Save comment
    final prefs = await SharedPreferences.getInstance();
    final comments = prefs.getStringList(_commentsKey) ?? [];
    comments.add(jsonEncode(comment.toJson()));
    await prefs.setStringList(_commentsKey, comments);
    
    // Update post comments count
    final postsJson = prefs.getStringList(_postsKey) ?? [];
    for (int i = 0; i < postsJson.length; i++) {
      final postData = jsonDecode(postsJson[i]);
      if (postData['id'] == postId) {
        postData['commentsCount'] = (postData['commentsCount'] ?? 0) + 1;
        postsJson[i] = jsonEncode(postData);
        break;
      }
    }
    await prefs.setStringList(_postsKey, postsJson);
    
    print('✅ Mock DB: Comment added to post $postId');
    return comment;
  }

  // Mock API: Get Comments
  Future<List<community.Comment>> getPostComments(String postId) async {
    await Future.delayed(Duration(milliseconds: 400)); // Simulate network delay
    
    final prefs = await SharedPreferences.getInstance();
    final commentsJson = prefs.getStringList(_commentsKey) ?? [];
    
    final comments = commentsJson.map((json) {
      try {
        final data = jsonDecode(json);
        return community.Comment.fromJson(data);
      } catch (e) {
        return null;
      }
    }).where((comment) => comment != null && comment!.postId == postId)
      .cast<community.Comment>().toList();
    
    comments.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    
    print('📊 Mock DB: Loaded ${comments.length} comments for post $postId');
    return comments;
  }

  // Helper method
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

  // Clear mock database (for testing)
  Future<void> clearMockDatabase() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_postsKey);
    await prefs.remove(_likesKey);
    await prefs.remove(_commentsKey);
    await prefs.remove('mock_db_bookmarks');
    print('🗑️ Mock DB: Database cleared');
  }
}