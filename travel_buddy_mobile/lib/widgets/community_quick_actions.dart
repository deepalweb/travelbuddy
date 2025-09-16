import 'package:flutter/material.dart';
import '../screens/create_post_screen.dart';

class CommunityQuickActions extends StatelessWidget {
  const CommunityQuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Quick Actions',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      context,
                      'Share Story',
                      Icons.auto_stories,
                      Colors.blue,
                      () => _navigateToCreatePost(context, 'story'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildActionButton(
                      context,
                      'Post Photo',
                      Icons.photo_camera,
                      Colors.green,
                      () => _navigateToCreatePost(context, 'photo'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildActionButton(
                      context,
                      'Share Tip',
                      Icons.lightbulb,
                      Colors.orange,
                      () => _navigateToCreatePost(context, 'tip'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildActionButton(
                      context,
                      'Ask Question',
                      Icons.help_outline,
                      Colors.purple,
                      () => _navigateToCreatePost(context, 'question'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToCreatePost(BuildContext context, String postType) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreatePostScreen(initialPostType: postType),
      ),
    );
  }
}

