import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';
import '../models/community_post.dart' as community;
import '../utils/debug_logger.dart';

class CommunityApiService {
  static const String _baseUrl = Environment.backendUrl;

  // Get community posts from real backend
  static Future<List<community.CommunityPost>> getCommunityPosts({
    int page = 1, 
    int limit = 10
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/community/posts?page=$page&limit=$limit'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => community.CommunityPost.fromJson(json)).toList();
      }
    } catch (e) {
      DebugLogger.error('Failed to load community posts: $e');
    }
    return [];
  }

  // Create new post
  static Future<community.CommunityPost?> createPost({
    required String content,
    required String location,
    List<String> images = const [],
    String postType = 'story',
    List<String> hashtags = const [],
    String? userId,
    String? username,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/community/posts'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'content': {'text': content, 'images': images},
          'author': {'name': username ?? 'Anonymous', 'location': location},
          'tags': hashtags,
          'category': postType,
          'userId': userId,
        }),
      );

      if (response.statusCode == 201) {
        return community.CommunityPost.fromJson(json.decode(response.body));
      }
    } catch (e) {
      DebugLogger.error('Failed to create post: $e');
    }
    return null;
  }

  // Toggle like
  static Future<bool> toggleLike(String postId, {String? userId}) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/posts/$postId/like'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': userId ?? 'anonymous'}),
      );
      return response.statusCode == 200;
    } catch (e) {
      DebugLogger.error('Failed to toggle like: $e');
      return false;
    }
  }

  // Add comment
  static Future<community.Comment?> addComment(String postId, String content, {String? userId}) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/posts/$postId/comments'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'text': content,
          'userId': userId ?? 'anonymous',
          'username': 'User'
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final comments = data['comments'] ?? [];
        if (comments.isNotEmpty) {
          return community.Comment.fromJson(comments.last);
        }
      }
    } catch (e) {
      DebugLogger.error('Failed to add comment: $e');
    }
    return null;
  }

  // Get comments
  static Future<List<community.Comment>> getPostComments(String postId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/posts/$postId/comments'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final comments = data['comments'] ?? data ?? [];
        return List<dynamic>.from(comments).map((json) => community.Comment.fromJson(json)).toList();
      }
    } catch (e) {
      DebugLogger.error('Failed to load comments: $e');
    }
    return [];
  }

  // Delete post
  static Future<bool> deletePost(String postId) async {
    try {
      final response = await http.delete(
        Uri.parse('$_baseUrl/api/posts/$postId'),
        headers: {'Content-Type': 'application/json'},
      );
      return response.statusCode == 200;
    } catch (e) {
      DebugLogger.error('Failed to delete post: $e');
      return false;
    }
  }

  // Edit post
  static Future<community.CommunityPost?> editPost({
    required String postId,
    required String content,
    required String location,
    List<String> images = const [],
    List<String> hashtags = const [],
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$_baseUrl/api/posts/$postId'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'content': {'text': content, 'images': images},
          'tags': hashtags,
          'category': 'general',
        }),
      );

      if (response.statusCode == 200) {
        return community.CommunityPost.fromJson(json.decode(response.body));
      }
    } catch (e) {
      DebugLogger.error('Failed to edit post: $e');
    }
    return null;
  }
}