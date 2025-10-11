import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../models/language_models.dart';

class TranslationWidget extends StatefulWidget {
  const TranslationWidget({Key? key}) : super(key: key);
  
  @override
  State<TranslationWidget> createState() => _TranslationWidgetState();
}

class _TranslationWidgetState extends State<TranslationWidget> {
  final TextEditingController _inputController = TextEditingController();
  String _sourceLanguage = 'en';
  String _targetLanguage = 'fr';
  String _translatedText = '';
  bool _isTranslating = false;
  bool _isListening = false;

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
                child: _buildLanguageSelector(
                  'From',
                  _sourceLanguage,
                  (value) => setState(() => _sourceLanguage = value!),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.swap_horiz),
                onPressed: _swapLanguages,
                tooltip: 'Swap languages',
              ),
              Expanded(
                child: _buildLanguageSelector(
                  'To',
                  _targetLanguage,
                  (value) => setState(() => _targetLanguage = value!),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Input section
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(8),
                      topRight: Radius.circular(8),
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(_getLanguageName(_sourceLanguage)),
                      const Spacer(),
                      IconButton(
                        icon: Icon(
                          _isListening ? Icons.mic : Icons.mic_none,
                          color: _isListening ? Colors.red : null,
                        ),
                        onPressed: _startListening,
                        tooltip: 'Voice input',
                      ),
                    ],
                  ),
                ),
                TextField(
                  controller: _inputController,
                  maxLines: 4,
                  decoration: const InputDecoration(
                    hintText: 'Type text to translate...',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(12),
                  ),
                ),
              ],
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
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Translating...'),
                      ],
                    )
                  : const Text('Translate'),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Output section
          if (_translatedText.isNotEmpty)
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.blue.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(8),
                        topRight: Radius.circular(8),
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(_getLanguageName(_targetLanguage)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.volume_up),
                          onPressed: () => _speakTranslation(_translatedText),
                          tooltip: 'Play audio',
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy),
                          onPressed: () => _copyTranslation(_translatedText),
                          tooltip: 'Copy',
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      _translatedText,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLanguageSelector(
    String label,
    String value,
    ValueChanged<String?> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: value,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
          items: _getLanguageItems(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  void _swapLanguages() {
    setState(() {
      final temp = _sourceLanguage;
      _sourceLanguage = _targetLanguage;
      _targetLanguage = temp;
      
      // Swap text too
      final inputText = _inputController.text;
      _inputController.text = _translatedText;
      _translatedText = inputText;
    });
  }

  Future<void> _translateText() async {
    if (_inputController.text.trim().isEmpty) return;
    
    setState(() => _isTranslating = true);
    
    final provider = context.read<LanguageProvider>();
    final translation = await provider.translate(
      _inputController.text,
      _targetLanguage,
    );
    
    setState(() {
      _translatedText = translation;
      _isTranslating = false;
    });
  }

  Future<void> _startListening() async {
    setState(() => _isListening = true);
    
    final provider = context.read<LanguageProvider>();
    final result = await provider.listen(_sourceLanguage);
    
    setState(() => _isListening = false);
    
    if (result != null) {
      _inputController.text = result;
    }
  }

  Future<void> _speakTranslation(String text) async {
    final provider = context.read<LanguageProvider>();
    await provider.speak(text, _targetLanguage);
  }

  void _copyTranslation(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied to clipboard')),
    );
  }

  String _getLanguageName(String code) {
    try {
      return supportedLanguages
          .firstWhere((lang) => lang.code == code)
          .name;
    } catch (e) {
      return code.toUpperCase();
    }
  }

  List<DropdownMenuItem<String>> _getLanguageItems() {
    try {
      return supportedLanguages
          .map((lang) => DropdownMenuItem(
                value: lang.code,
                child: Row(
                  children: [
                    Text(lang.flag),
                    const SizedBox(width: 8),
                    Expanded(child: Text(lang.name, overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ))
          .toList();
    } catch (e) {
      return [
        const DropdownMenuItem(value: 'en', child: Text('🇺🇸 English')),
        const DropdownMenuItem(value: 'fr', child: Text('🇫🇷 French')),
        const DropdownMenuItem(value: 'es', child: Text('🇪🇸 Spanish')),
      ];
    }
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }
}