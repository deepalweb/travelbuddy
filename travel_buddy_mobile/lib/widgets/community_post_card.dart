import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/community_post.dart';
import '../models/travel_enums.dart';
import '../providers/community_provider.dart';
import '../providers/app_provider.dart';
import '../config/environment.dart';
import '../widgets/post_detail_view.dart';
import '../screens/user_profile_screen.dart';
import '../screens/post_comments_screen.dart';
import 'package:share_plus/share_plus.dart';

class CommunityPostCard extends StatefulWidget {
  final CommunityPost post;

  const CommunityPostCard({super.key, required this.post});

  @override
  State<CommunityPostCard> createState() => _CommunityPostCardState();
}

class _CommunityPostCardState extends State<CommunityPostCard> with TickerProviderStateMixin {
  late AnimationController _likeAnimationController;
  late Animation<double> _likeAnimation;
  bool _showFullContent = false;

  @override
  void initState() {
    super.initState();
    _likeAnimationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _likeAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
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
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showPostDetail(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            _buildContent(),
            if (widget.post.images.isNotEmpty) _buildImages(),
            _buildActions(context),
            _buildEngagementBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => _showUserProfile(context),
            child: CircleAvatar(
              radius: 20,
              backgroundColor: Colors.grey[300],
              backgroundImage: widget.post.userAvatar.isNotEmpty 
                  ? NetworkImage(widget.post.userAvatar) 
                  : null,
              onBackgroundImageError: (_, __) {},
              child: widget.post.userAvatar.isEmpty 
                  ? const Icon(Icons.person, color: Colors.grey)
                  : null,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => _showUserProfile(context),
                  child: Text(
                    widget.post.userName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        widget.post.location,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatTime(widget.post.createdAt),
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _buildPostTypeChip(),
          const SizedBox(width: 8),
          _buildPostMenu(context),
        ],
      ),
    );
  }

