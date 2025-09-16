import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../constants/app_constants.dart';
import 'main_navigation_screen.dart';
import 'auth_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    
    // Initialize the app
    await appProvider.initialize();
    
    // Wait for minimum splash duration
    await Future.delayed(const Duration(seconds: 2));
    
    if (mounted) {
      // Navigate to appropriate screen
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => appProvider.isAuthenticated 
              ? const MainNavigationScreen() 
              : const AuthScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(AppConstants.colors['primary']!),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo/Icon
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.travel_explore,
                size: 60,
                color: Color(0xFF6366F1),
              ),
            ),
            const SizedBox(height: 32),
            
            // App Name
            const Text(
              'Travel Buddy',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            
            // Tagline
            const Text(
              'Your AI-powered travel companion',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 48),
            
            // Loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}