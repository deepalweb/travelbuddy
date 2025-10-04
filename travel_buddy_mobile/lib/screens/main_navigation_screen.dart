import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import 'home_screen.dart';
import 'places_screen.dart';
import 'deals_screen.dart';
import 'planner_screen.dart';

import 'community_screen.dart';
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
    const CommunityScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        return Scaffold(
          body: _screens[appProvider.currentTabIndex],
          bottomNavigationBar: BottomNavigationBar(
            type: BottomNavigationBarType.fixed,
            currentIndex: appProvider.currentTabIndex,
            onTap: (index) => appProvider.setCurrentTabIndex(index),
            selectedItemColor: Colors.blue[600],
            unselectedItemColor: Colors.grey[600],
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.home),
                label: 'For You',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.explore),
                label: 'Places',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.local_offer),
                label: 'Deals',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.map),
                label: 'Planner',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.people),
                label: 'Community',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
    );
  }
}