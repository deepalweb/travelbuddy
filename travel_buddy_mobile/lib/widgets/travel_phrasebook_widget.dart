import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../models/language_models.dart';

class TravelPhrasebookWidget extends StatefulWidget {
  const TravelPhrasebookWidget({Key? key}) : super(key: key);
  
  @override
  State<TravelPhrasebookWidget> createState() => _TravelPhrasebookWidgetState();
}

class _TravelPhrasebookWidgetState extends State<TravelPhrasebookWidget> {
  String _selectedLanguage = 'fr';
  String _selectedCategory = 'emergency';
  List<TravelPhrase> _phrases = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadPhrases();
  }

  Future<void> _loadPhrases() async {
    setState(() => _loading = true);
    
    final provider = context.read<LanguageProvider>();
    final phrases = await provider.getTravelPhrases(_selectedLanguage, _selectedCategory);
    
    setState(() {
      _phrases = phrases;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Language and category selectors
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedLanguage,
                  decoration: const InputDecoration(
                    labelText: 'Language',
                    border: OutlineInputBorder(),
                  ),
                  items: supportedLanguages
                      .where((lang) => lang.code != 'en')
                      .map((lang) => DropdownMenuItem(
                            value: lang.code,
                            child: Row(
                              children: [
                                Text(lang.flag),
                                const SizedBox(width: 8),
                                Text(lang.name),
                              ],
                            ),
                          ))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedLanguage = value);
                      _loadPhrases();
                    }
                  },
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _selectedCategory,
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    border: OutlineInputBorder(),
                  ),
                  items: phraseCategories
                      .map((category) => DropdownMenuItem(
                            value: category,
                            child: Text(_getCategoryName(category)),
                          ))
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => _selectedCategory = value);
                      _loadPhrases();
                    }
                  },
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Phrases list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _phrases.isEmpty
                    ? const Center(child: Text('No phrases found'))
                    : ListView.builder(
                        itemCount: _phrases.length,
                        itemBuilder: (context, index) {
                          final phrase = _phrases[index];
                          return _buildPhraseCard(phrase);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhraseCard(TravelPhrase phrase) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              phrase.english,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Text(
              phrase.translation,
              style: const TextStyle(
                fontSize: 18,
                color: Colors.blue,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (phrase.pronunciation != null) ...[
              const SizedBox(height: 4),
              Text(
                phrase.pronunciation!,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.volume_up),
                  onPressed: () => _speakPhrase(phrase.translation),
                  tooltip: 'Play pronunciation',
                ),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () => _copyPhrase(phrase.translation),
                  tooltip: 'Copy to clipboard',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _speakPhrase(String text) async {
    final provider = context.read<LanguageProvider>();
    await provider.speak(text, _selectedLanguage);
  }

  void _copyPhrase(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard')),
    );
  }

  String _getCategoryName(String category) {
    final Map<String, String> categoryNames = {
      'emergency': 'Emergency',
      'greetings': 'Greetings',
      'directions': 'Directions',
      'food': 'Food & Dining',
      'accommodation': 'Accommodation',
      'transportation': 'Transportation',
      'shopping': 'Shopping',
      'numbers': 'Numbers',
      'time': 'Time',
      'basic': 'Basic Phrases',
    };
    return categoryNames[category] ?? category;
  }
}