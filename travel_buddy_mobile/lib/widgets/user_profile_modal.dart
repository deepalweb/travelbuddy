import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/community_post.dart';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../screens/user_profile_screen.dart';

class UserProfileModal extends StatefulWidget {
  final String userId;
  final String userName;
  final String userAvatar;

  const UserProfileModal({
    super.key,
    required this.userId,
    required this.userName,
    required this.userAvatar,
  });

  @override
  State<UserProfileModal> createState() => _UserProfileModalState();
}

class _UserProfileModalState extends State<UserProfileModal> {
  List<CommunityPost> _userPosts = [];
  bool _isFollowing = false;
  Map<String, dynamic> _userStats = {};

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  void _loadUserData() {
    final provider = context.read<CommunityProvider>();
    _userPosts = provider.posts.where((post) => post.userId == widget.userId).toList();
    
    final totalLikes = _userPosts.fold<int>(0, (sum, post) => sum + post.likesCount);
    final totalComments = _userPosts.fold<int>(0, (sum, post) => sum + post.commentsCount);
    
    _userStats = {
      'posts': _userPosts.length,
      'followers': 156 + (_userPosts.length * 12),
      'following': 89 + (_userPosts.length * 3),
      'likes': totalLikes,
      'photos': _userPosts.where((p) => p.images.isNotEmpty).length,
    };
    
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = context.read<AppProvider>().currentUser;
    final isOwnProfile = currentUser?.uid == widget.userId;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Profile header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildAvatar(),
                const SizedBox(height: 12),
                Text(
                  widget.userName,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isOwnProfile ? 'Your Profile' : 'Fellow Traveler',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          // Stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatItem('Posts', '${_userStats['posts'] ?? 0}'),
                _buildStatItem('Followers', '${_userStats['followers'] ?? 0}'),
                _buildStatItem('Likes', '${_userStats['likes'] ?? 0}'),
                _buildStatItem('Photos', '${_userStats['photos'] ?? 0}'),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Action buttons
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => UserProfileScreen(
                            userId: widget.userId,
                            userName: widget.userName,
                          ),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('View Full Profile'),
                  ),
                ),
                if (!isOwnProfile) ...[
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: () {
                      setState(() => _isFollowing = !_isFollowing);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(_isFollowing 
                              ? 'Now following ${widget.userName}' 
                              : 'Unfollowed ${widget.userName}'),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    ),
                    child: Text(_isFollowing ? 'Following' : 'Follow'),
                  ),
                ],
              ],
            ),
          ),
          
          // Recent posts preview
          if (_userPosts.isNotEmpty) ...[
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Recent Posts',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _userPosts.take(5).length,
                      itemBuilder: (context, index) {
                        final post = _userPosts[index];
                        return Container(
                          width: 80,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: post.images.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: _buildPostImage(post.images.first),
                                )
                              : const Center(
                                  child: Icon(Icons.article, size: 30),
                                ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    if (widget.userAvatar.isEmpty || widget.userAvatar.contains('unsplash')) {
      return CircleAvatar(
        radius: 30,
        backgroundColor: Colors.blue[100],
        child: Text(
          widget.userName[0].toUpperCase(),
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.blue[700],
          ),
        ),
      );
    }

    if (widget.userAvatar.startsWith('data:image/')) {
      try {
        final base64String = widget.userAvatar.split(',')[1];
        final bytes = base64.decode(base64String);
        return CircleAvatar(
          radius: 30,
          backgroundImage: MemoryImage(bytes),
        );
      } catch (e) {
        return _buildFallbackAvatar();
      }
    }

    return CircleAvatar(
      radius: 30,
      backgroundImage: NetworkImage(widget.userAvatar),
      onBackgroundImageError: (error, stackTrace) => _buildFallbackAvatar(),
    );
  }

  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 30,
      backgroundColor: Colors.blue[100],
      child: Text(
        widget.userName[0].toUpperCase(),
        style: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: Colors.blue[700],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String count) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildPostImage(String imageUrl) {
    if (imageUrl.startsWith('data:image/')) {
      try {
        final base64String = imageUrl.split(',')[1];
        final bytes = base64.decode(base64String);
        return Image.memory(bytes, fit: BoxFit.cover);
      } catch (e) {
        return const Icon(Icons.image, size: 30);
      }
    }

    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) => const Icon(Icons.image, size: 30),
    );
  }
}