import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'config/environment.dart';

void main() {
  runApp(BackendCheckerApp());
}

class BackendCheckerApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(home: BackendChecker());
  }
}

class BackendChecker extends StatefulWidget {
  @override
  State<BackendChecker> createState() => _BackendCheckerState();
}

class _BackendCheckerState extends State<BackendChecker> {
  String _results = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Backend Checker')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Backend URL: ${Environment.backendUrl}'),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: _checkEndpoints,
              child: Text('Check Backend Endpoints'),
            ),
            SizedBox(height: 20),
            Expanded(
              child: SingleChildScrollView(
                child: Text(_results),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _checkEndpoints() async {
    setState(() => _results = 'Checking...\n');
    
    final endpoints = [
      '/api/places/search?q=restaurants&lat=40.7128&lng=-74.0060',
      '/api/places/hybrid?q=restaurants&limit=2',
      '/api/search?q=restaurants',
      '/api/config',
      '/api/auth/status',
    ];

    for (final endpoint in endpoints) {
      await _testEndpoint(endpoint);
    }
  }

  Future<void> _testEndpoint(String endpoint) async {
    try {
      final url = '${Environment.backendUrl}$endpoint';
      setState(() => _results += '\n🔍 Testing: $url\n');
      
      final response = await http.get(Uri.parse(url));
      
      setState(() {
        _results += '   Status: ${response.statusCode}\n';
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data is List) {
            _results += '   ✅ Found ${data.length} items\n';
          } else if (data is Map) {
            _results += '   ✅ Response keys: ${data.keys.toList()}\n';
          }
        } else {
          _results += '   ❌ Error: ${response.body}\n';
        }
      });
    } catch (e) {
      setState(() => _results += '   💥 Exception: $e\n');
    }
  }
}