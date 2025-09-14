# TravelBuddy Mobile App

A Flutter mobile application for the TravelBuddy platform that connects to the existing backend APIs.

## Features

- **Authentication**: Login and registration
- **Places Discovery**: Search and explore nearby places
- **Social Features**: View and create posts, interact with community
- **User Profiles**: Manage favorites, view statistics
- **Clean Architecture**: Organized code structure with separation of concerns

## Architecture

The app follows clean architecture principles:

```
lib/
├── core/                 # Core functionality
│   ├── config/          # App configuration
│   ├── models/          # Data models
│   ├── providers/       # State management
│   ├── router/          # Navigation
│   ├── services/        # API services
│   └── theme/           # App theming
├── features/            # Feature modules
│   ├── auth/           # Authentication
│   ├── home/           # Home screen
│   ├── places/         # Places discovery
│   ├── profile/        # User profile
│   └── social/         # Social features
└── shared/             # Shared components
    ├── services/       # Shared services
    └── widgets/        # Reusable widgets
```

## Setup

1. **Install Flutter**: Follow the [Flutter installation guide](https://flutter.dev/docs/get-started/install)

2. **Install dependencies**:
   ```bash
   flutter pub get
   ```

3. **Generate model files**:
   ```bash
   flutter packages pub run build_runner build
   ```

4. **Configure backend URL**: Update `lib/core/config/app_config.dart` with your backend URL

5. **Run the app**:
   ```bash
   flutter run
   ```

## API Integration

The app communicates with the TravelBuddy backend through these main services:

- **ApiService**: Core HTTP client for API communication
- **PlacesService**: Places discovery and details
- **SocialService**: Posts and social interactions
- **AuthProvider**: Authentication state management
- **UserProvider**: User data and favorites management

## Key Components

### State Management
- Uses Provider pattern for state management
- AuthProvider manages authentication state
- UserProvider handles user-specific data

### Navigation
- Uses GoRouter for declarative routing
- Bottom navigation for main app sections
- Deep linking support for place details

### API Communication
- Centralized API service with error handling
- Automatic JSON serialization/deserialization
- Timeout and retry mechanisms

## Development

### Adding New Features
1. Create feature directory under `lib/features/`
2. Add screens, widgets, and services as needed
3. Update router configuration
4. Add navigation items if required

### Code Generation
Run this command when adding new model classes:
```bash
flutter packages pub run build_runner build --delete-conflicting-outputs
```

## Configuration

### Backend URL
Update the `baseUrl` in `lib/core/config/app_config.dart`:
```dart
static const String baseUrl = 'https://your-backend-url.com/api';
```

### API Endpoints
All API endpoints are configured in `app_config.dart` for easy maintenance.

## Building

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Dependencies

- **flutter**: UI framework
- **http**: HTTP client
- **provider**: State management
- **go_router**: Navigation
- **shared_preferences**: Local storage
- **json_annotation**: JSON serialization
- **cached_network_image**: Image caching
- **google_maps_flutter**: Maps integration
- **geolocator**: Location services

## Contributing

1. Follow Flutter best practices
2. Maintain clean architecture structure
3. Add proper error handling
4. Write meaningful commit messages
5. Test on both Android and iOS