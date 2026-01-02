import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';
import 'post_comments_screen.dart';

class StoryDetailScreen extends StatelessWidget {
  final CommunityPost post;

  const StoryDetailScreen({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(context),
          SliverToBoxAdapter(child: _buildImageGallery()),
          SliverToBoxAdapter(child: _buildHeader()),
          SliverToBoxAdapter(child: _buildContent()),
          SliverToBoxAdapter(child: _buildHashtags()),
          SliverToBoxAdapter(child: _buildActions(context)),
          SliverToBoxAdapter(child: _buildComments(context)),
        ],
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      pinned: true,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.black),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.more_vert, color: Colors.black),
          onPressed: () {},
        ),
      ],
    );
  }

  Widget _buildImageGallery() {
    if (post.images.isEmpty) {
      return Container(
        height: 300,
        color: Colors.grey[100],
        child: Center(
          child: Icon(Icons.image_outlined, size: 80, color: Colors.grey[400]),
        ),
      );
    }

    if (post.images.length == 1) {
      return _buildSingleImage(post.images.first);
    }

    return SizedBox(
      height: 300,
      child: PageView.builder(
        itemCount: post.images.length,
        itemBuilder: (context, index) => _buildSingleImage(post.images[index]),
      ),
    );
  }

  Widget _buildSingleImage(String imageUrl) {
    if (imageUrl.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(imageUrl.split(',')[1]);
        return Image.memory(bytes, fit: BoxFit.cover, width: double.infinity);
      } catch (e) {
        return _buildImageError();
      }
    }

    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      width: double.infinity,
      errorBuilder: (context, error, stackTrace) => _buildImageError(),
    );
  }

  Widget _buildImageError() {
    return Container(
      height: 300,
      color: Colors.grey[100],
      child: Center(
        child: Icon(Icons.broken_image, size: 80, color: Colors.grey[400]),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (post.title.isNotEmpty) ...[
            Text(
              post.title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
          ],
          Row(
            children: [
              _buildAvatar(),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      post.userName,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                    ),
                    if (post.location.isNotEmpty)
                      Builder(
                        builder: (context) => GestureDetector(
                          onTap: () => _showLocationDetails(context),
                          child: Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.blue[200]!, width: 1),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.location_on, size: 14, color: Colors.blue[700]),
                                const SizedBox(width: 4),
                                Text(
                                  post.location,
                                  style: TextStyle(
                                    color: Colors.blue[700],
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(Icons.arrow_forward_ios, size: 10, color: Colors.blue[700]),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              Text(
                _formatDate(post.createdAt),
                style: TextStyle(color: Colors.grey[500], fontSize: 13),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    if (post.userAvatar.isEmpty || post.userAvatar.contains('unsplash')) {
      return CircleAvatar(
        radius: 24,
        backgroundColor: Colors.blue[100],
        child: Text(
          post.userName.isNotEmpty ? post.userName[0].toUpperCase() : '?',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[700]),
        ),
      );
    }

    if (post.userAvatar.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(post.userAvatar.split(',')[1]);
        return CircleAvatar(radius: 24, backgroundImage: MemoryImage(bytes));
      } catch (e) {
        return _buildFallbackAvatar();
      }
    }

    return CircleAvatar(
      radius: 24,
      backgroundImage: NetworkImage(post.userAvatar),
    );
  }

  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 24,
      backgroundColor: Colors.blue[100],
      child: Text(
        post.userName.isNotEmpty ? post.userName[0].toUpperCase() : '?',
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue[700]),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Text(
        post.content,
        style: const TextStyle(fontSize: 16, height: 1.6, color: Colors.black87),
      ),
    );
  }

  Widget _buildHashtags() {
    if (post.hashtags.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: post.hashtags.map((tag) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              '#$tag',
              style: TextStyle(
                color: Colors.blue[700],
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.grey[200]!),
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Row(
        children: [
          Consumer<CommunityProvider>(
            builder: (context, provider, child) {
              return _buildActionButton(
                icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                label: '${post.likesCount} Likes',
                color: post.isLiked ? Colors.red : Colors.grey[700]!,
                onTap: () => provider.toggleLike(post.id),
              );
            },
          ),
          const SizedBox(width: 24),
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: '${post.commentsCount} Comments',
            color: Colors.grey[700]!,
            onTap: () => _openComments(context),
          ),
          const Spacer(),
          Consumer<CommunityProvider>(
            builder: (context, provider, child) {
              return IconButton(
                icon: Icon(
                  post.isSaved ? Icons.bookmark : Icons.bookmark_border,
                  color: post.isSaved ? Colors.blue[600] : Colors.grey[700],
                  size: 28,
                ),
                onPressed: () => provider.toggleBookmark(post.id),
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.share_outlined, color: Colors.grey[700], size: 28),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildComments(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Comments',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: () => _openComments(context),
            icon: const Icon(Icons.comment),
            label: Text('View all ${post.commentsCount} comments'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  void _openComments(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PostCommentsScreen(post: post),
      ),
    );
  }
  
  void _showLocationDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.location_on, color: Colors.blue[700], size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    post.location,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.map, color: Colors.blue),
              title: const Text('View on Map'),
              onTap: () async {
                Navigator.pop(context);
                final url = 'https://maps.google.com/?q=${Uri.encodeComponent(post.location)}';
                if (await canLaunchUrl(Uri.parse(url))) {
                  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.search, color: Colors.green),
              title: const Text('Find Posts from this Location'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Search "${post.location}" in the search bar to find posts from this location'),
                    duration: const Duration(seconds: 3),
                  ),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.directions, color: Colors.orange),
              title: const Text('Get Directions'),
              onTap: () async {
                Navigator.pop(context);
                final url = 'https://maps.google.com/maps?daddr=${Uri.encodeComponent(post.location)}';
                if (await canLaunchUrl(Uri.parse(url))) {
                  await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
