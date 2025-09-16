  Future<void> likePost(String postId) async {
    try {
      await _dio.post('/api/posts/$postId/like');
    } catch (e) {
      print('Error liking post: $e');
      throw Exception('Failed to like post');
    }
  }

  Future<void> unlikePost(String postId) async {
    try {
      await _dio.delete('/api/posts/$postId/like');
    } catch (e) {
      print('Error unliking post: $e');
      throw Exception('Failed to unlike post');
    }
  }

  Future<void> savePost(String postId) async {
    try {
      await _dio.post('/api/posts/$postId/save');
    } catch (e) {
      print('Error saving post: $e');
      throw Exception('Failed to save post');
    }
  }

  Future<void> unsavePost(String postId) async {
    try {
      await _dio.delete('/api/posts/$postId/save');
    } catch (e) {
      print('Error unsaving post: $e');
      throw Exception('Failed to unsave post');
    }
  }

  Future<List<Comment>> getPostComments(String postId) async {
    try {
      final response = await _dio.get('/api/posts/$postId/comments');
      return (response.data as List).map((json) => Comment.fromJson(json)).toList();
    } catch (e) {
      print('Error getting comments: $e');
      return [];
    }
  }

  Future<Comment> addComment(String postId, String content) async {
    try {
      final response = await _dio.post('/api/posts/$postId/comments', data: {
        'content': content,
      });
      return Comment.fromJson(response.data);
    } catch (e) {
      print('Error adding comment: $e');
      throw Exception('Failed to add comment');
    }
  }

  Future<void> deleteComment(String postId, String commentId) async {
    try {
      await _dio.delete('/api/posts/$postId/comments/$commentId');
    } catch (e) {
      print('Error deleting comment: $e');
      throw Exception('Failed to delete comment');
    }
  }
