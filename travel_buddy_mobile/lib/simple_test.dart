import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(SimpleTestApp());
}

class SimpleTestApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: SimpleTest());
  }
}

class SimpleTest extends StatefulWidget {
  @override
  State<SimpleTest> createState() => _SimpleTestState();
}

class _SimpleTestState extends State<SimpleTest> {
  String _result = 'Ready to test';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Simple Backend Test')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            Text(_result),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _testBackend,
              child: Text('Test Backend'),
            ),
          ],
        ),
      ),
    );
  }

  void _testBackend() async {
    setState(() => _result = 'Testing...');
    
    try {
      final url = 'http://localhost:3001/api/places/mobile/nearby?q=restaurants&lat=40.7128&lng=-74.0060';
      print('🔍 Calling: $url');
      
      final response = await http.get(Uri.parse(url));
      print('📡 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() => _result = 'Success!\nStatus: ${response.statusCode}\nData type: ${data.runtimeType}\nKeys: ${data is Map ? data.keys.toList() : 'Not a map'}\nLength: ${data is List ? data.length : data is Map && data.containsKey('results') ? data['results'].length : 'Unknown'}');
      } else {
        setState(() => _result = 'Error: ${response.statusCode}\n${response.body}');
      }
    } catch (e) {
      setState(() => _result = 'Exception: $e');
    }
  }
}