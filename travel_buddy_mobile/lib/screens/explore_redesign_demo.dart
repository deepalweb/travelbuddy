import 'package:flutter/material.dart';
import '../models/place.dart';
import '../widgets/enhanced_place_card.dart';
import '../widgets/compact_place_card.dart';
import '../widgets/travel_style_filter.dart';

/// Demo screen to showcase all new Explore redesign components
/// Use this to test individual components before full integration
class ExploreRedesignDemo extends StatefulWidget {
  const ExploreRedesignDemo({super.key});

  @override
  State<ExploreRedesignDemo> createState() => _ExploreRedesignDemoState();
}

class _ExploreRedesignDemoState extends State<ExploreRedesignDemo> {
  List<String> _selectedStyles = [];
  bool _isFavorite = false;

  // Sample place data for demo
  final _samplePlace = Place(
    id: 'demo_1',
    name: 'Gangaramaya Temple',
    type: 'Buddhist Temple',
    rating: 4.8,
    address: '61 Sri Jinarathana Rd, Colombo 00200',
    photoUrl: 'https://via.placeholder.com/400x300',
    description: 'Beautiful Buddhist temple in the heart of Colombo',
    localTip: 'Visit at 3PM before sunset for the best light - avoid main entrance crowds',
    handyPhrase: 'Ayubowan (Hello)',
    latitude: 6.9271,
    longitude: 79.8612,
    isOpenNow: true,
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Explore Redesign Demo'),
        backgroundColor: const Color(0xFF4361EE),
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Section 1: Context Bar Demo
          _buildDemoSection(
            '1. Context Bar',
            'Location + Weather awareness',
            _buildContextBarDemo(),
          ),
          
          const SizedBox(height: 24),
          
          // Section 2: Greeting Demo
          _buildDemoSection(
            '2. Smart Greeting',
            'Time-based personalization',
            _buildGreetingDemo(),
          ),
          
          const SizedBox(height: 24),
          
          // Section 3: Travel Style Filters
          _buildDemoSection(
            '3. Travel Style Filters',
            'Personal relevance filters',
            TravelStyleFilter(
              selectedStyles: _selectedStyles,
              onStylesChanged: (styles) {
                setState(() => _selectedStyles = styles);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Selected: ${styles.join(", ")}'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Section 4: Enhanced Place Card
          _buildDemoSection(
            '4. Enhanced Place Card',
            'Full-featured card with badges & tips',
            EnhancedPlaceCard(
              place: _samplePlace,
              isFavorite: _isFavorite,
              onFavoriteToggle: () {
                setState(() => _isFavorite = !_isFavorite);
              },
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Place card tapped!')),
                );
              },
              showTripContext: true,
              tripName: 'Colombo Day 1',
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Section 5: Compact Place Cards (Horizontal)
          _buildDemoSection(
            '5. Compact Place Cards',
            'Horizontal scrolling for categories',
            SizedBox(
              height: 220,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: 3,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: EdgeInsets.only(right: index < 2 ? 12 : 0),
                    child: CompactPlaceCard(
                      place: _samplePlace,
                      isFavorite: _isFavorite,
                      onFavoriteToggle: () {
                        setState(() => _isFavorite = !_isFavorite);
                      },
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Compact card ${index + 1} tapped!')),
                        );
                      },
                    ),
                  );
                },
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Section 6: Color Palette
          _buildDemoSection(
            '6. Color Palette',
            'Redesigned color system',
            _buildColorPaletteDemo(),
          ),
          
          const SizedBox(height: 24),
          
          // Section 7: Typography
          _buildDemoSection(
            '7. Typography',
            'Updated text styles',
            _buildTypographyDemo(),
          ),
          
          const SizedBox(height: 24),
          
          // Integration Button
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF4361EE).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF4361EE)),
            ),
            child: Column(
              children: [
                const Icon(
                  Icons.rocket_launch,
                  size: 48,
                  color: Color(0xFF4361EE),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Ready to integrate?',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'See EXPLORE_INTEGRATION_GUIDE.md for next steps',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Back to App'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4361EE),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoSection(String title, String subtitle, Widget content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 12),
        content,
      ],
    );
  }

  Widget _buildContextBarDemo() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF4361EE).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: const Row(
        children: [
          Icon(Icons.location_on, size: 16, color: Color(0xFF4361EE)),
          SizedBox(width: 4),
          Text(
            'Colombo, Sri Lanka',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          SizedBox(width: 12),
          Text('•', style: TextStyle(color: Colors.grey)),
          SizedBox(width: 12),
          Icon(Icons.wb_sunny, size: 16, color: Color(0xFFFF6B35)),
          SizedBox(width: 4),
          Text(
            '28°C',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildGreetingDemo() {
    final hour = DateTime.now().hour;
    String greeting;
    String suggestion;
    
    if (hour < 12) {
      greeting = 'Good Morning, Explorer!';
      suggestion = '☕ Perfect morning for cafes & culture';
    } else if (hour < 18) {
      greeting = 'Good Afternoon, Explorer!';
      suggestion = '🌳 Great time for outdoor exploration';
    } else {
      greeting = 'Good Evening, Explorer!';
      suggestion = '🌆 Evening vibes: restaurants & nightlife';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            greeting,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            suggestion,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColorPaletteDemo() {
    final colors = [
      {'name': 'Ocean Blue', 'color': const Color(0xFF4361EE), 'usage': 'Primary Actions'},
      {'name': 'Palm Green', 'color': const Color(0xFF2EC4B6), 'usage': 'Verified Badge'},
      {'name': 'Sunset Orange', 'color': const Color(0xFFFF6B35), 'usage': 'Community Tips'},
      {'name': 'Warm Sand', 'color': const Color(0xFFFFF8E1), 'usage': 'Tip Background'},
    ];

    return Column(
      children: colors.map((colorData) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: colorData['color'] as Color,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      colorData['name'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      colorData['usage'] as String,
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
        );
      }).toList(),
    );
  }

  Widget _buildTypographyDemo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Section Header',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        const Text(
          'Place Name',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Community Tip Text',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Color(0xFFFF6B35),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Distance & Metadata',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.grey[700],
          ),
        ),
      ],
    );
  }
}
