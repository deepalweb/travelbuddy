import '../../core/services/api_service.dart';
import '../../core/models/post.dart';

class SocialService {
  final ApiService _apiService = ApiService();

  Future<List<Post>> getPosts({int limit = 20}) async {
    try {
      final response = await _apiService.get('/posts?limit=$limit');
      
      if (response is List) {
        return response.map((json) => Post.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      throw Exception('Failed to load posts: $e');
    }
  }

  Future<Post> createPost(String text, {List<String>? images}) async {
    try {
      final response = await _apiService.post('/posts', body: {
        'content': {
          'text': text,
          'images': images ?? [],
        },
        'author': {
          'name': 'Current User', // This should come from auth
          'verified': false,
        },
        'engagement': {
          'likes': 0,
          'comments': 0,
          'shares': 0,
        },
        'tags': [],
      });

      return Post.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create post: $e');
    }
  }

  Future<void> likePost(String postId, {String? userId}) async {
    try {
      await _apiService.post('/posts/$postId/like', body: {
        'userId': userId ?? 'anonymous',
      });
    } catch (e) {
      throw Exception('Failed to like post: $e');
    }
  }

  Future<void> addComment(String postId, String text, {String? userId}) async {
    try {
      await _apiService.post('/posts/$postId/comments', body: {
        'userId': userId,
        'text': text,
      });
    } catch (e) {
      throw Exception('Failed to add comment: $e');
    }
  }

  Future<List<PostComment>> getComments(String postId) async {
    try {
      final response = await _apiService.get('/posts/$postId/comments');
      
      if (response['comments'] is List) {
        return (response['comments'] as List)
            .map((json) => PostComment.fromJson(json))
            .toList();
      }
      
      return [];
    } catch (e) {
      throw Exception('Failed to load comments: $e');
    }
  }
}