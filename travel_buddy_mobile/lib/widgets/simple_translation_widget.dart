import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';

class SimpleTranslationWidget extends StatefulWidget {
  const SimpleTranslationWidget({Key? key}) : super(key: key);

  @override
  State<SimpleTranslationWidget> createState() => _SimpleTranslationWidgetState();
}

class _SimpleTranslationWidgetState extends State<SimpleTranslationWidget> {
  final TextEditingController _controller = TextEditingController();
  String _sourceLanguage = 'en';
  String _targetLanguage = 'fr';
  String _result = '';
  bool _isTranslating = false;

  final Map<String, String> _languages = {
    'en': '🇺🇸 English',
    'fr': '🇫🇷 French', 
    'es': '🇪🇸 Spanish',
    'de': '🇩🇪 German',
    'it': '🇮🇹 Italian',
    'pt': '🇵🇹 Portuguese',
    'ja': '🇯🇵 Japanese',
    'ko': '🇰🇷 Korean',
    'zh': '🇨🇳 Chinese',
    'ar': '🇸🇦 Arabic',
    'ru': '🇷🇺 Russian',
    'hi': '🇮🇳 Hindi',
    'th': '🇹🇭 Thai',
    'vi': '🇻🇳 Vietnamese',
    'tr': '🇹🇷 Turkish',
    'nl': '🇳🇱 Dutch',
    'sv': '🇸🇪 Swedish',
    'no': '🇳🇴 Norwegian',
    'da': '🇩🇰 Danish',
    'fi': '🇫🇮 Finnish',
  };

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Language selectors
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _sourceLanguage,
                  decoration: const InputDecoration(
                    labelText: 'From',
                    border: OutlineInputBorder(),
                  ),
                  items: _languages.entries.map((e) => 
                    DropdownMenuItem(value: e.key, child: Text(e.value))
                  ).toList(),
                  onChanged: (value) => setState(() => _sourceLanguage = value!),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.swap_horiz),
                onPressed: () {
                  setState(() {
                    final temp = _sourceLanguage;
                    _sourceLanguage = _targetLanguage;
                    _targetLanguage = temp;
                  });
                },
              ),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _targetLanguage,
                  decoration: const InputDecoration(
                    labelText: 'To',
                    border: OutlineInputBorder(),
                  ),
                  items: _languages.entries.map((e) => 
                    DropdownMenuItem(value: e.key, child: Text(e.value))
                  ).toList(),
                  onChanged: (value) => setState(() => _targetLanguage = value!),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Input
          TextField(
            controller: _controller,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Type text to translate...',
              border: OutlineInputBorder(),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Translate button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isTranslating ? null : _translateText,
              child: _isTranslating 
                ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                      SizedBox(width: 8),
                      Text('Translating...'),
                    ],
                  )
                : const Text('Translate'),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Result
          if (_result.isNotEmpty)
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.blue),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(8),
                        topRight: Radius.circular(8),
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(_languages[_targetLanguage] ?? _targetLanguage),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.volume_up),
                          onPressed: () => _speakText(_result),
                          tooltip: 'Play audio',
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy),
                          onPressed: () => _copyText(_result),
                          tooltip: 'Copy',
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    child: Text(_result, style: const TextStyle(fontSize: 16)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _translateText() async {
    if (_controller.text.trim().isEmpty) return;
    
    setState(() => _isTranslating = true);
    
    try {
      final provider = context.read<LanguageProvider>();
      final translation = await provider.translate(_controller.text, _targetLanguage);
      setState(() => _result = translation);
    } catch (e) {
      setState(() => _result = 'Translation failed: ${_controller.text}');
    }
    
    setState(() => _isTranslating = false);
  }

  Future<void> _speakText(String text) async {
    try {
      final provider = context.read<LanguageProvider>();
      await provider.speak(text, _targetLanguage);
    } catch (e) {
      // Ignore TTS errors
    }
  }

  void _copyText(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard')),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}