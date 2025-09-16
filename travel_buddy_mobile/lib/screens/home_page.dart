import 'package:flutter/material.dart';
import 'home/explore_view.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<_NavigationItem> _pages = [
    _NavigationItem(
      icon: Icons.home,
      label: 'Home',
      view: const ExploreView(),
    ),
    _NavigationItem(
      icon: Icons.search,
      label: 'Discover',
      view: const Center(child: Text('Discover View')),
    ),
    _NavigationItem(
      icon: Icons.add_circle,
      label: 'Plan Trip',
      view: const Center(child: Text('Plan Trip View')),
    ),
    _NavigationItem(
      icon: Icons.group,
      label: 'Community',
      view: const Center(child: Text('Community View')),
    ),
    _NavigationItem(
      icon: Icons.person,
      label: 'Profile',
      view: const Center(child: Text('Profile View')),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF111714),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages.map((page) => page.view).toList(),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(
              color: Color(0xFF29382F),
              width: 1,
            ),
          ),
          color: Color(0xFF1C2620),
        ),
        child: NavigationBar(
          backgroundColor: Colors.transparent,
          indicatorColor: Colors.transparent,
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() => _currentIndex = index);
          },
          destinations: _pages
            .map(
              (page) => NavigationDestination(
                icon: Icon(
                  page.icon,
                  color: _currentIndex == _pages.indexOf(page)
                      ? const Color(0xFF38E07B)
                      : const Color(0xFF9EB7A8),
                ),
                label: page.label,
                selectedIcon: Icon(
                  page.icon,
                  color: const Color(0xFF38E07B),
                ),
              ),
            )
            .toList(),
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        ),
      ),
    );
  }
}

class _NavigationItem {
  final IconData icon;
  final String label;
  final Widget view;

  const _NavigationItem({
    required this.icon,
    required this.label,
    required this.view,
  });
}