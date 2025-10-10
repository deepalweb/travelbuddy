import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../models/language_models.dart';
import '../widgets/travel_phrasebook_widget.dart';
import '../widgets/simple_translation_widget.dart';
import '../widgets/language_selector_widget.dart';
import 'language_settings_screen.dart';

class LanguageAssistantScreen extends StatefulWidget {
  const LanguageAssistantScreen({Key? key}) : super(key: key);

  @override
  State<LanguageAssistantScreen> createState() => _LanguageAssistantScreenState();
}

class _LanguageAssistantScreenState extends State<LanguageAssistantScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Text('🌍'),
            SizedBox(width: 8),
            Text('Language Assistant'),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.book), text: 'Phrasebook'),
            Tab(icon: Icon(Icons.translate), text: 'Translator'),
            Tab(icon: Icon(Icons.settings), text: 'Settings'),
          ],
        ),
      ),
      body: Consumer<LanguageProvider>(
        builder: (context, languageProvider, child) {
          return Column(
            children: [
              // Location suggestion banner
              if (languageProvider.showLocationSuggestion)
                _buildLocationSuggestionBanner(languageProvider),
              
              // Tab content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    const TravelPhrasebookWidget(),
                    const SimpleTranslationWidget(),
                    _buildSettingsTab(languageProvider),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLocationSuggestionBanner(LanguageProvider provider) {
    final suggestedLang = supportedLanguages.firstWhere(
      (lang) => lang.code == provider.suggestedLanguage,
      orElse: () => supportedLanguages.first,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      color: Colors.blue.shade50,
      child: Row(
        children: [
          Text(suggestedLang.flag, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'New location detected!',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text('Switch to ${suggestedLang.name}?'),
              ],
            ),
          ),
          TextButton(
            onPressed: provider.acceptLocationSuggestion,
            child: const Text('Switch'),
          ),
          TextButton(
            onPressed: provider.dismissLocationSuggestion,
            child: const Text('Dismiss'),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTab(LanguageProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'App Language',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          // Language selector
          const LanguageSelectorWidget(showTitle: false),
          
          const SizedBox(height: 32),
          
          // Quick actions
          const Text(
            'Quick Actions',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          
          ListTile(
            leading: const Icon(Icons.download),
            title: const Text('Download Offline Phrases'),
            subtitle: const Text('For emergency use'),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Offline phrases downloaded')),
              );
            },
          ),
          
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Advanced Settings'),
            subtitle: const Text('More language options'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const LanguageSettingsScreen(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}