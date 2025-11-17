import 'package:flutter/material.dart';

class SimpleNavigationScreen extends StatefulWidget {
  const SimpleNavigationScreen({super.key});

  @override
  State<SimpleNavigationScreen> createState() => _SimpleNavigationScreenState();
}

class _SimpleNavigationScreenState extends State<SimpleNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const SimpleHomeTab(),
    const SimplePlacesTab(),
    const SimpleDealsTab(),
    const SimplePlannerTab(),
    const SimpleCommunityTab(),
    const SimpleProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
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
  }
}

class SimpleHomeTab extends StatelessWidget {
  const SimpleHomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('For You'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.home, size: 80, color: Colors.blue),
            SizedBox(height: 20),
            Text('Welcome to Travel Buddy!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Your personalized travel recommendations', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class SimplePlacesTab extends StatelessWidget {
  const SimplePlacesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Places'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.explore, size: 80, color: Colors.green),
            SizedBox(height: 20),
            Text('Discover Places', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Find amazing destinations around you', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class SimpleDealsTab extends StatelessWidget {
  const SimpleDealsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Deals'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.local_offer, size: 80, color: Colors.orange),
            SizedBox(height: 20),
            Text('Special Deals', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Save money on your travels', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class SimplePlannerTab extends StatelessWidget {
  const SimplePlannerTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Planner'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.map, size: 80, color: Colors.purple),
            SizedBox(height: 20),
            Text('Trip Planner', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Plan your perfect journey', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class SimpleCommunityTab extends StatelessWidget {
  const SimpleCommunityTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people, size: 80, color: Colors.teal),
            SizedBox(height: 20),
            Text('Travel Community', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Connect with fellow travelers', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class SimpleProfileTab extends StatelessWidget {
  const SimpleProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.person, size: 80, color: Colors.indigo),
            SizedBox(height: 20),
            Text('Your Profile', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Text('Manage your travel preferences', style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}