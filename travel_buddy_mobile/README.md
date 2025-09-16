# Travel Buddy Mobile

A Flutter mobile application for the Travel Buddy platform - your AI-powered travel companion.

## Features

### Phase 1 - Core Architecture ✅
- [x] Flutter project setup with proper folder structure
- [x] State management with Provider
- [x] Local storage with Hive and SharedPreferences
- [x] Firebase Authentication integration
- [x] API service layer for backend communication
- [x] Core models (Place, User, Trip, etc.)

### Phase 2 - Essential Features (In Progress)
- [x] Authentication screens (Login/Register)
- [x] Main navigation with bottom tabs
- [x] Places discovery and exploration
- [x] User profile management
- [ ] Place details screen
- [ ] Favorites management

### Phase 3 - Core Travel Features (Planned)
- [ ] One-day itinerary generator
- [ ] Multi-day trip planner
- [ ] Saved trips management
- [ ] Deals browsing
- [ ] Community features

### Phase 4 - Advanced Features (Planned)
- [ ] AI assistant chat
- [ ] Voice search integration
- [ ] Offline capabilities
- [ ] Push notifications

## Getting Started

### Prerequisites
- Flutter SDK (3.8.1 or higher)
- Dart SDK
- Android Studio / VS Code
- Firebase project (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd travel_buddy_mobile
```

2. Install dependencies:
```bash
flutter pub get
```

3. Generate Hive adapters:
```bash
flutter packages pub run build_runner build
```

4. Configure Firebase:
   - Create a Firebase project
   - Add your Android/iOS apps to the project
   - Download and replace the configuration files:
     - `android/app/google-services.json` (Android)
     - `ios/Runner/GoogleService-Info.plist` (iOS)
   - Update `lib/firebase_options.dart` with your project configuration

5. Run the app:
```bash
flutter run
```

## Project Structure

```
lib/
├── constants/          # App constants and configuration
├── models/            # Data models (Place, User, Trip, etc.)
├── providers/         # State management providers
├── screens/           # UI screens
├── services/          # API and business logic services
├── widgets/           # Reusable UI components
├── utils/             # Utility functions
└── main.dart          # App entry point
```

## Architecture

The app follows a clean architecture pattern with:

- **Provider**: State management
- **Services**: API communication and business logic
- **Models**: Data structures with Hive for local storage
- **Screens**: UI screens and navigation
- **Widgets**: Reusable UI components

## Configuration

### Backend API
Update the `baseUrl` in `lib/constants/app_constants.dart` to point to your backend server.

### Firebase
Configure Firebase authentication by updating the configuration in `lib/firebase_options.dart`.

### Google Maps (Future)
Add your Google Maps API key to:
- `android/app/src/main/AndroidManifest.xml`
- `ios/Runner/AppDelegate.swift`

## Development

### Adding New Features
1. Create models in `lib/models/`
2. Add API methods in `lib/services/api_service.dart`
3. Update the provider in `lib/providers/app_provider.dart`
4. Create UI screens in `lib/screens/`
5. Add reusable widgets in `lib/widgets/`

### State Management
The app uses Provider for state management. The main `AppProvider` handles:
- User authentication state
- Location services
- Places data
- Trip planning data
- UI state

### Local Storage
- **Hive**: For complex objects (User, Places, Trips)
- **SharedPreferences**: For simple key-value pairs (settings, favorites)

## Testing

Run tests with:
```bash
flutter test
```

## Building

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.