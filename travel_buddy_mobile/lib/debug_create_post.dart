import 'package:dio/dio.dart';
import 'config/environment.dart';

Future<void> debugCreatePost() async {
  final dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': 'test-user',
    },
  ));

  // Test different data formats
  final formats = [
    {
      'name': 'Format 1 - Simple',
      'data': {
        'content': 'Test post from mobile app',
        'location': 'Test Location',
      }
    },
    {
      'name': 'Format 2 - With author',
      'data': {
        'content': 'Test post from mobile app',
        'location': 'Test Location',
        'author': {
          'name': 'Test User',
          'location': 'Test Location',
        }
      }
    },
    {
      'name': 'Format 3 - Backend format',
      'data': {
        'userId': 'test-user',
        'content': {
          'text': 'Test post from mobile app',
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
      }
    }
  ];

  for (final format in formats) {
    print('\n🧪 Testing ${format['name']}...');
    try {
      final response = await dio.post('/api/community/posts', data: format['data']);
      print('✅ Success: ${response.statusCode}');
      print('Response: ${response.data}');
      break; // Stop on first success
    } catch (e) {
      if (e is DioException) {
        print('❌ Failed: ${e.response?.statusCode}');
        print('Error: ${e.response?.data}');
      } else {
        print('❌ Error: $e');
      }
    }
  }
}

void main() async {
  await debugCreatePost();
}