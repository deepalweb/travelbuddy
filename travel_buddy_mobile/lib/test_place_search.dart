import 'package:flutter/material.dart';
import 'examples/place_search_example.dart';

void main() {
  runApp(TestApp());
}

class TestApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Test Place Search',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: PlaceSearchExample(),
    );
  }
}