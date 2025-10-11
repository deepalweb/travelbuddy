import 'package:flutter/material.dart';
import '../services/ai_trip_service.dart';

class GoogleAIModeScreen extends StatefulWidget {
  @override
  _GoogleAIModeScreenState createState() => _GoogleAIModeScreenState();
}

class _GoogleAIModeScreenState extends State<GoogleAIModeScreen> {
  final _destinationController = TextEditingController();
  final _interestsController = TextEditingController();
  String _duration = '2 days';
  String _pace = 'Moderate';
  String _budget = 'Mid-Range';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.deepPurple[50],
      appBar: AppBar(
        title: const Text('🤖 Google AI Mode'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // AI Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.deepPurple[400]!, Colors.deepPurple[600]!],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.deepPurple.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Column(
                children: [
                  Text('🤖', style: TextStyle(fontSize: 48)),
                  SizedBox(height: 12),
                  Text(
                    'Google AI Trip Planner',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Rich detailed itineraries with AI intelligence',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Powered by Azure OpenAI + Google Places',
                    style: TextStyle(color: Colors.white60, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
            
            // Form Section
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Plan Your Adventure',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  
                  TextField(
                    controller: _destinationController,
                    decoration: InputDecoration(
                      labelText: '📍 Destination',
                      hintText: 'e.g., Tokyo, Paris, New York',
                      prefixIcon: const Icon(Icons.location_on, color: Colors.deepPurple),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Colors.deepPurple, width: 2),
                      ),
                    ),
                    onChanged: (value) => setState(() {}),
                  ),
                  const SizedBox(height: 16),
                  
                  DropdownButtonFormField<String>(
                    initialValue: _duration,
                    decoration: InputDecoration(
                      labelText: '⏰ Duration',
                      prefixIcon: const Icon(Icons.schedule, color: Colors.deepPurple),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Colors.deepPurple, width: 2),
                      ),
                    ),
                    items: ['1 day', '2 days', '3 days', '1 week', '2 weeks'].map((duration) =>
                      DropdownMenuItem(value: duration, child: Text(duration))
                    ).toList(),
                    onChanged: (value) => setState(() => _duration = value!),
                  ),
                  const SizedBox(height: 16),
                  
                  TextField(
                    controller: _interestsController,
                    decoration: InputDecoration(
                      labelText: '❤️ Interests',
                      hintText: 'e.g., culture, food, nature, history',
                      prefixIcon: const Icon(Icons.favorite, color: Colors.deepPurple),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Colors.deepPurple, width: 2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _pace,
                          decoration: InputDecoration(
                            labelText: '🚶 Pace',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Colors.deepPurple, width: 2),
                            ),
                          ),
                          items: ['Relaxed', 'Moderate', 'Fast'].map((pace) =>
                            DropdownMenuItem(value: pace, child: Text(pace))
                          ).toList(),
                          onChanged: (value) => setState(() => _pace = value!),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _budget,
                          decoration: InputDecoration(
                            labelText: '💰 Budget',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Colors.deepPurple, width: 2),
                            ),
                          ),
                          items: ['Budget', 'Mid-Range', 'Luxury'].map((budget) =>
                            DropdownMenuItem(value: budget, child: Text(budget))
                          ).toList(),
                          onChanged: (value) => setState(() => _budget = value!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // Generate Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _destinationController.text.isEmpty || _isLoading 
                          ? null 
                          : () => _generateAIPlan(),
                      icon: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text('🤖', style: TextStyle(fontSize: 20)),
                      label: Text(
                        _isLoading 
                            ? 'AI generating rich trip plan...' 
                            : 'Generate AI Trip Plan',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.deepPurple,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 8,
                      ),
                    ),
                  ),
                  
                  if (_destinationController.text.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: Text(
                        'Please enter a destination to continue',
                        style: TextStyle(color: Colors.red, fontSize: 14),
                        textAlign: TextAlign.center,
                      ),
                    ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Features Section
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '✨ AI Features',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Text('🚗', style: TextStyle(fontSize: 20)),
                      SizedBox(width: 8),
                      Expanded(child: Text('Real transport info & costs')),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Text('⏰', style: TextStyle(fontSize: 20)),
                      SizedBox(width: 8),
                      Expanded(child: Text('Best times to visit & avoid')),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Text('💡', style: TextStyle(fontSize: 20)),
                      SizedBox(width: 8),
                      Expanded(child: Text('Local tips & practical notes')),
                    ],
                  ),
                  SizedBox(height: 8),
                  Row(
                    children: [
                      Text('🗺️', style: TextStyle(fontSize: 20)),
                      SizedBox(width: 8),
                      Expanded(child: Text('Detailed activity descriptions')),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateAIPlan() async {
    setState(() => _isLoading = true);
    
    try {
      final result = await AITripService.generateTripPlan(
        destination: _destinationController.text,
        duration: _duration,
        interests: _interestsController.text.isEmpty ? 'general sightseeing' : _interestsController.text,
        pace: _pace,
        budget: _budget,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🤖 AI trip plan created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context); // Return to planner
        } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ AI planning failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _destinationController.dispose();
    _interestsController.dispose();
    super.dispose();
  }
}