import 'package:flutter/material.dart';
import '../models/route_models.dart';

class RoutePreferencesScreen extends StatefulWidget {
  final RoutePreferences initialPreferences;
  final Function(RoutePreferences) onPreferencesChanged;

  const RoutePreferencesScreen({
    super.key,
    required this.initialPreferences,
    required this.onPreferencesChanged,
  });

  @override
  State<RoutePreferencesScreen> createState() => _RoutePreferencesScreenState();
}

class _RoutePreferencesScreenState extends State<RoutePreferencesScreen> {
  late TransportMode _selectedTransportMode;
  late bool _considerOpeningHours;
  late bool _optimizeForRating;
  late bool _includeBreaks;

  @override
  void initState() {
    super.initState();
    _selectedTransportMode = widget.initialPreferences.transportMode;
    _considerOpeningHours = widget.initialPreferences.considerOpeningHours;
    _optimizeForRating = widget.initialPreferences.optimizeForRating;
    _includeBreaks = widget.initialPreferences.includeBreaks;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Route Preferences'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _savePreferences,
            child: const Text(
              'Save',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Transport Mode Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Transport Mode',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildTransportModeOption(
                      TransportMode.walking,
                      '🚶 Walking',
                      'Best for exploring on foot',
                    ),
                    _buildTransportModeOption(
                      TransportMode.driving,
                      '🚗 Driving',
                      'Fastest for longer distances',
                    ),
                    _buildTransportModeOption(
                      TransportMode.publicTransit,
                      '🚆 Public Transit',
                      'Eco-friendly city travel',
                    ),
                    _buildTransportModeOption(
                      TransportMode.cycling,
                      '🚲 Cycling',
                      'Active and efficient',
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Options Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Options',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Consider Opening Hours
                    _buildToggleOption(
                      title: 'Consider Opening Hours',
                      subtitle: 'Factor in place operating hours',
                      value: _considerOpeningHours,
                      onChanged: (value) {
                        setState(() {
                          _considerOpeningHours = value;
                        });
                      },
                    ),
                    
                    const Divider(),
                    
                    // Optimize for Rating
                    _buildToggleOption(
                      title: 'Optimize for Rating',
                      subtitle: 'Prioritize highly-rated places',
                      value: _optimizeForRating,
                      onChanged: (value) {
                        setState(() {
                          _optimizeForRating = value;
                        });
                      },
                    ),
                    
                    const Divider(),
                    
                    // Include Breaks
                    _buildToggleOption(
                      title: 'Include Breaks',
                      subtitle: 'Add rest stops and meal breaks',
                      value: _includeBreaks,
                      onChanged: (value) {
                        setState(() {
                          _includeBreaks = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Apply Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _savePreferences,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: const Text(
                  'Apply Preferences',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransportModeOption(TransportMode mode, String title, String subtitle) {
    final isSelected = _selectedTransportMode == mode;
    
    return InkWell(
      onTap: () {
        setState(() {
          _selectedTransportMode = mode;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue[50] : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.blue : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              color: isSelected ? Colors.blue : Colors.grey,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.blue[700] : Colors.black87,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleOption({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: Colors.blue,
        ),
      ],
    );
  }

  void _savePreferences() {
    final preferences = RoutePreferences(
      transportMode: _selectedTransportMode,
      considerOpeningHours: _considerOpeningHours,
      optimizeForRating: _optimizeForRating,
      includeBreaks: _includeBreaks,
      avoidTolls: widget.initialPreferences.avoidTolls,
      avoidHighways: widget.initialPreferences.avoidHighways,
      maxWalkingTime: widget.initialPreferences.maxWalkingTime,
      preferredPlaceTypes: widget.initialPreferences.preferredPlaceTypes,
    );

    widget.onPreferencesChanged(preferences);
    Navigator.pop(context);
  }
}