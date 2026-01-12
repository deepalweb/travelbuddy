import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';
import '../screens/story_detail_screen.dart';

class EnhancedStoryCard extends StatefulWidget {
  final CommunityPost post;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;
  final VoidCallback? onUserTap;
  final VoidCallback? onReport;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;
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
    this.onEdit,
    this.currentUserId,
  });

  @override
  State<EnhancedStoryCard> createState() => _EnhancedStoryCardState();
}

class _EnhancedStoryCardState extends State<EnhancedStoryCard> {
  VideoPlayerController? _videoController;
  ChewieController? _chewieController;

  @override
  void initState() {
    super.initState();
    if (widget.post.videos.isNotEmpty) {
      _initializeVideo();
    }
  }

  @override
  void dispose() {
    _chewieController?.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _initializeVideo() async {
    try {
      _videoController = VideoPlayerController.networkUrl(Uri.parse(widget.post.videos.first));
      await _videoController!.initialize();
      _chewieController = ChewieController(
        videoPlayerController: _videoController!,
        autoPlay: false,
        looping: false,
        aspectRatio: _videoController!.value.aspectRatio,
      );
      if (mounted) setState(() {});
    } catch (e) {
      print('❌ Video initialization error: $e');
    }
  }

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
    final isOwner = widget.currentUserId != null && widget.post.userId == widget.currentUserId;
    print('📝 Post ${widget.post.id}: userId=${widget.post.userId}, currentUserId=${widget.currentUserId}, isOwner=$isOwner');
    
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          GestureDetector(
            onTap: widget.onUserTap,
            child: _buildAvatar(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: widget.onUserTap,
                  child: Text(
                    widget.post.userName,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                  ),
                ),
                if (widget.post.location.isNotEmpty)
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
                              widget.post.location,
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
            _formatTime(widget.post.createdAt),
            style: TextStyle(color: Colors.grey[500], fontSize: 12),
          ),
          if (widget.onReport != null || (widget.onDelete != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId) || (widget.onEdit != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId))
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: Colors.grey[600]),
              onSelected: (value) {
                if (value == 'report' && widget.onReport != null) widget.onReport!();
                if (value == 'delete' && widget.onDelete != null) widget.onDelete!();
                if (value == 'edit' && widget.onEdit != null) widget.onEdit!();
              },
              itemBuilder: (context) => [
                if (widget.onEdit != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId)
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit, size: 16, color: Colors.blue),
                        SizedBox(width: 8),
                        Text('Edit', style: TextStyle(color: Colors.blue)),
                      ],
                    ),
                  ),
                if (widget.onDelete != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId)
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
                if (widget.onReport != null)
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
    if (widget.post.userAvatar.isEmpty || widget.post.userAvatar.contains('unsplash')) {
      return CircleAvatar(
        radius: 20,
        backgroundColor: Colors.blue[100],
        child: Text(
          widget.post.userName.isNotEmpty ? widget.post.userName[0].toUpperCase() : '?',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue[700]),
        ),
      );
    }

    if (widget.post.userAvatar.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(widget.post.userAvatar.split(',')[1]);
        return CircleAvatar(radius: 20, backgroundImage: MemoryImage(bytes));
      } catch (e) {
        return _buildFallbackAvatar();
      }
    }

    return CircleAvatar(
      radius: 20,
      backgroundImage: NetworkImage(widget.post.userAvatar),
      onBackgroundImageError: (_, __) {},
    );
  }

  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 20,
      backgroundColor: Colors.blue[100],
      child: Text(
        widget.post.userName.isNotEmpty ? widget.post.userName[0].toUpperCase() : '?',
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue[700]),
      ),
    );
  }

  Widget _buildImage() {
    if (widget.post.videos.isNotEmpty) {
      if (_chewieController != null && _videoController!.value.isInitialized) {
        return Container(
          height: 250,
          color: Colors.black,
          child: Chewie(controller: _chewieController!),
        );
      }
      return Container(
        height: 250,
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }
    
    if (widget.post.images.isEmpty) {
      return Container(
        height: 200,
        color: Colors.grey[100],
        child: Center(
          child: Icon(Icons.image_outlined, size: 60, color: Colors.grey[400]),
        ),
      );
    }

    final imageUrl = widget.post.images.first;
    
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
          if (widget.post.title.isNotEmpty) ...[
            Text(
              widget.post.title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
          ],
          Text(
            widget.post.content,
            style: TextStyle(fontSize: 14, color: Colors.grey[800], height: 1.4),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildHashtags() {
    if (widget.post.hashtags.isEmpty) return const SizedBox.shrink();

    return Container(
      height: 32,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: widget.post.hashtags.length,
        itemBuilder: (context, index) {
          return Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              '#${widget.post.hashtags[index]}',
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
      child: Column(
        children: [
          if (widget.post.viewsCount > 0 || widget.post.sharesCount > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  if (widget.post.viewsCount > 0) ...[
                    Icon(Icons.visibility, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      _formatCount(widget.post.viewsCount),
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    const SizedBox(width: 16),
                  ],
                  if (widget.post.sharesCount > 0) ...[
                    Icon(Icons.share, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      _formatCount(widget.post.sharesCount),
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ],
              ),
            ),
          Row(
            children: [
              _buildActionButton(
                icon: widget.post.isLiked ? Icons.favorite : Icons.favorite_border,
                label: _formatCount(widget.post.likesCount),
                color: widget.post.isLiked ? Colors.red : Colors.grey[700]!,
                onTap: () {
                  _handleLike(context);
                  widget.onLike?.call();
                },
              ),
              const SizedBox(width: 16),
              _buildActionButton(
                icon: Icons.chat_bubble_outline,
                label: _formatCount(widget.post.commentsCount),
                color: Colors.grey[700]!,
                onTap: () {
                  if (widget.onComment != null) {
                    widget.onComment!();
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
                onTap: () => _handleShare(context),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(
                  widget.post.isSaved ? Icons.bookmark : Icons.bookmark_border,
                  color: widget.post.isSaved ? Colors.blue[600] : Colors.grey[700],
                ),
                onPressed: () => _handleBookmark(context),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
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
    context.read<CommunityProvider>().toggleLike(widget.post.id);
  }

  void _handleBookmark(BuildContext context) {
    context.read<CommunityProvider>().toggleBookmark(widget.post.id);
  }

  void _handleShare(BuildContext context) async {
    try {
      final text = '${widget.post.content}\n\n📍 ${widget.post.location}\n\nShared from Travel Buddy';
      await Share.share(
        text,
        subject: widget.post.title.isNotEmpty ? widget.post.title : 'Check out this place!',
      );
      widget.onShare?.call();
    } catch (e) {
      print('❌ Share error: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to share post')),
        );
      }
    }
  }

  void _openStoryDetail(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StoryDetailScreen(post: widget.post),
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
                    widget.post.location,
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
                final url = 'https://maps.google.com/?q=${Uri.encodeComponent(widget.post.location)}';
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
                    content: Text('Search "${widget.post.location}" in the search bar to find posts from this location'),
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
                final url = 'https://maps.google.com/maps?daddr=${Uri.encodeComponent(widget.post.location)}';
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
