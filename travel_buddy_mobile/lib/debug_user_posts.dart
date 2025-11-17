import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'config/environment.dart';

Future<void> debugUserPosts() async {
  final dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
    },
  ));

  final user = FirebaseAuth.instance.currentUser;
  if (user == null) {
    print('❌ No Firebase user logged in');
    return;
  }

  print('🔍 Current Firebase User:');
  print('  UID: ${user.uid}');
  print('  Email: ${user.email}');
  print('  Name: ${user.displayName}');

  try {
    // 1. Check if user exists in backend
    print('\n🔍 Checking if user exists in backend...');
    try {
      final userResponse = await dio.get('/api/users/firebase/${user.uid}');
      print('✅ User exists in backend: ${userResponse.data}');
    } catch (e) {
      print('❌ User not found in backend, creating...');
      
      // Create user in backend
      final createResponse = await dio.post('/api/users', data: {
        'firebaseUid': user.uid,
        'email': user.email,
        'username': user.displayName ?? 'User',
        'profilePicture': user.photoURL ?? '',
      });
      
      if (createResponse.statusCode == 200 || createResponse.statusCode == 201) {
        print('✅ User created in backend: ${createResponse.data}');
      } else {
        print('❌ Failed to create user: ${createResponse.statusCode}');
      }
    }

    // 2. Get all posts and check which belong to current user
    print('\n🔍 Fetching all posts...');
    final postsResponse = await dio.get('/api/community/posts');
    
    List<dynamic> posts;
    if (postsResponse.data is List) {
      posts = postsResponse.data;
    } else if (postsResponse.data is Map && postsResponse.data['posts'] != null) {
      posts = postsResponse.data['posts'];
    } else {
      posts = [];
    }

    print('📊 Total posts: ${posts.length}');
    
    if (posts.isNotEmpty) {
      print('\n🔍 Post analysis:');
      for (int i = 0; i < posts.length && i < 5; i++) {
        final post = posts[i];
        print('  Post ${i + 1}:');
        print('    ID: ${post['_id'] ?? post['id']}');
        print('    UserID: ${post['userId']}');
        print('    Author: ${post['author']?['name'] ?? 'Unknown'}');
        print('    Content: ${post['content']?['text'] ?? post['content'] ?? 'No content'}');
        print('    Created: ${post['createdAt']}');
        
        // Check if this post belongs to current user
        if (post['userId'] == user.uid) {
          print('    ✅ This post belongs to current user!');
        }
      }
    }

    // 3. Try creating a test post
    print('\n🔍 Creating test post...');
    final testPostResponse = await dio.post('/api/community/posts', data: {
      'userId': user.uid,
      'content': {
        'text': 'Debug test post - ${DateTime.now()}',
        'images': [],
      },
      'author': {
        'name': user.displayName ?? 'Test User',
        'avatar': user.photoURL ?? '',
        'location': 'Debug Location',
        'verified': false,
      },
      'tags': ['debug', 'test'],
      'category': 'story',
    });

    if (testPostResponse.statusCode == 200 || testPostResponse.statusCode == 201) {
      print('✅ Test post created: ${testPostResponse.data}');
    } else {
      print('❌ Failed to create test post: ${testPostResponse.statusCode}');
    }

  } catch (e) {
    print('❌ Debug error: $e');
  }
}

void main() async {
  await debugUserPosts();
}