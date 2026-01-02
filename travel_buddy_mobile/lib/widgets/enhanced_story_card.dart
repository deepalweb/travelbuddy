import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';
import '../screens/story_detail_screen.dart';

class EnhancedStoryCard extends StatelessWidget {
  final CommunityPost post;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;
  final VoidCallback? onUserTap;
  final VoidCallback? onReport;
  final VoidCallback? onDelete;
  final String? currentUserId;

  const EnhancedStoryCard({
    super.key, 
    required this.post,
    this.onLike,
    this.onComment,
    this.onShare,
    this.onUserTap,
    this.onReport,
    this.onDelete,
    this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTap: () => _handleLike(context),
      onTap: () => _openStoryDetail(context),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context),
            _buildImage(),
            _buildContent(),
            _buildHashtags(),
            _buildActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          GestureDetector(
            onTap: onUserTap,
            child: _buildAvatar(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: onUserTap,
                  child: Text(
                    post.userName,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                if (post.location.isNotEmpty)
                  GestureDetector(
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
                          Flexible(
                            child: Text(
                              post.location,
                              style: TextStyle(
                                color: Colors.blue[700],
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(Icons.arrow_forward_ios, size: 10, color: Colors.blue[700]),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          Text(
            _formatTime(post.createdAt),
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
          if (onReport != null || (onDelete != null && currentUserId != null && post.userId == currentUserId))
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: Colors.grey[600]),
              onSelected: (value) {
                if (value == 'report' && onReport != null) onReport!();
                if (value == 'delete' && onDelete != null) onDelete!();
              },
              itemBuilder: (context) => [
                if (onDelete != null && currentUserId != null && post.userId == currentUserId)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete, size: 16, color: Colors.red),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
                if (onReport != null)
                  const PopupMenuItem(
                    value: 'report',
                    child: Row(
                      children: [
                        Icon(Icons.flag, size: 16, color: Colors.orange),
                        SizedBox(width: 8),
                        Text('Report'),
                      ],
                    ),
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
        radius: 20,
        backgroundColor: Colors.blue[100],
        child: Text(
          post.userName.isNotEmpty ? post.userName[0].toUpperCase() : '?',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue[700]),
        ),
      );
    }

    if (post.userAvatar.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(post.userAvatar.split(',')[1]);
        return CircleAvatar(radius: 20, backgroundImage: MemoryImage(bytes));
      } catch (e) {
        return _buildFallbackAvatar();
      }
    }

    return CircleAvatar(
      radius: 20,
      backgroundImage: NetworkImage(post.userAvatar),
      onBackgroundImageError: (_, __) {},
    );
  }

  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 20,
      backgroundColor: Colors.blue[100],
      child: Text(
        post.userName.isNotEmpty ? post.userName[0].toUpperCase() : '?',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue[700]),
      ),
    );
  }

  Widget _buildImage() {
    if (post.images.isEmpty) {
      return Container(
        height: 200,
        color: Colors.grey[100],
        child: Center(
          child: Icon(Icons.image_outlined, size: 60, color: Colors.grey[400]),
        ),
      );
    }

    final imageUrl = post.images.first;
    
    if (imageUrl.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(imageUrl.split(',')[1]);
        return Image.memory(
          bytes,
          width: double.infinity,
          height: 250,
          fit: BoxFit.cover,
        );
      } catch (e) {
        return _buildImageError();
      }
    }

    return Image.network(
      imageUrl,
      width: double.infinity,
      height: 250,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          height: 250,
          color: Colors.grey[100],
          child: const Center(child: CircularProgressIndicator()),
        );
      },
      errorBuilder: (context, error, stackTrace) => _buildImageError(),
    );
  }

  Widget _buildImageError() {
    return Container(
      height: 250,
      color: Colors.grey[100],
      child: Center(
        child: Icon(Icons.broken_image, size: 60, color: Colors.grey[400]),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (post.title.isNotEmpty) ...[
            Text(
              post.title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
          ],
          Text(
            post.content,
            style: TextStyle(fontSize: 14, color: Colors.grey[800], height: 1.4),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildHashtags() {
    if (post.hashtags.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 32,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: post.hashtags.length,
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              '#${post.hashtags[index]}',
              style: TextStyle(
                color: Colors.blue[700],
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          _buildActionButton(
            icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
            label: post.likesCount.toString(),
            color: post.isLiked ? Colors.red : Colors.grey[700]!,
            onTap: () {
              _handleLike(context);
              onLike?.call();
            },
          ),
          const SizedBox(width: 16),
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: post.commentsCount.toString(),
            color: Colors.grey[700]!,
            onTap: () {
              if (onComment != null) {
                onComment!();
              } else {
                _openStoryDetail(context);
              }
            },
          ),
          const SizedBox(width: 16),
          _buildActionButton(
            icon: Icons.share_outlined,
            label: 'Share',
            color: Colors.grey[700]!,
            onTap: onShare ?? () {},
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              post.isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: post.isSaved ? Colors.blue[600] : Colors.grey[700],
            ),
            onPressed: () => _handleBookmark(context),
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
          Icon(icon, size: 22, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) {
      return '${difference.inDays ~/ 7}w';
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }

  void _handleLike(BuildContext context) {
    context.read<CommunityProvider>().toggleLike(post.id);
  }

  void _handleBookmark(BuildContext context) {
    context.read<CommunityProvider>().toggleBookmark(post.id);
  }

  void _openStoryDetail(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StoryDetailScreen(post: post),
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
                // Use search query instead of location parameter
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