  Widget _buildPostTypeChip() {
    final colors = {
      PostType.story: Colors.blue,
      PostType.photo: Colors.green,
      PostType.review: Colors.orange,
      PostType.tip: Colors.purple,
      PostType.experience: Colors.teal,
      PostType.question: Colors.indigo,
      PostType.tripDiary: Colors.amber,
    };

    final icons = {
      PostType.story: Icons.auto_stories,
      PostType.photo: Icons.photo_camera,
      PostType.review: Icons.star,
      PostType.tip: Icons.lightbulb,
      PostType.experience: Icons.explore,
      PostType.question: Icons.help_outline,
      PostType.tripDiary: Icons.book,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: colors[widget.post.postType]?.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icons[widget.post.postType] ?? Icons.article,
            size: 14,
            color: colors[widget.post.postType] ?? Colors.grey,
          ),
          const SizedBox(width: 4),
          Text(
            widget.post.postType.displayName,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: colors[widget.post.postType] ?? Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final content = widget.post.content;
    final shouldTruncate = content.length > 150;
    final displayContent = shouldTruncate && !_showFullContent 
        ? '${content.substring(0, 150)}...' 
        : content;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            displayContent,
            style: const TextStyle(fontSize: 14, height: 1.4),
          ),
          if (shouldTruncate)
            GestureDetector(
              onTap: () {
                setState(() {
                  _showFullContent = !_showFullContent;
                });
              },
              child: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  _showFullContent ? 'Show less' : 'Show more',
                  style: TextStyle(
                    color: Colors.blue[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getImageUrl(String url) {
    if (url.startsWith('http')) return url;
    return '${Environment.backendUrl}$url';
  }

  Widget _buildImages() {
    print('🖼️ Post images: ${widget.post.images}');
    
    if (widget.post.images.length == 1) {
      return GestureDetector(
        onTap: () => _showImageGallery(context, 0),
        child: Container(
          margin: const EdgeInsets.all(16),
          height: 250,
          width: double.infinity,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              _getImageUrl(widget.post.images.first),
              height: 250,
              width: double.infinity,
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  height: 250,
                  color: Colors.grey[300],
                  child: const Center(child: CircularProgressIndicator()),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  height: 250,
                  color: Colors.grey[300],
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.image, color: Colors.grey[600], size: 40),
                      const SizedBox(height: 8),
                      Text(
                        'Image',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.all(16),
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: widget.post.images.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () => _showImageGallery(context, index),
            child: Container(
              width: 150,
              margin: EdgeInsets.only(right: index < widget.post.images.length - 1 ? 8 : 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  _getImageUrl(widget.post.images[index]),
                  width: 150,
                  height: 200,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      width: 150,
                      height: 200,
                      color: Colors.grey[300],
                      child: const Center(child: CircularProgressIndicator()),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      width: 150,
                      height: 200,
                      color: Colors.grey[300],
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.image, color: Colors.grey[600], size: 30),
                          const SizedBox(height: 4),
                          Text(
                            'Image ${index + 1}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
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
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () {
                        provider.toggleLike(widget.post.id);
                        if (!widget.post.isLiked) {
                          _likeAnimationController.forward().then((_) {
                            _likeAnimationController.reverse();
                          });
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          widget.post.isLiked ? Icons.favorite : Icons.favorite_border,
                          color: widget.post.isLiked ? Colors.red : Colors.grey[600],
                          size: 24,
                        ),
                      ),
                    ),
                  );
                },
              );
            },
          ),
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => _showComments(context),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(Icons.comment_outlined, color: Colors.grey[600], size: 24),
            ),
          ),
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => _sharePost(),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(Icons.share_outlined, color: Colors.grey[600], size: 24),
            ),
          ),
          const Spacer(),
          InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () => _toggleBookmark(),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Icon(
                widget.post.isSaved ? Icons.bookmark : Icons.bookmark_border,
                color: widget.post.isSaved ? Colors.blue[600] : Colors.grey[600],
                size: 24,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEngagementBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          if (widget.post.likesCount > 0) ...[
            Text(
              '${widget.post.likesCount} ${widget.post.likesCount == 1 ? 'like' : 'likes'}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w500),
            ),
            if (widget.post.commentsCount > 0) ...[
              Text(' • ', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
              Text(
                '${widget.post.commentsCount} ${widget.post.commentsCount == 1 ? 'comment' : 'comments'}',
                style: TextStyle(color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ],
          ] else if (widget.post.commentsCount > 0) ...[
            Text(
              '${widget.post.commentsCount} ${widget.post.commentsCount == 1 ? 'comment' : 'comments'}',
              style: TextStyle(color: Colors.grey[600], fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
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

  void _showPostDetail(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(widget.post.userName),
            backgroundColor: Colors.blue[600],
            foregroundColor: Colors.white,
          ),
          body: SingleChildScrollView(
            child: PostDetailView(post: widget.post),
          ),
        ),
      ),
    );
  }

  void _showUserProfile(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => UserProfileScreen(
          userId: widget.post.userId,
          userName: widget.post.userName,
        ),
      ),
    );
  }
  
  void _showComments(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PostCommentsScreen(post: widget.post),
      ),
    );
  }

  void _showImageGallery(BuildContext context, int initialIndex) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
            title: Text('${initialIndex + 1} of ${widget.post.images.length}'),
          ),
          body: PageView.builder(
            controller: PageController(initialPage: initialIndex),
            itemCount: widget.post.images.length,
            itemBuilder: (context, index) {
              return InteractiveViewer(
                child: Center(
                  child: Image.network(
                    _getImageUrl(widget.post.images[index]),
                    fit: BoxFit.contain,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return const Center(child: CircularProgressIndicator());
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[800],
                        child: const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.image, color: Colors.white, size: 50),
                              SizedBox(height: 8),
                              Text(
                                'Image Preview',
                                style: TextStyle(color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  void _sharePost() {
    Share.share(
      'Check out this travel post by ${widget.post.userName}:\n\n${widget.post.content}\n\nLocation: ${widget.post.location}',
      subject: 'Travel Post from ${widget.post.userName}',
    );
  }

  void _toggleBookmark() async {
    final provider = context.read<CommunityProvider>();
    final success = await provider.toggleBookmark(widget.post.id);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            widget.post.isSaved ? 'Removed from bookmarks' : 'Added to bookmarks',
          ),
        ),
      );
    }
  }

  Widget _buildPostMenu(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final currentUserId = appProvider.currentUser?.mongoId ?? appProvider.currentUser?.uid;
    final isOwner = currentUserId == widget.post.userId;

    if (!isOwner) return const SizedBox.shrink();

    return PopupMenuButton<String>(
      icon: Icon(Icons.more_vert, color: Colors.grey[600], size: 20),
      onSelected: (value) {
        if (value == 'edit') {
          _showEditDialog(context);
        } else if (value == 'delete') {
          _showDeleteDialog(context);
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'edit',
          child: Row(
            children: [
              Icon(Icons.edit, size: 20),
              SizedBox(width: 12),
              Text('Edit'),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(Icons.delete, size: 20, color: Colors.red),
              SizedBox(width: 12),
              Text('Delete', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
      ],
    );
  }

  void _showEditDialog(BuildContext context) {
    final contentController = TextEditingController(text: widget.post.content);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit Post'),
        content: TextField(
          controller: contentController,
          maxLines: 5,
          decoration: const InputDecoration(
            hintText: 'What\'s on your mind?',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newContent = contentController.text.trim();
              if (newContent.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Content cannot be empty')),
                );
                return;
              }

              Navigator.pop(context);
              
              final provider = context.read<CommunityProvider>();
              final success = await provider.editPost(
                postId: widget.post.id,
                content: newContent,
                location: widget.post.location,
              );

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Post updated successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to update post'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
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
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              
              final provider = context.read<CommunityProvider>();
              final success = await provider.deletePost(widget.post.id);

              if (success) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Post deleted successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Failed to delete post'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}