import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/travel_style.dart';
import '../providers/app_provider.dart';

class TravelStyleSelectionScreen extends StatefulWidget {
  final bool isOnboarding;

  const TravelStyleSelectionScreen({
    super.key,
    this.isOnboarding = false,
  });

  @override
  State<TravelStyleSelectionScreen> createState() => _TravelStyleSelectionScreenState();
}

class _TravelStyleSelectionScreenState extends State<TravelStyleSelectionScreen> {
  TravelStyle? _selectedStyle;

  @override
  void initState() {
    super.initState();
    // Use addPostFrameCallback to ensure the context is ready
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentUser = context.read<AppProvider>().currentUser;
      if (mounted) {
        setState(() {
          _selectedStyle = currentUser?.travelStyle;
        });
        print('🔍 DEBUG: Initialized with travel style: ${_selectedStyle?.displayName ?? "None"}');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Your Travel Style'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          if (widget.isOnboarding) ...[
            Container(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Icon(Icons.explore, size: 64, color: Colors.blue[600]),
                  const SizedBox(height: 16),
                  const Text(
                    'Personalize Your Experience',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Choose your travel style to get personalized place recommendations',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ],
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: TravelStyle.values.length,
              itemBuilder: (context, index) {
                final style = TravelStyle.values[index];
                final isSelected = _selectedStyle == style;
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Card(
                    elevation: isSelected ? 4 : 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(
                        color: isSelected ? Colors.blue[600]! : Colors.transparent,
                        width: 2,
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () {
                        setState(() {
                          _selectedStyle = style;
                        });
                        print('🔍 DEBUG: Selected style: ${style.displayName}');
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: isSelected 
                                    ? Colors.blue[600]!.withOpacity(0.1)
                                    : Colors.grey[100],
                                borderRadius: BorderRadius.circular(30),
                              ),
                              child: Center(
                                child: Text(
                                  style.emoji,
                                  style: const TextStyle(fontSize: 24),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    style.displayName,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: isSelected ? Colors.blue[600] : null,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    style.description,
                                    style: TextStyle(
                                      color: Colors.grey[600],
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  _buildWeightChips(style),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                Icons.check_circle,
                                color: Colors.blue[600],
                                size: 24,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedStyle != null ? _saveSelection : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue[600],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  widget.isOnboarding ? 'Continue' : 'Save Changes',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeightChips(TravelStyle style) {
    final weights = style.placeWeights;
    final topWeights = weights.entries
        .where((e) => e.value > 1.0)
        .toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: topWeights.take(3).map((entry) {
        final percentage = ((entry.value - 1.0) * 100).round();
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.green[100],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            '${entry.key} +$percentage%',
            style: TextStyle(
              fontSize: 10,
              color: Colors.green[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      }).toList(),
    );
  }

  void _saveSelection() async {
    if (_selectedStyle == null) {
      print('⚠️ No travel style selected');
      return;
    }

    print('🔍 DEBUG: Saving travel style: ${_selectedStyle!.displayName}');
    
    final appProvider = context.read<AppProvider>();
    appProvider.debugCurrentUser();
    final currentUser = appProvider.currentUser;
    
    print('🔍 DEBUG: Current user: ${currentUser?.username ?? "None"}, mongoId: ${currentUser?.mongoId ?? "None"}');
    
    final success = await appProvider.updateTravelStyle(_selectedStyle!);
    
    print('🔍 DEBUG: Update result: $success');
    
    // Verify the travel style was saved
    final updatedUser = appProvider.currentUser;
    print('🔍 DEBUG: After save - Travel style: ${updatedUser?.travelStyle?.displayName ?? "None"}');
    appProvider.debugCurrentUser();
    
    // Verify persistence in storage
    await appProvider.debugReloadUserFromStorage();

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Travel style updated to ${_selectedStyle!.displayName}'),
          backgroundColor: Colors.green,
        ),
      );

      if (widget.isOnboarding) {
        Navigator.of(context).pushReplacementNamed('/home');
      } else {
        Navigator.of(context).pop();
      }
    } else if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to save travel style. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}