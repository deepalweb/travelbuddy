import 'package:flutter/material.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: ListView(
        children: [
          // Quick Actions
          Card(
            margin: const EdgeInsets.all(16),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.chat, color: Colors.blue),
                  title: const Text('Live Chat'),
                  subtitle: const Text('Get instant help from our support team'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Open live chat
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.email, color: Colors.green),
                  title: const Text('Email Support'),
                  subtitle: const Text('support@travelbuddy.com'),
                  trailing: const Icon(Icons.open_in_new),
                  onTap: () {
                    // TODO: Open email client
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.bug_report, color: Colors.orange),
                  title: const Text('Report a Bug'),
                  subtitle: const Text('Help us improve the app'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Open bug report form
                  },
                ),
              ],
            ),
          ),

          // FAQ Section
          _buildSectionHeader('Frequently Asked Questions'),
          ..._buildFAQItems(),

          // Guides Section
          _buildSectionHeader('Guides & Tutorials'),
          Card(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.play_circle, color: Colors.red),
                  title: const Text('Getting Started'),
                  subtitle: const Text('Learn the basics of Travel Buddy'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Open getting started guide
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.map, color: Colors.blue),
                  title: const Text('Planning Your First Trip'),
                  subtitle: const Text('Step-by-step trip planning guide'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Open trip planning guide
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.favorite, color: Colors.pink),
                  title: const Text('Using Favorites'),
                  subtitle: const Text('Save and organize your favorite places'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    // TODO: Open favorites guide
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
        ),
      ),
    );
  }

  List<Widget> _buildFAQItems() {
    final faqs = [
      {
        'question': 'How do I save places to my favorites?',
        'answer': 'Tap the heart icon on any place card to add it to your favorites. You can view all your favorites in the Profile section.',
      },
      {
        'question': 'Can I use the app offline?',
        'answer': 'Some features work offline using cached data, but you\'ll need an internet connection for real-time information and new searches.',
      },
      {
        'question': 'How do I create a trip plan?',
        'answer': 'Go to the Trip Planner tab and tap "Create New Plan". Follow the guided steps to build your personalized itinerary.',
      },
      {
        'question': 'What subscription plans are available?',
        'answer': 'We offer Free, Basic, Premium, and Pro plans. Check the Subscription section in your profile for detailed features and pricing.',
      },
      {
        'question': 'How do I change my location?',
        'answer': 'The app automatically detects your location. You can manually refresh it in Settings > Location Services.',
      },
    ];

    return faqs.map((faq) => Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ExpansionTile(
        title: Text(
          faq['question']!,
          style: const TextStyle(fontWeight: FontWeight.w500),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              faq['answer']!,
              style: TextStyle(color: Colors.grey[700]),
            ),
          ),
        ],
      ),
    )).toList();
  }
}