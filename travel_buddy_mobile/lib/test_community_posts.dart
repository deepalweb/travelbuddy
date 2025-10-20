import 'package:dio/dio.dart';
import 'config/environment.dart';
import 'models/community_post.dart';

class CommunityPostsTest {
  late Dio dio;
  
  CommunityPostsTest() {
    dio = Dio(BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user',
      },
    ));
  }

  Future<void> runAllTests() async {
    print('🧪 Starting Community Posts API Tests...\n');
    
    await testBackendConnectivity();
    await testFetchPosts();
    await testCreatePost();
    await testLikePost();
    await testGetComments();
    await testAddComment();
    
    print('\n✅ All tests completed!');
  }

  Future<void> testBackendConnectivity() async {
    print('🔗 Testing backend connectivity...');
    try {
      final response = await dio.get('/health');
      if (response.statusCode == 200) {
        print('✅ Backend accessible: ${response.data}');
      } else {
        print('⚠️ Backend returned: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Backend connectivity failed: $e');
    }
    print('');
  }

  Future<void> testFetchPosts() async {
    print('📋 Testing fetch community posts...');
    try {
      final response = await dio.get('/api/community/posts', queryParameters: {
        'limit': 10,
        'page': 1,
      });
      
      if (response.statusCode == 200) {
        List<dynamic> posts;
        if (response.data is List) {
          posts = response.data;
        } else if (response.data is Map && response.data['posts'] != null) {
          posts = response.data['posts'];
        } else {
          posts = [];
        }
        
        print('✅ Fetched ${posts.length} posts');
        
        if (posts.isNotEmpty) {
          final firstPost = posts[0];
          final communityPost = CommunityPost.fromJson(firstPost);
          print('✅ Successfully parsed post: ${communityPost.id}');
        }
      } else {
        print('❌ Failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Fetch posts failed: $e');
    }
    print('');
  }

  Future<void> testCreatePost() async {
    print('📝 Testing create post...');
    try {
      // Get a real userId from existing posts
      final postsResponse = await dio.get('/api/community/posts', queryParameters: {'limit': 1});
      
      List<dynamic> posts;
      if (postsResponse.data is List) {
        posts = postsResponse.data;
      } else if (postsResponse.data is Map && postsResponse.data['posts'] != null) {
        posts = postsResponse.data['posts'];
      } else {
        posts = [];
      }
      
      if (posts.isEmpty) {
        print('⚠️ No existing posts to get userId from');
        return;
      }
      
      final realUserId = posts[0]['userId'];
      
      final postData = {
        'userId': realUserId,
        'content': {
          'text': 'Test post from mobile app - ${DateTime.now()}',
          'images': [],
        },
        'author': {
          'name': 'Test User',
          'avatar': '',
          'location': 'Test Location',
          'verified': false,
        },
        'tags': ['test', 'mobile'],
        'category': 'story',
      };
      
      final response = await dio.post('/api/community/posts', data: postData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final createdPost = CommunityPost.fromJson(response.data);
        print('✅ Created post with ID: ${createdPost.id}');
      } else {
        print('❌ Failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Create post failed: $e');
    }
    print('');
  }

  Future<void> testLikePost() async {
    print('👍 Testing like post...');
    try {
      final postsResponse = await dio.get('/api/community/posts', queryParameters: {'limit': 1});
      
      List<dynamic> posts;
      if (postsResponse.data is List) {
        posts = postsResponse.data;
      } else if (postsResponse.data is Map && postsResponse.data['posts'] != null) {
        posts = postsResponse.data['posts'];
      } else {
        posts = [];
      }
      
      if (posts.isEmpty) {
        print('⚠️ No posts available to like');
        return;
      }
      
      final postId = posts[0]['_id'] ?? posts[0]['id'];
      
      final response = await dio.post('/api/posts/$postId/like', data: {
        'userId': 'test-user',
        'username': 'Test User',
      });
      
      if (response.statusCode == 200) {
        print('✅ Successfully liked post: $postId');
      } else {
        print('❌ Failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Like post failed: $e');
    }
    print('');
  }

  Future<void> testGetComments() async {
    print('💬 Testing get comments...');
    try {
      final postsResponse = await dio.get('/api/community/posts', queryParameters: {'limit': 1});
      
      List<dynamic> posts;
      if (postsResponse.data is List) {
        posts = postsResponse.data;
      } else if (postsResponse.data is Map && postsResponse.data['posts'] != null) {
        posts = postsResponse.data['posts'];
      } else {
        posts = [];
      }
      
      if (posts.isEmpty) {
        print('⚠️ No posts available to get comments');
        return;
      }
      
      final postId = posts[0]['_id'] ?? posts[0]['id'];
      
      final response = await dio.get('/api/posts/$postId/comments');
      
      if (response.statusCode == 200) {
        final comments = response.data['comments'] ?? response.data;
        print('✅ Fetched ${comments.length} comments for post: $postId');
      } else {
        print('❌ Failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Get comments failed: $e');
    }
    print('');
  }

  Future<void> testAddComment() async {
    print('✍️ Testing add comment...');
    try {
      final postsResponse = await dio.get('/api/community/posts', queryParameters: {'limit': 1});
      
      List<dynamic> posts;
      if (postsResponse.data is List) {
        posts = postsResponse.data;
      } else if (postsResponse.data is Map && postsResponse.data['posts'] != null) {
        posts = postsResponse.data['posts'];
      } else {
        posts = [];
      }
      
      if (posts.isEmpty) {
        print('⚠️ No posts available to comment on');
        return;
      }
      
      final postId = posts[0]['_id'] ?? posts[0]['id'];
      
      final response = await dio.post('/api/posts/$postId/comments', data: {
        'text': 'Test comment from mobile app - ${DateTime.now()}',
        'username': 'Test User',
      });
      
      if (response.statusCode == 200) {
        print('✅ Successfully added comment to post: $postId');
      } else {
        print('❌ Failed with status: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Add comment failed: $e');
    }
    print('');
  }
}

// Usage function
Future<void> testCommunityPosts() async {
  final tester = CommunityPostsTest();
  await tester.runAllTests();
}