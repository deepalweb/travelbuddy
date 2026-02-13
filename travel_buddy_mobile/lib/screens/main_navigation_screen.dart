import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/language_provider.dart';
import 'home_screen.dart';
import 'places_screen.dart';
import 'deals_screen.dart';
import 'planner_screen.dart';
import 'community_screen_v2.dart';
import 'profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final List<Widget> _screens = [
    const HomeScreen(),
    const PlacesScreen(),
    const DealsScreen(),
    const PlannerScreen(),
    const CommunityScreenV2(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          body: _screens[appProvider.currentTabIndex],
          bottomNavigationBar: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
            currentIndex: appProvider.currentTabIndex,
            onTap: (index) => appProvider.setCurrentTabIndex(index),
            backgroundColor: Colors.white,
            selectedItemColor: const Color(0xFF1976D2),
            unselectedItemColor: Colors.grey[600],
            selectedFontSize: 12,
            unselectedFontSize: 12,
            elevation: 8,
            selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600),
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.home_outlined),
                activeIcon: const Icon(Icons.home),
                label: lang.tr('home'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.explore_outlined),
                activeIcon: const Icon(Icons.explore),
                label: lang.tr('explore'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.local_offer_outlined),
                activeIcon: const Icon(Icons.local_offer),
                label: 'Deals',
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.map_outlined),
                activeIcon: const Icon(Icons.map),
                label: lang.tr('trips'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.people_outline),
                activeIcon: const Icon(Icons.people),
                label: lang.tr('community'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person_outline),
                activeIcon: const Icon(Icons.person),
                label: lang.tr('profile'),
              ),
            ],
          ),
        );
      },
    );
  }
}