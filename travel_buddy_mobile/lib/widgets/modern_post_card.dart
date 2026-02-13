import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';

class ModernPostCard extends StatefulWidget {
  final dynamic post;
  final bool isHero;
  final VoidCallback? onLike;
  final VoidCallback? onComment;
  final VoidCallback? onShare;
  final VoidCallback? onUserTap;
  final VoidCallback? onReport;
  final VoidCallback? onDelete;
  final VoidCallback? onEdit;
  final String? currentUserId;

  const ModernPostCard({
    super.key,
    required this.post,
    this.isHero = false,
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
  State<ModernPostCard> createState() => _ModernPostCardState();
}

class _ModernPostCardState extends State<ModernPostCard> with SingleTickerProviderStateMixin {
  late AnimationController _likeAnimationController;
  bool _showConfetti = false;

  @override
  void initState() {
    super.initState();
    _likeAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _likeAnimationController.dispose();
    super.dispose();
  }

  bool get _isTipCard => widget.post.hashtags.contains('TravelTips') || widget.post.hashtags.contains('Safety');

  @override
  Widget build(BuildContext context) {
    if (_isTipCard) {
      return _buildTipCard();
    } else if (widget.isHero) {
      return _buildHeroCard();
    } else {
      return _buildStandardCard();
    }
  }

  Widget _buildHeroCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildHeroImage(),
          _buildContent(),
          _buildAttributeBadges(),
          _buildActionBar(),
        ],
      ),
    );
  }

  Widget _buildStandardCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          _buildImageGrid(),
          _buildContent(),
          _buildHashtags(),
          _buildActionBar(),
        ],
      ),
    );
  }

  Widget _buildTipCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF4361EE).withOpacity(0.05), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF4361EE).withOpacity(0.2), width: 2),
        boxShadow: [
          BoxShadow(color: const Color(0xFF4361EE).withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF4361EE), Color(0xFF2EC4B6)]),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                const Text('🎯', style: TextStyle(fontSize: 24)),
                const SizedBox(width: 8),
                const Text('TRAVEL TIP', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.post.content,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF212529), height: 1.5),
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildAvatar(),
                    const SizedBox(width: 8),
                    Text(widget.post.userName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(width: 6),
                    const Icon(Icons.verified, size: 16, color: Color(0xFF4361EE)),
                    const Spacer(),
                    Text(_formatTime(widget.post.createdAt), style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          _buildActionBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(onTap: widget.onUserTap, child: _buildAvatar()),
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
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (widget.post.location.isNotEmpty)
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFF4361EE)),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '${widget.post.location} • 200m',
                          style: const TextStyle(color: Color(0xFF4361EE), fontSize: 13, fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          Text(_formatTime(widget.post.createdAt), style: TextStyle(color: Colors.grey[500], fontSize: 12)),
          if (widget.onReport != null || (widget.onDelete != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId))
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert, color: Colors.grey[600]),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onSelected: (value) {
                if (value == 'report' && widget.onReport != null) widget.onReport!();
                if (value == 'delete' && widget.onDelete != null) widget.onDelete!();
                if (value == 'edit' && widget.onEdit != null) widget.onEdit!();
              },
              itemBuilder: (context) => [
                if (widget.onEdit != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId)
                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit, size: 16, color: Colors.blue), SizedBox(width: 8), Text('Edit')])),
                if (widget.onDelete != null && widget.currentUserId != null && widget.post.userId == widget.currentUserId)
                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete, size: 16, color: Colors.red), SizedBox(width: 8), Text('Delete')])),
                if (widget.onReport != null)
                  const PopupMenuItem(value: 'report', child: Row(children: [Icon(Icons.flag, size: 16, color: Colors.orange), SizedBox(width: 8), Text('Report')])),
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
        backgroundColor: const Color(0xFF4361EE).withOpacity(0.1),
        child: Text(
          widget.post.userName.isNotEmpty ? widget.post.userName[0].toUpperCase() : '?',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF4361EE)),
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

    return CircleAvatar(radius: 20, backgroundImage: NetworkImage(widget.post.userAvatar));
  }

  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 20,
      backgroundColor: const Color(0xFF4361EE).withOpacity(0.1),
      child: Text(
        widget.post.userName.isNotEmpty ? widget.post.userName[0].toUpperCase() : '?',
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF4361EE)),
      ),
    );
  }

  Widget _buildHeroImage() {
    if (widget.post.images.isEmpty) return const SizedBox.shrink();

    return Stack(
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(0)),
            child: _buildImage(widget.post.images.first, height: null),
          ),
        ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),
        if (widget.post.location.isNotEmpty)
          Positioned(
            top: 12,
            left: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.6),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on, size: 14, color: Colors.white),
                  const SizedBox(width: 4),
                  Text(
                    widget.post.location,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildImageGrid() {
    if (widget.post.images.isEmpty) return const SizedBox.shrink();

    if (widget.post.images.length == 1) {
      return ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(0)),
        child: _buildImage(widget.post.images.first, height: 220),
      );
    }

    return SizedBox(
      height: 180,
      child: Row(
        children: widget.post.images.take(3).map((img) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.all(2),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: _buildImage(img, height: 180),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildImage(String imageUrl, {double? height}) {
    if (imageUrl.startsWith('data:image/')) {
      try {
        final bytes = base64Decode(imageUrl.split(',')[1]);
        return Image.memory(bytes, width: double.infinity, height: height, fit: BoxFit.cover);
      } catch (e) {
        return _buildImageError(height ?? 200);
      }
    }

    return Image.network(
      imageUrl,
      width: double.infinity,
      height: height,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(height: height ?? 200, color: Colors.grey[100], child: const Center(child: CircularProgressIndicator()));
      },
      errorBuilder: (context, error, stackTrace) => _buildImageError(height ?? 200),
    );
  }

  Widget _buildImageError(double height) {
    return Container(
      height: height,
      color: Colors.grey[100],
      child: Center(child: Icon(Icons.broken_image, size: 60, color: Colors.grey[400])),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Text(
        widget.post.content,
        style: const TextStyle(fontSize: 16, color: Color(0xFF212529), height: 1.5, fontWeight: FontWeight.w500),
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  Widget _buildAttributeBadges() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          _buildBadge('💰', '25k IDR', const Color(0xFF2EC4B6)),
          _buildBadge('⏱️', '10 min wait', const Color(0xFFFF6B35)),
          _buildBadge('✅', 'English menu', const Color(0xFF4361EE)),
          _buildBadge('⭐', '4.8', const Color(0xFFFFD700)),
        ],
      ),
    );
  }

  Widget _buildBadge(String icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    );
  }

  Widget _buildHashtags() {
    if (widget.post.hashtags.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: widget.post.hashtags.take(3).map((tag) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF4361EE).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text('#$tag', style: const TextStyle(color: Color(0xFF4361EE), fontSize: 12, fontWeight: FontWeight.w600)),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildActionBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          _buildActionButton(
            icon: widget.post.isLiked ? Icons.favorite : Icons.favorite_border,
            label: _formatCount(widget.post.likesCount),
            color: widget.post.isLiked ? Colors.red : const Color(0xFF6C757D),
            onTap: () {
              _handleLike();
              widget.onLike?.call();
            },
          ),
          const SizedBox(width: 20),
          _buildActionButton(
            icon: Icons.chat_bubble_outline,
            label: _formatCount(widget.post.commentsCount),
            color: const Color(0xFF6C757D),
            onTap: widget.onComment,
          ),
          const SizedBox(width: 20),
          _buildActionButton(
            icon: Icons.share_outlined,
            label: _formatCount(widget.post.sharesCount),
            color: const Color(0xFF6C757D),
            onTap: widget.onShare,
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              widget.post.isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: widget.post.isSaved ? const Color(0xFF2EC4B6) : const Color(0xFF6C757D),
            ),
            onPressed: _handleBookmark,
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required String label, required Color color, VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 24, color: color),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
    if (count >= 1000) return '${(count / 1000).toStringAsFixed(1)}K';
    return count.toString();
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) return '${difference.inDays ~/ 7}w';
    if (difference.inDays > 0) return '${difference.inDays}d';
    if (difference.inHours > 0) return '${difference.inHours}h';
    if (difference.inMinutes > 0) return '${difference.inMinutes}m';
    return 'now';
  }

  void _handleLike() {
    context.read<CommunityProvider>().toggleLike(widget.post.id);
    _likeAnimationController.forward().then((_) => _likeAnimationController.reverse());
    setState(() => _showConfetti = true);
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _showConfetti = false);
    });
  }

  void _handleBookmark() {
    context.read<CommunityProvider>().toggleBookmark(widget.post.id);
  }
}
