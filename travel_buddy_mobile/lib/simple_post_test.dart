import 'dart:convert';
import 'dart:io';

Future<void> testPosts() async {
  final client = HttpClient();
  
  try {
    // Test 1: Get posts
    print('🔍 Testing GET posts...');
    final getRequest = await client.getUrl(Uri.parse('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/community/posts'));
    final getResponse = await getRequest.close();
    final getBody = await getResponse.transform(utf8.decoder).join();
    
    print('Status: ${getResponse.statusCode}');
    final posts = jsonDecode(getBody);
    print('Posts count: ${posts.length}');
    
    if (posts.isNotEmpty) {
      print('First post: ${posts[0]}');
    }
    
    // Test 2: Create post
    print('\n🔍 Testing POST create...');
    final postRequest = await client.postUrl(Uri.parse('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/community/posts'));
    postRequest.headers.set('Content-Type', 'application/json');
    
    final postData = {
      'userId': posts.isNotEmpty ? posts[0]['userId'] : '507f1f77bcf86cd799439011',
      'content': {
        'text': 'Simple test post - ${DateTime.now()}',
        'images': [],
      },
      'author': {
        'name': 'Test User',
        'avatar': '',
        'location': 'Test Location',
        'verified': false,
      },
      'tags': ['test'],
      'category': 'story',
    };
    
    postRequest.write(jsonEncode(postData));
    final postResponse = await postRequest.close();
    final postBody = await postResponse.transform(utf8.decoder).join();
    
    print('Create Status: ${postResponse.statusCode}');
    print('Create Response: $postBody');
    
  } catch (e) {
    print('❌ Error: $e');
  } finally {
    client.close();
  }
}

void main() async {
  await testPosts();
}