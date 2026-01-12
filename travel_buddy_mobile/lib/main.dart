import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'providers/community_provider.dart';
import 'providers/language_provider.dart';
import 'providers/travel_agent_provider.dart';
import 'providers/event_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/safety_screen.dart';
import 'screens/ai_plan_screen.dart';
import 'screens/storage_test_screen.dart';
import 'screens/enhanced_route_plan_screen.dart';
import 'theme/app_theme.dart';

import 'models/place.dart';
import 'services/storage_service.dart';
import 'services/firebase_service.dart';
import 'services/analytics_service.dart';
import 'services/connectivity_service.dart';
import 'services/offline_geocoding_service.dart';
import 'services/connectivity_test.dart';
import 'services/notification_service.dart';
import 'config/environment.dart';
import 'utils/debug_logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  await Environment.loadApiKeys();
  
  DebugLogger.info('🚀 App starting with Environment configuration:');
  DebugLogger.info('🌐 Backend URL: ${Environment.backendUrl}');
  DebugLogger.info('📱 Production mode: ${Environment.isProduction}');
  
  try {
    // Initialize Storage Service first
    await StorageService().initialize();
    
    // Initialize Firebase
    await FirebaseService.initializeFirebase();
    
    // Initialize Notifications (FCM + Local)
    await NotificationService().initialize();
    
    // Initialize Analytics & Crashlytics
    await AnalyticsService.initialize();
    
    // Initialize Connectivity (non-blocking)
    ConnectivityService().initialize().catchError((e) {
      DebugLogger.error('Connectivity init failed: $e');
    });
    
    // Initialize Offline Geocoding (non-blocking)
    OfflineGeocodingService().initialize().catchError((e) {
      DebugLogger.error('Offline geocoding init failed: $e');
    });
    
    // Test backend connectivity in production
    if (Environment.isProduction) {
      ConnectivityTest.testBackendConnectivity();
    }
    
    runApp(const TravelBuddyApp());
  } catch (e, stackTrace) {
    DebugLogger.error('Initialization error: $e');
    AnalyticsService.logError('App initialization failed', error: e, stackTrace: stackTrace);
    runApp(const ErrorApp());
  }
}

class ErrorApp extends StatelessWidget {
  const ErrorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              const Text('App failed to initialize'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () {
                  // Restart the app
                  main();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TravelBuddyApp extends StatelessWidget {
  const TravelBuddyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AppProvider()),
        ChangeNotifierProvider(create: (context) => CommunityProvider()),
        ChangeNotifierProvider(create: (context) => LanguageProvider()..initialize()),
        ChangeNotifierProvider(create: (context) => TravelAgentProvider()),
        ChangeNotifierProvider(create: (context) => EventProvider()),
      ],
      child: Consumer<AppProvider>(
        // Note: CommunityProvider is available throughout the app
        builder: (context, appProvider, child) {
          return MaterialApp(
            title: 'Travel Buddy',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            themeMode: appProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            home: const SplashScreen(),
            routes: {
              '/safety': (context) => const SafetyScreen(),
              '/ai-plan': (context) => AIPlanScreen(),
              '/storage-test': (context) => StorageTestScreen(),

            },
            onGenerateRoute: (settings) {
              // Handle dynamic routes for enhanced route planning
              if (settings.name?.startsWith('/enhanced-route') == true) {
                final args = settings.arguments as Map<String, dynamic>?;
                if (args != null) {
                  return MaterialPageRoute(
                    builder: (context) => EnhancedRoutePlanScreen(
                      places: args['places'] as List<Place>,
                      title: args['title'] as String? ?? 'Enhanced Route Plan',
                    ),
                  );
                }
              }
              return null;
            },
          );
        },
      ),
    );
  }
}
