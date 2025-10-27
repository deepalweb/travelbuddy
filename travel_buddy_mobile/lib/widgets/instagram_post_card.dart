import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';
import '../screens/post_comments_screen.dart';
import '../screens/user_profile_screen.dart';
import '../screens/create_post_screen.dart';
import '../providers/app_provider.dart';
import 'user_profile_modal.dart';
import 'package:share_plus/share_plus.dart';

class InstagramPostCard extends StatefulWidget {
  final CommunityPost post;

  const InstagramPostCard({super.key, required this.post});

  @override
  State<InstagramPostCard> createState() => _InstagramPostCardState();
}

class _InstagramPostCardState extends State<InstagramPostCard>
    with TickerProviderStateMixin {
  late AnimationController _likeAnimationController;
  late Animation<double> _likeAnimation;
  bool _showFullCaption = false;

  @override
  void initState() {
    super.initState();
    _likeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _likeAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _likeAnimationController, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _likeAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildImage(),
          _buildActions(),
          _buildLikesCount(),
          _buildCaption(),
          _buildComments(),
          _buildTimeStamp(),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _showUserProfile(),
            onLongPress: () => _showQuickProfile(),
            child: _buildUserAvatar(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => _showUserProfile(),
                  onLongPress: () => _showQuickProfile(),
                  child: Text(
                    widget.post.userName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                ),
                if (widget.post.location.isNotEmpty)
                  Text(
                    widget.post.location,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.more_vert, size: 20),
            onPressed: () => _showMoreOptions(),
          ),
        ],
      ),
    );
  }

  Widget _buildImage() {
    print('🖼️ [POST] Building image for post: ${widget.post.id}');
    print('🖼️ [POST] Images count: ${widget.post.images.length}');
    if (widget.post.images.isNotEmpty) {
      print('🖼️ [POST] First image URL: ${widget.post.images.first}');
    }
    
    if (widget.post.images.isEmpty) {
      print('🖼️ [POST] No images - showing placeholder');
      return Container(
        height: 300,
        color: Colors.grey[100],
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.image, size: 60, color: Colors.grey[400]),
              const SizedBox(height: 8),
              Text(
                'No Image',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      onDoubleTap: _handleDoubleTap,
      child: Container(
        height: 300,
        width: double.infinity,
        child: widget.post.images.length == 1
            ? _buildSingleImage()
            : _buildImageCarousel(),
      ),
    );
  }

  Widget _buildSingleImage() {
    final imageUrl = widget.post.images.first;
    print('🖼️ [POST] Loading single image: ${imageUrl.substring(0, 50)}...');
    
    // Handle base64 data URLs
    if (imageUrl.startsWith('data:image/')) {
      try {
        final base64String = imageUrl.split(',')[1];
        final bytes = base64Decode(base64String);
        print('✅ [POST] Loading base64 image (${bytes.length} bytes)');
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
        );
      } catch (e) {
        print('❌ [POST] Base64 decode error: $e');
        return _buildImageError();
      }
    }
    
    // Handle regular network URLs
    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) {
          print('✅ [POST] Network image loaded: $imageUrl');
          return child;
        }
        return Container(
          color: Colors.grey[100],
          child: const Center(child: CircularProgressIndicator()),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        print('❌ [POST] Network image error: $error');
        return _buildImageError();
      },
    );
  }
  
  Widget _buildImageError() {
    return Container(
      color: Colors.grey[100],
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.image, size: 60, color: Colors.grey[400]),
            const SizedBox(height: 8),
            Text(
              'Image Failed',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageCarousel() {
    return PageView.builder(
      itemCount: widget.post.images.length,
      itemBuilder: (context, index) {
        final imageUrl = widget.post.images[index];
        
        // Handle base64 data URLs
        if (imageUrl.startsWith('data:image/')) {
          try {
            final base64String = imageUrl.split(',')[1];
            final bytes = base64Decode(base64String);
            return Image.memory(bytes, fit: BoxFit.cover);
          } catch (e) {
            return _buildImageError();
          }
        }
        
        // Handle regular network URLs
        return Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => _buildImageError(),
        );
      },
    );
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Consumer<CommunityProvider>(
            builder: (context, provider, child) {
              return AnimatedBuilder(
                animation: _likeAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _likeAnimation.value,
                    child: GestureDetector(
                      onTap: _handleLike,
                      child: Icon(
                        widget.post.isLiked ? Icons.favorite : Icons.favorite_border,
                        color: widget.post.isLiked ? Colors.red : Colors.black,
                        size: 26,
                      ),
                    ),
                  );
                },
              );
            },
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: _showComments,
            child: const Icon(Icons.chat_bubble_outline, size: 26),
          ),
          const SizedBox(width: 16),
          GestureDetector(
            onTap: _sharePost,
            child: const Icon(Icons.send_outlined, size: 26),
          ),
          const Spacer(),
          GestureDetector(
            onTap: _toggleBookmark,
            child: Icon(
              widget.post.isSaved ? Icons.bookmark : Icons.bookmark_border,
              size: 26,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLikesCount() {
    if (widget.post.likesCount == 0) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Text(
        '${widget.post.likesCount} ${widget.post.likesCount == 1 ? 'like' : 'likes'}',
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    );
  }

  Widget _buildCaption() {
    if (widget.post.content.isEmpty) return const SizedBox.shrink();

    final shouldTruncate = widget.post.content.length > 100;
    final displayContent = shouldTruncate && !_showFullCaption
        ? '${widget.post.content.substring(0, 100)}...'
        : widget.post.content;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(color: Colors.black, fontSize: 14),
          children: [
            TextSpan(
              text: '${widget.post.userName} ',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            TextSpan(text: displayContent),
            if (shouldTruncate)
              WidgetSpan(
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _showFullCaption = !_showFullCaption;
                    });
                  },
                  child: Text(
                    _showFullCaption ? ' less' : ' more',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildComments() {
    if (widget.post.commentsCount == 0) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: GestureDetector(
        onTap: _showComments,
        child: Text(
          'View all ${widget.post.commentsCount} comments',
          style: TextStyle(color: Colors.grey[600], fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildTimeStamp() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: Text(
        _formatTime(widget.post.createdAt),
        style: TextStyle(color: Colors.grey[600], fontSize: 12),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }

  void _handleDoubleTap() {
    if (!widget.post.isLiked) {
      _handleLike();
    }
  }

  void _handleLike() {
    context.read<CommunityProvider>().toggleLike(widget.post.id);
    if (!widget.post.isLiked) {
      _likeAnimationController.forward().then((_) {
        _likeAnimationController.reverse();
      });
    }
  }

  void _showComments() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PostCommentsScreen(post: widget.post),
      ),
    );
  }

  void _showUserProfile() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => UserProfileScreen(
          userId: widget.post.userId,
          userName: widget.post.userName,
        ),
      ),
    );
  }

  void _showQuickProfile() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.8,
        minChildSize: 0.4,
        builder: (context, scrollController) => UserProfileModal(
          userId: widget.post.userId,
          userName: widget.post.userName,
          userAvatar: widget.post.userAvatar,
        ),
      ),
    );
  }

  void _sharePost() {
    final shareText = '${widget.post.userName} shared: ${widget.post.content}\n\nLocation: ${widget.post.location}\n\nShared via TravelBuddy';
    Share.share(shareText, subject: 'Travel Experience from ${widget.post.userName}');
  }

  void _toggleBookmark() {
    context.read<CommunityProvider>().toggleBookmark(widget.post.id);
  }

  Widget _buildUserAvatar() {
    print('🖼️ [AVATAR] User: ${widget.post.userName}');
    print('🖼️ [AVATAR] Avatar URL: "${widget.post.userAvatar}"');
    print('🖼️ [AVATAR] Is empty: ${widget.post.userAvatar.isEmpty}');
    print('🖼️ [AVATAR] Is fallback: ${widget.post.userAvatar.contains("unsplash")}');
    
    // If no avatar or fallback, show user initial
    if (widget.post.userAvatar.isEmpty || widget.post.userAvatar.contains('unsplash')) {
      return CircleAvatar(
        radius: 16,
        backgroundColor: Colors.blue[100],
        child: Text(
          widget.post.userName[0].toUpperCase(),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.blue[700],
          ),
        ),
      );
    }
    
    // Handle base64 images (uploaded profile pictures)
    if (widget.post.userAvatar.startsWith('data:image/')) {
      try {
        final base64String = widget.post.userAvatar.split(',')[1];
        final bytes = base64Decode(base64String);
        print('✅ [AVATAR] Using base64 image (${bytes.length} bytes)');
        return CircleAvatar(
          radius: 16,
          backgroundColor: Colors.grey[300],
          backgroundImage: MemoryImage(bytes),
        );
      } catch (e) {
        print('❌ [AVATAR] Base64 decode error: $e');
        return _buildFallbackAvatar();
      }
    }
    
    // Handle network images (Google photos, etc.)
    return CircleAvatar(
      radius: 16,
      backgroundColor: Colors.grey[300],
      backgroundImage: NetworkImage(widget.post.userAvatar),
      onBackgroundImageError: (error, stackTrace) {
        print('❌ [AVATAR] Network image error: $error');
      },
    );
  }
  
  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 16,
      backgroundColor: Colors.blue[100],
      child: Text(
        widget.post.userName[0].toUpperCase(),
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.blue[700],
        ),
      ),
    );
  }

  void _showMoreOptions() {
    final currentUser = context.read<AppProvider>().currentUser;
    
    // Debug logging
    print('🔍 DEBUG: Checking post ownership');
    print('  - Current user: ${currentUser?.username ?? "None"} (${currentUser?.uid ?? "None"})');
    print('  - Current user MongoDB ID: ${currentUser?.mongoId ?? "None"}');
    print('  - Post user ID: ${widget.post.userId}');
    print('  - Post user name: ${widget.post.userName}');
    
    final isOwnPost = currentUser != null && 
        (widget.post.userId == currentUser.mongoId || 
         widget.post.userId == currentUser.uid ||
         widget.post.userName == currentUser.username);
    
    print('  - Is own post: $isOwnPost');

    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isOwnPost) ...[
              ListTile(
                leading: const Icon(Icons.edit, color: Colors.blue),
                title: const Text('Edit Post'),
                onTap: () {
                  Navigator.pop(context);
                  _editPost();
                },
              ),
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: const Text('Delete Post'),
                onTap: () {
                  Navigator.pop(context);
                  _deletePost();
                },
              ),
              const Divider(),
            ],
            ListTile(
              leading: const Icon(Icons.share),
              title: const Text('Share Post'),
              onTap: () {
                Navigator.pop(context);
                _sharePost();
              },
            ),
            ListTile(
              leading: const Icon(Icons.link),
              title: const Text('Copy Link'),
              onTap: () {
                Navigator.pop(context);
                _copyLink();
              },
            ),
            if (!isOwnPost)
              ListTile(
                leading: const Icon(Icons.report, color: Colors.orange),
                title: const Text('Report'),
                onTap: () {
                  Navigator.pop(context);
                  _reportPost();
                },
              ),
          ],
        ),
      ),
    );
  }

  void _editPost() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreatePostScreen(
          editingPost: widget.post,
        ),
      ),
    );
    if (result == true) {
      // Post was updated, refresh the feed
      context.read<CommunityProvider>().loadPosts(refresh: true, context: context);
    }
  }

  void _deletePost() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this post? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<CommunityProvider>().deletePost(widget.post.id);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Post deleted successfully'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _copyLink() {
    final link = 'https://travelbuddy.app/post/${widget.post.id}';
    Share.share(link);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Link copied to clipboard')),
    );
  }

  void _reportPost() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Post'),
        content: const Text('Why are you reporting this post?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Post reported. Thank you for your feedback.')),
              );
            },
            child: const Text('Report'),
          ),
        ],
      ),
    );
  }
}