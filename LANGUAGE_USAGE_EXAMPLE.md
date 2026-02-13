# How to Use Multi-Language Support

## Quick Example

Instead of hardcoded text:
```dart
Text('Safety Hub')
```

Use the translation service:
```dart
Consumer<LanguageProvider>(
  builder: (context, lang, child) {
    return Text(lang.tr('safety_hub'));
  },
)
```

Or shorter version:
```dart
Text(context.watch<LanguageProvider>().tr('safety_hub'))
```

## Available Translation Keys

Check `lib/services/localization_service.dart` for all available keys:
- 'home', 'explore', 'trips', 'community', 'profile'
- 'safety_hub', 'emergency_services', 'hospitals', etc.
- 'loading', 'error', 'success', 'cancel', 'save'

## Example: Update Safety Hub Screen

```dart
// Before
Text('Safety Hub')

// After
Text(context.watch<LanguageProvider>().tr('safety_hub'))
```

## To translate your entire app:

1. Replace all hardcoded strings with `lang.tr('key')` calls
2. Add missing keys to `localization_service.dart`
3. Add translations for all 12 languages

The infrastructure is ready - just replace hardcoded text with translation calls!
