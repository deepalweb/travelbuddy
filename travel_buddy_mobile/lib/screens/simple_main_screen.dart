import 'package:flutter/material.dart';

class SimpleMainScreen extends StatelessWidget {
  const SimpleMainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Buddy'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.travel_explore,
              size: 100,
              color: Colors.blue,
            ),
            SizedBox(height: 20),
            Text(
              'Welcome to Travel Buddy!',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Your AI-powered travel companion',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            SizedBox(height: 30),
            Card(
              margin: EdgeInsets.all(20),
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    ListTile(
                      leading: Icon(Icons.check_circle, color: Colors.green),
                      title: Text('API Connection Ready'),
                      subtitle: Text('Connected to unified backend'),
                    ),
                    ListTile(
                      leading: Icon(Icons.mobile_friendly, color: Colors.blue),
                      title: Text('Mobile Optimized'),
                      subtitle: Text('Platform-specific responses'),
                    ),
                    ListTile(
                      leading: Icon(Icons.sync, color: Colors.orange),
                      title: Text('Shared Data'),
                      subtitle: Text('Synced with web application'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}