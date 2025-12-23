import 'package:flutter/material.dart';
import '../services/api_service.dart';

class TravelPreferencesScreen extends StatefulWidget {
  const TravelPreferencesScreen({super.key});

  @override
  State<TravelPreferencesScreen> createState() => _TravelPreferencesScreenState();
}

class _TravelPreferencesScreenState extends State<TravelPreferencesScreen> {
  String budgetRange = 'moderate';
  String travelPace = 'moderate';
  bool accessibility = false;
  List<String> interests = [];
  bool loading = false;

  final interestOptions = [
    {'id': 'culture', 'label': 'Culture & History', 'icon': Icons.museum},
    {'id': 'adventure', 'label': 'Adventure', 'icon': Icons.hiking},
    {'id': 'food', 'label': 'Food & Dining', 'icon': Icons.restaurant},
    {'id': 'beach', 'label': 'Beach', 'icon': Icons.beach_access},
    {'id': 'nature', 'label': 'Nature', 'icon': Icons.nature},
    {'id': 'shopping', 'label': 'Shopping', 'icon': Icons.shopping_bag},
    {'id': 'nightlife', 'label': 'Nightlife', 'icon': Icons.nightlight},
    {'id': 'photography', 'label': 'Photography', 'icon': Icons.camera_alt},
    {'id': 'wellness', 'label': 'Wellness', 'icon': Icons.spa},
    {'id': 'sports', 'label': 'Sports', 'icon': Icons.sports},
    {'id': 'art', 'label': 'Art & Museums', 'icon': Icons.palette},
    {'id': 'music', 'label': 'Music', 'icon': Icons.music_note},
  ];

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await ApiService().getUserPreferences();
      if (prefs.isNotEmpty) {
        setState(() {
          budgetRange = prefs['budgetRange'] ?? 'moderate';
          travelPace = prefs['travelPace'] ?? 'moderate';
          accessibility = prefs['accessibility'] ?? false;
          interests = List<String>.from(prefs['interests'] ?? []);
        });
      }
    } catch (e) {
      // Use defaults
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Travel Preferences'),
        actions: [
          if (loading)
            const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Budget Range', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: budgetRange,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'budget', child: Text('Budget (\$)')),
                      DropdownMenuItem(value: 'moderate', child: Text('Moderate (\$\$)')),
                      DropdownMenuItem(value: 'luxury', child: Text('Luxury (\$\$\$)')),
                    ],
                    onChanged: (v) => setState(() => budgetRange = v!),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Travel Pace', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: travelPace,
                    decoration: const InputDecoration(border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'relaxed', child: Text('Relaxed')),
                      DropdownMenuItem(value: 'moderate', child: Text('Moderate')),
                      DropdownMenuItem(value: 'fast', child: Text('Fast-Paced')),
                    ],
                    onChanged: (v) => setState(() => travelPace = v!),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: SwitchListTile(
              title: const Text('Accessibility Needs'),
              subtitle: const Text('Require accessible facilities'),
              value: accessibility,
              onChanged: (v) => setState(() => accessibility = v),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Travel Interests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: interestOptions.map((interest) {
                      final isSelected = interests.contains(interest['id']);
                      return FilterChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(interest['icon'] as IconData, size: 16),
                            const SizedBox(width: 4),
                            Text(interest['label'] as String),
                          ],
                        ),
                        selected: isSelected,
                        onSelected: (selected) {
                          setState(() {
                            if (selected) {
                              interests.add(interest['id'] as String);
                            } else {
                              interests.remove(interest['id']);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: loading ? null : _savePreferences,
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(loading ? 'Saving...' : 'Save Preferences'),
          ),
        ],
      ),
    );
  }

  Future<void> _savePreferences() async {
    setState(() => loading = true);
    try {
      await ApiService().updateUserPreferences({
        'budgetRange': budgetRange,
        'travelPace': travelPace,
        'accessibility': accessibility,
        'interests': interests,
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Preferences saved successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }
}
