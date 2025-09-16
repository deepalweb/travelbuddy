import 'package:flutter/material.dart';

class ExploreView extends StatelessWidget {
  const ExploreView({super.key});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        _buildAppBar(),
        _buildProfileCard(),
        _buildSafetyAlert(),
        _buildQuickActions(),
        _buildRecommendations(),
        _buildLocalHighlights(),
        // Extra space for bottom nav
        const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
      ],
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      pinned: true,
      backgroundColor: const Color(0xFF111714).withOpacity(0.8),
      leading: IconButton(
        icon: const Icon(Icons.sos, color: Colors.white),
        style: IconButton.styleFrom(
          backgroundColor: Colors.red,
          shape: const CircleBorder(),
        ),
        onPressed: () {
          // Handle emergency button press
        },
      ),
      title: const Text(
        'Your Day',
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.settings, color: Colors.white),
          onPressed: () {
            // Handle settings button press
          },
        ),
      ],
    );
  }

  Widget _buildProfileCard() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.2),
            borderRadius: BorderRadius.circular(16),
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Profile image section
                Expanded(
                  flex: 1,
                  child: AspectRatio(
                    aspectRatio: 16/9,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.horizontal(
                          left: Radius.circular(16)
                        ),
                        image: const DecorationImage(
                          image: NetworkImage(
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCMio2LGPEqBXVt4myWWOytIYu6UlvtXlZjqC9MqrpqJMaIhNwodPb1gvC09__DcUF65iJ8bQuYIuX7mEGydQr9cdxxWJPEbQLz1cNIT79PB0FcEPD7tsQWu9E3QLqV-TpTdK3krbR8KrBLJtJa4uxwSUrpWIo1JOkfgLJ2c9XNNd775wTv0yY8g_JAM5ebuRSozoiBYc7e0yRiFxMwjigL7n4jArm8av6qVwggI6zo3pJnb3TJhMQprKNzHtbcYcAcmxTXCHdI0v0',
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ),
                ),
                // Info section
                Expanded(
                  flex: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Good morning, Alex!',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildInfoRow(Icons.location_on, 'San Francisco'),
                        const SizedBox(height: 4),
                        _buildInfoRow(Icons.wb_sunny, '68°F'),
                        const SizedBox(height: 4),
                        _buildInfoRow(Icons.schedule, '10:00 AM'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF9EB7A8), size: 18),
        const SizedBox(width: 8),
        Text(
          text,
          style: const TextStyle(
            color: Color(0xFF9EB7A8),
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildSafetyAlert() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Container(
          padding: const EdgeInsets.all(12.0),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            border: Border.all(
              color: Colors.red.withOpacity(0.5),
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              const Icon(Icons.warning, color: Colors.red, size: 24),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  '1 Safety Alert: Area protest nearby',
                  style: TextStyle(
                    color: Colors.red,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              TextButton(
                onPressed: () {
                  // Handle view safety alert
                },
                child: const Text(
                  'View',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.only(top: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF111714).withOpacity(0.8),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildQuickActionButton(
                icon: Icons.airplane_ticket,
                label: 'My Trip',
                hasNotification: true,
              ),
              _buildQuickActionButton(
                icon: Icons.map,
                label: 'Map',
              ),
              _buildQuickActionButton(
                icon: Icons.local_offer,
                label: 'Deals',
                badge: '🔥 2',
              ),
              _buildQuickActionButton(
                icon: Icons.checklist,
                label: 'Planner',
              ),
              _buildQuickActionButton(
                icon: Icons.translate,
                label: 'Translate',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    bool hasNotification = false,
    String? badge,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Container(
        width: 112,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF29382F),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(icon, color: Colors.white, size: 24),
                if (hasNotification)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFF38E07B),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                if (badge != null)
                  Positioned(
                    top: -8,
                    right: -16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecommendations() {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
            child: Text(
              "Today's Recommendations",
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'How are you feeling?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    _buildMoodButton(
                      icon: Icons.sentiment_satisfied,
                      label: 'Adventurous',
                      isSelected: true,
                    ),
                    _buildMoodButton(
                      icon: Icons.sentiment_neutral,
                      label: 'Relaxed',
                    ),
                    _buildMoodButton(
                      icon: Icons.sentiment_dissatisfied,
                      label: 'Spontaneous',
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Smart Daily Planner',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Ideas based on your time and energy.',
                              style: TextStyle(
                                color: Color(0xFF9EB7A8),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {
                          // Handle create plan
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF38E07B),
                          foregroundColor: Colors.black,
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        child: const Text('Create Plan'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          image: const DecorationImage(
                            image: NetworkImage(
                              'https://lh3.googleusercontent.com/aida-public/AB6AXuA7fYG8FCayWn_BzWYqQEHsgvAt-XFoZGpXSs5BDPWjXTdp-QHcWAMkwypuUQz3fCs_ASHP-8r0wzqNCnm7rwvj10-HdkINuj-VQdG2Q5h4RtJ3IQymBE3G2DmZZqfcZjo3a8bFL-6VllpKfUtwYQTieKGtxRu-YqVHn_8K7XfX8aCuVzytQyc0_5g_LXk6UlwKwnD0LxfLftlut2qB0Fzmdm_PwhZ1dkcdaAJoNuBFsK8Q1xDSpS6zCJpgpu2oHMsNuDfiaJBHmhU',
                            ),
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Morning: Golden Gate Vista',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '2 hours, low energy',
                              style: TextStyle(
                                color: Color(0xFF9EB7A8),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMoodButton({
    required IconData icon,
    required String label,
    bool isSelected = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: OutlinedButton.icon(
        onPressed: () {
          // Handle mood selection
        },
        icon: Icon(
          icon,
          color: isSelected ? const Color(0xFF38E07B) : Colors.white,
        ),
        label: Text(label),
        style: OutlinedButton.styleFrom(
          side: BorderSide(
            color: isSelected
                ? const Color(0xFF38E07B)
                : const Color(0xFF3D5245),
            width: isSelected ? 2 : 1,
          ),
          backgroundColor: isSelected
              ? const Color(0xFF38E07B).withOpacity(0.1)
              : Colors.transparent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
      ),
    );
  }

  Widget _buildLocalHighlights() {
    return SliverToBoxAdapter(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
            child: Text(
              "What's Hot Locally",
              style: TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _buildHighlightCard(),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildCategoryCard(
                        'Food & Culture',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCAt2z91-7hQ6Iv2Ez2LOj0_H5oODGRxU5zA5M2Ibwp166f9twYP25RiW5FHKQXvsazT3BH9cKVwM84MDpnFFcpS8ic15VWuDeBaoRKtr-Lw27NuA-QkGDKq97IoZizZi8U3jaLsNzeLudp5Y-o4yCsJNuMEHiZq8GzBu9pX3yk_9hwYSnJLlzTq5W8Pes-a6zrwpwHxZpeRk-nRcmZJ8BuFE87qlzMMcFBK1ew5qw9UEvdZU2vBK83Gj2H_FlpRMZIOG2EXVn4aIc',
                      ),
                      _buildCategoryCard(
                        'Insider Tips',
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Wp0JZsnPW9GS-9Jx08Oj8mWstvG3m_U9ySnGyGjkMQa0LQf5QxZg7b3-70eNf2p17ooKAHXhos7b-t2WMA6yDoBa1vvT2GngbicL1LQrLeCeyI3fqGthyTC3gy9tgCFxUxzO2ASoSy9LOQuiLOPL2_0eXreiA06uYK-hCIPjE4-MzrwpPVJr90tMy3qTZK7gywUpJUrSKcpqqCsx5lazT0w2V2zzvxI4Di9_OEAn5llnCKxIrMYaPtXj9gKkRGLSs0jURGpIOVI',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHighlightCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: AspectRatio(
                  aspectRatio: 4/3,
                  child: Image.network(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuDUXetume8DpVRmy0PqK0_QIlq8CGlooymYotIjN2yfvyXy-u89a_15Q-M9mM1UvelhZmlbBaJEh5HVLaobe_es5WECPm9godM_P6zbjQ5mk-DKwxrD56mDcc5myO3zbsN4wTzY-3v5Djd5d37ipMMC1QzYZ3Wts7AfujqfR1gP-L4IQVkk8E4IbTDBswP25kIR2xGhalw3VQ6jN98JoWdAeReRzPCB5EY4n4QxvUMv3eRmlBDOHv8YQ1o_p5HAuE7YODv5KPhn7Ao',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text(
                    'Hidden Gem',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.8),
                      ],
                    ),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Clarion Alley Murals',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Vibrant street art in a hidden alley.',
                        style: TextStyle(
                          color: Color(0xFF9EB7A8),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _buildCircularButton(Icons.bookmark_border),
                const SizedBox(width: 8),
                _buildCircularButton(Icons.share),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () {
                    // Handle explore
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF38E07B),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    textStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  child: const Text('Explore'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircularButton(IconData icon) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: IconButton(
        icon: Icon(icon),
        color: Colors.white,
        onPressed: () {
          // Handle button press
        },
      ),
    );
  }

  Widget _buildCategoryCard(String title, String imageUrl) {
    return Container(
      width: 192,
      margin: const EdgeInsets.only(right: 16),
      child: AspectRatio(
        aspectRatio: 1,
        child: Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
              ),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.8),
                    ],
                  ),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(12),
                  ),
                ),
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}