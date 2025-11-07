import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/community_provider.dart';
import '../models/community_post.dart';
import '../models/travel_style.dart';
import '../widgets/instagram_post_card.dart';
import 'chat_screen.dart';
import 'edit_profile_screen.dart';

class UserProfileScreen extends StatefulWidget {
  final String userId;
  final String userName;

  const UserProfileScreen({
    super.key,
    required this.userId,
    required this.userName,
  });

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isFollowing = false;
  bool _isLoading = false;
  List<CommunityPost> _userPosts = [];
  Map<String, dynamic> _userStats = {
    'posts': 0,
    'followers': 0,
    'following': 0,
    'places': 0,
  };
  String _userAvatar = '';
  String _userBio = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadUserData();
  }
  
  Future<void> _loadUserData() async {
    final provider = context.read<CommunityProvider>();
    final appProvider = context.read<AppProvider>();
    final currentUser = appProvider.currentUser;
    final isOwnProfile = currentUser?.uid == widget.userId || currentUser?.mongoId == widget.userId;
    
    // Get user's posts
    _userPosts = provider.posts.where((post) => 
      post.userId == widget.userId || 
      (isOwnProfile && (post.userId == currentUser?.mongoId || post.userId == currentUser?.uid))
    ).toList();
    
    if (isOwnProfile && currentUser != null) {
      // Import data from main profile
      _userAvatar = currentUser.profilePicture ?? '';
      _userBio = currentUser.status?.isNotEmpty == true 
          ? '${currentUser.status} • ${currentUser.tier.name.toUpperCase()} Member'
          : '${currentUser.tier.name.toUpperCase()} Member • 🌍 Explorer';
      
      // Get real stats from backend
      _userStats = {
        'posts': _userPosts.length,
        'followers': 0,
        'following': 0,
        'places': appProvider.favoritePlaces.length,
      };
    } else {
      // Other user's profile
      if (_userPosts.isNotEmpty) {
        _userAvatar = _userPosts.first.userAvatar;
      }
      _userBio = 'Fellow Traveler • ✈️ Adventure Seeker';
      _userStats = {
        'posts': _userPosts.length,
        'followers': 156 + (_userPosts.length * 12),
        'following': 89 + (_userPosts.length * 3),
        'places': _userPosts.map((p) => p.location).toSet().length,
      };
    }
    
    setState(() {});
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refreshProfile,
        child: NestedScrollView(
          headerSliverBuilder: (context, innerBoxIsScrolled) => [
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              backgroundColor: Colors.blue[600],
              foregroundColor: Colors.white,
              flexibleSpace: FlexibleSpaceBar(
                background: _buildProfileHeader(),
              ),
              actions: [
                if (context.read<AppProvider>().currentUser?.uid == widget.userId)
                  IconButton(
                    icon: const Icon(Icons.settings),
                    onPressed: _editProfile,
                  ),
              ],
            ),
          ],
          body: Column(
            children: [
              _buildStatsRow(),
              _buildActionButtons(),
              _buildTabBar(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildPostsGrid(),
                    _buildPhotosGrid(),
                    _buildSavedGrid(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Future<void> _refreshProfile() async {
    print('🔄 [PROFILE] Refreshing profile data...');
    await _loadUserData();
  }

  Widget _buildProfileHeader() {
    print('🖼️ [PROFILE] Building header with avatar: $_userAvatar');
    final currentUser = context.read<AppProvider>().currentUser;
    final isOwnProfile = currentUser?.uid == widget.userId;
    
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _buildProfileAvatar(),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.userName,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 8),
              if (isOwnProfile && currentUser?.tier.name != 'free')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: currentUser?.tier.name == 'premium' 
                        ? Colors.yellow.withOpacity(0.2)
                        : Colors.blue.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        currentUser?.tier.name == 'premium' ? Icons.star : Icons.verified,
                        color: currentUser?.tier.name == 'premium' ? Colors.yellow : Colors.blue,
                        size: 16,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        currentUser!.tier.name.toUpperCase(),
                        style: TextStyle(
                          color: currentUser.tier.name == 'premium' ? Colors.yellow : Colors.blue,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            _userBio,
            style: TextStyle(
              fontSize: 16,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
          if (isOwnProfile && currentUser?.email != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                children: [
                  Text(
                    currentUser!.email!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.7),
                    ),
                  ),
                  if (currentUser.travelStyle != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            currentUser.travelStyle!.emoji,
                            style: const TextStyle(fontSize: 16),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            currentUser.travelStyle!.displayName,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.8),
                            ),
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

  Widget _buildStatsRow() {
    final totalLikes = _userPosts.fold<int>(0, (sum, post) => sum + post.likesCount);
    final totalComments = _userPosts.fold<int>(0, (sum, post) => sum + post.commentsCount);
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildStatItem('Posts', '${_userStats['posts']}'),
              _buildStatItem('Followers', _formatCount(_userStats['followers'])),
              _buildStatItem('Following', '${_userStats['following']}'),
              _buildStatItem('Places', '${_userStats['places']}'),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildStatItem('Likes', '$totalLikes'),
              _buildStatItem('Comments', '$totalComments'),
              _buildStatItem('Photos', '${_userPosts.where((p) => p.images.isNotEmpty).length}'),
              _buildStatItem('Saved', '${context.read<CommunityProvider>().posts.where((p) => p.isSaved).length}'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String count) {
    return Column(
      children: [
        Text(
          count,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        Text(
          label,
          style: TextStyle(color: Colors.grey[600], fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    final currentUser = context.read<AppProvider>().currentUser;
    final isOwnProfile = currentUser?.uid == widget.userId;
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: isOwnProfile ? _editProfile : _toggleFollow,
              style: ElevatedButton.styleFrom(
                backgroundColor: isOwnProfile 
                    ? Colors.grey[200] 
                    : (_isFollowing ? Colors.grey[300] : Colors.blue[600]),
                foregroundColor: isOwnProfile 
                    ? Colors.black 
                    : (_isFollowing ? Colors.black : Colors.white),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(isOwnProfile 
                      ? 'Edit Profile' 
                      : (_isFollowing ? 'Following' : 'Follow')),
            ),
          ),
          if (!isOwnProfile) ...[
            const SizedBox(width: 12),
            OutlinedButton(
              onPressed: () => _openChat(),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
              ),
              child: const Text('Message'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.grey[300]!)),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: Colors.blue[600],
        unselectedLabelColor: Colors.grey[600],
        indicatorColor: Colors.blue[600],
        tabs: [
          Tab(icon: const Icon(Icons.grid_on), text: 'Posts (${_userPosts.length})'),
          Tab(icon: const Icon(Icons.photo_library), text: 'Photos (${_userPosts.where((p) => p.images.isNotEmpty).length})'),
          Tab(icon: const Icon(Icons.bookmark), text: 'Saved'),
        ],
      ),
    );
  }

  Widget _buildPostsGrid() {
    if (_userPosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_library_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No posts yet',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: _userPosts.length,
      itemBuilder: (context, index) {
        final post = _userPosts[index];
        return GestureDetector(
          onTap: () => _showPostDetail(post),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(8),
            ),
            child: post.images.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(
                      base64.decode(post.images.first.split(',')[1]),
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(Icons.photo, size: 40);
                      },
                    ),
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.article, size: 30),
                      const SizedBox(height: 4),
                      Text(
                        post.content.length > 20 
                            ? '${post.content.substring(0, 20)}...'
                            : post.content,
                        style: const TextStyle(fontSize: 12),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
          ),
        );
      },
    );
  }

  Widget _buildPhotosGrid() {
    // Get posts with images only
    final postsWithImages = _userPosts.where((post) => post.images.isNotEmpty).toList();
    
    if (postsWithImages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.photo_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No photos yet',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: postsWithImages.length,
      itemBuilder: (context, index) {
        final post = postsWithImages[index];
        return GestureDetector(
          onTap: () => _showPostDetail(post),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Image.memory(
              base64.decode(post.images.first.split(',')[1]),
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  color: Colors.grey[300],
                  child: const Icon(Icons.photo, size: 30),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildSavedGrid() {
    // Get saved posts from community provider
    final provider = context.read<CommunityProvider>();
    final savedPosts = provider.posts.where((post) => post.isSaved).toList();
    
    if (savedPosts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bookmark_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No saved posts',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the bookmark icon on posts to save them',
              style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: savedPosts.length,
      itemBuilder: (context, index) {
        final post = savedPosts[index];
        return GestureDetector(
          onTap: () => _showPostDetail(post),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Stack(
              children: [
                if (post.images.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.memory(
                      base64.decode(post.images.first.split(',')[1]),
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                      errorBuilder: (context, error, stackTrace) {
                        return const Center(child: Icon(Icons.photo, size: 40));
                      },
                    ),
                  )
                else
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.article, size: 30),
                        const SizedBox(height: 4),
                        Text(
                          post.content.length > 15
                              ? '${post.content.substring(0, 15)}...'
                              : post.content,
                          style: const TextStyle(fontSize: 10),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.bookmark,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _toggleFollow() async {
    setState(() => _isLoading = true);
    
    // Simulate API call
    await Future.delayed(const Duration(seconds: 1));
    
    setState(() {
      _isFollowing = !_isFollowing;
      _isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_isFollowing ? 'Now following ${widget.userName}' : 'Unfollowed ${widget.userName}'),
      ),
    );
  }
  
  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
  
  void _showPostDetail(CommunityPost post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: InstagramPostCard(post: post),
        ),
      ),
    );
  }
  
  void _openChat() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          userId: widget.userId,
          userName: widget.userName,
        ),
      ),
    );
  }
  
  void _editProfile() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const EditProfileScreen(),
      ),
    ).then((_) {
      // Refresh profile after editing
      _refreshProfile();
    });
  }
  
  Widget _buildProfileAvatar() {
    if (_userAvatar.isEmpty || _userAvatar.contains('unsplash')) {
      // Show initial letter
      return CircleAvatar(
        radius: 50,
        backgroundColor: Colors.white,
        child: Text(
          widget.userName[0].toUpperCase(),
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.blue,
          ),
        ),
      );
    }
    
    // Handle base64 images
    if (_userAvatar.startsWith('data:image/')) {
      try {
        final base64String = _userAvatar.split(',')[1];
        final bytes = base64.decode(base64String);
        return CircleAvatar(
          radius: 50,
          backgroundColor: Colors.white,
          backgroundImage: MemoryImage(bytes),
        );
      } catch (e) {
        print('❌ [PROFILE] Base64 decode error: $e');
        return _buildFallbackAvatar();
      }
    }
    
    // Handle network images
    return CircleAvatar(
      radius: 50,
      backgroundColor: Colors.white,
      backgroundImage: NetworkImage(_userAvatar),
      onBackgroundImageError: (error, stackTrace) {
        print('❌ [PROFILE] Network image error: $error');
      },
    );
  }
  
  Widget _buildFallbackAvatar() {
    return CircleAvatar(
      radius: 50,
      backgroundColor: Colors.white,
      child: Text(
        widget.userName[0].toUpperCase(),
        style: const TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.blue,
        ),
      ),
    );
  }
  

}