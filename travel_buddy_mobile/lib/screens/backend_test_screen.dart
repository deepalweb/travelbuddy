import 'package:flutter/material.dart';
import '../services/backend_dishes_service.dart';
import '../services/simple_dishes_test.dart';
import '../providers/enhanced_dishes_provider.dart';
import 'package:provider/provider.dart';

class BackendTestScreen extends StatefulWidget {
  @override
  _BackendTestScreenState createState() => _BackendTestScreenState();
}

class _BackendTestScreenState extends State<BackendTestScreen> {
  bool _isTestingConnection = false;
  bool _isLoadingDishes = false;
  Map<String, dynamic>? _backendStatus;
  List<Map<String, dynamic>>? _testDishes;
  String? _error;

  @override
  void initState() {
    super.initState();
    _testConnection();
  }

  Future<void> _testConnection() async {
    setState(() {
      _isTestingConnection = true;
      _error = null;
    });

    try {
      final status = await BackendDishesService.getBackendStatus();
      setState(() {
        _backendStatus = status;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isTestingConnection = false;
      });
    }
  }

  Future<void> _testDishesAPI() async {
    setState(() {
      _isLoadingDishes = true;
      _error = null;
    });

    try {
      // Test with sample coordinates (New York City)
      final dishes = await BackendDishesService.getLocalDishes(
        lat: 40.7128,
        lng: -74.0060,
        limit: 5,
      );
      
      setState(() {
        _testDishes = dishes;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isLoadingDishes = false;
      });
    }
  }

  Future<void> _runSimpleTest() async {
    setState(() {
      _isLoadingDishes = true;
      _error = null;
    });

    try {
      await SimpleDishesTest.runAllTests();
      setState(() {
        _error = 'Check console logs for test results';
      });
    } catch (e) {
      setState(() {
        _error = 'Test failed: $e';
      });
    } finally {
      setState(() {
        _isLoadingDishes = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Backend Test'),
        backgroundColor: Colors.blue,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Backend Status Section
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Backend Status',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    if (_isTestingConnection)
                      Row(
                        children: [
                          CircularProgressIndicator(strokeWidth: 2),
                          SizedBox(width: 8),
                          Text('Testing connection...'),
                        ],
                      )
                    else if (_backendStatus != null) ...[
                      Row(
                        children: [
                          Icon(
                            _backendStatus!['connected'] ? Icons.check_circle : Icons.error,
                            color: _backendStatus!['connected'] ? Colors.green : Colors.red,
                          ),
                          SizedBox(width: 8),
                          Text(
                            _backendStatus!['connected'] ? 'Connected' : 'Disconnected',
                            style: TextStyle(
                              color: _backendStatus!['connected'] ? Colors.green : Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 4),
                      Text('URL: ${_backendStatus!['url']}'),
                      if (_backendStatus!['error'] != null)
                        Text('Error: ${_backendStatus!['error']}', style: TextStyle(color: Colors.red)),
                    ],
                    SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _testConnection,
                      child: Text('Test Connection'),
                    ),
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 16),
            
            // Dishes API Test Section
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Dishes API Test',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: _backendStatus?['connected'] == true ? _testDishesAPI : null,
                          child: Text('Test Dishes API'),
                        ),
                        SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _runSimpleTest,
                          child: Text('Simple Test'),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    if (_isLoadingDishes)
                      Row(
                        children: [
                          CircularProgressIndicator(strokeWidth: 2),
                          SizedBox(width: 8),
                          Text('Loading dishes from backend...'),
                        ],
                      ),
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 16),
            
            // Error Display
            if (_error != null)
              Card(
                color: Colors.red[50],
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.error, color: Colors.red),
                          SizedBox(width: 8),
                          Text('Error', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                        ],
                      ),
                      SizedBox(height: 8),
                      Text(_error!, style: TextStyle(color: Colors.red[700])),
                    ],
                  ),
                ),
              ),
            
            // Dishes Results
            if (_testDishes != null) ...[
              SizedBox(height: 16),
              Text(
                'Test Results (${_testDishes!.length} dishes)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Expanded(
                child: ListView.builder(
                  itemCount: _testDishes!.length,
                  itemBuilder: (context, index) {
                    final dish = _testDishes![index];
                    return Card(
                      child: ListTile(
                        title: Text(dish['name'] ?? 'Unknown Dish'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(dish['description'] ?? ''),
                            SizedBox(height: 4),
                            Text('${dish['cuisine']} • ${dish['averagePrice']}'),
                            Text('${dish['restaurantName']}'),
                          ],
                        ),
                        trailing: Text('⭐ ${dish['rating']?.toStringAsFixed(1) ?? '4.0'}'),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}