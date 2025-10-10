import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../screens/language_assistant_screen.dart';

class LanguageQuickAccessButton extends StatelessWidget {
  const LanguageQuickAccessButton({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<LanguageProvider>(
      builder: (context, languageProvider, child) {
        final currentLang = languageProvider.currentLanguageInfo;
        final hasLocationSuggestion = languageProvider.showLocationSuggestion;

        return Stack(
          children: [
            IconButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const LanguageAssistantScreen(),
                  ),
                );
              },
              icon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    currentLang.flag,
                    style: const TextStyle(fontSize: 20),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.translate, size: 20),
                ],
              ),
              tooltip: 'Language Assistant',
            ),
            
            // Notification dot for location suggestion
            if (hasLocationSuggestion)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      '!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}