import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../models/language_models.dart';

class LanguageSelectorWidget extends StatelessWidget {
  final bool showTitle;
  final bool compact;

  const LanguageSelectorWidget({
    Key? key,
    this.showTitle = true,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showTitle && !compact)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text(
                  'App Language',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(8),
              ),
              child: compact 
                ? _buildCompactSelector(languageProvider)
                : _buildFullSelector(languageProvider),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCompactSelector(LanguageProvider provider) {
    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: provider.currentLanguage,
        isExpanded: true,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        items: supportedLanguages.map((lang) {
          return DropdownMenuItem(
            value: lang.code,
            child: Row(
              children: [
                Text(lang.flag, style: const TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Text(lang.name),
              ],
            ),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            provider.changeLanguage(value);
          }
        },
      ),
    );
  }

  Widget _buildFullSelector(LanguageProvider provider) {
    return Column(
      children: supportedLanguages.map((lang) {
        final isSelected = lang.code == provider.currentLanguage;
        return ListTile(
          leading: Text(lang.flag, style: const TextStyle(fontSize: 24)),
          title: Text(lang.name),
          trailing: isSelected 
            ? const Icon(Icons.check, color: Colors.blue) 
            : null,
          selected: isSelected,
          onTap: () => provider.changeLanguage(lang.code),
        );
      }).toList(),
    );
  }
}