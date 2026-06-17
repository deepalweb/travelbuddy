import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/language_provider.dart';
import 'home_screen.dart';
import 'explore_screen_redesigned.dart';
import 'ai_plan_screen.dart';
import 'planner_screen.dart';
import 'profile_screen_redesigned.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final List<Widget> _screens = [
    const HomeScreen(),
    const ExploreScreenRedesigned(),
    AIPlanScreen(),
    const PlannerScreen(),
    const ProfileScreenRedesigned(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LanguageProvider>();
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final currentIndex =
            appProvider.currentTabIndex.clamp(0, _screens.length - 1);
        return Scaffold(
          backgroundColor: const Color(0xFFF5F5F7),
          body: _screens[currentIndex],
          bottomNavigationBar: Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(color: Color(0xFFE5E5EA), width: 0.7),
              ),
              boxShadow: [
                BoxShadow(
                  color: Color(0x12000000),
                  blurRadius: 24,
                  offset: Offset(0, -8),
                ),
              ],
            ),
            child: NavigationBar(
              height: 68,
              selectedIndex: currentIndex,
              onDestinationSelected: appProvider.setCurrentTabIndex,
              backgroundColor: Colors.white,
              surfaceTintColor: Colors.white,
              indicatorColor: const Color(0x1A007AFF),
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.home_outlined, size: 22),
                  selectedIcon: const Icon(Icons.home_rounded, size: 23),
                  label: lang.tr('home'),
                ),
                const NavigationDestination(
                  icon: Icon(Icons.explore_outlined, size: 22),
                  selectedIcon: Icon(Icons.explore_rounded, size: 23),
                  label: 'Discover',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.add_location_alt_outlined, size: 22),
                  selectedIcon: Icon(Icons.add_location_alt_rounded, size: 23),
                  label: 'Plan',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.map_outlined, size: 22),
                  selectedIcon: const Icon(Icons.map_rounded, size: 23),
                  label: lang.tr('trips'),
                ),
                NavigationDestination(
                  icon: const Icon(Icons.person_outline_rounded, size: 22),
                  selectedIcon: const Icon(Icons.person_rounded, size: 23),
                  label: lang.tr('profile'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
