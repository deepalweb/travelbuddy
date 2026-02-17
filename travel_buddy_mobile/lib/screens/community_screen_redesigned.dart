import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/community_provider.dart';
import '../providers/app_provider.dart';
import '../widgets/modern_post_card.dart';
import 'create_post_screen.dart';

enum FeedFilter { nearMe, hotNow, myTrip, likeMe, safety, saved }

class CommunityScreenRedesigned extends StatefulWidget {
  const CommunityScreenRedesigned({super.key});

  @override
  State<CommunityScreenRedesigned> createState() => _CommunityScreenRedesignedState();
}

class _CommunityScreenRedesignedState extends State<CommunityScreenRedesigned> with TickerProviderStateMixin {
  FeedFilter _selectedFilter = FeedFilter.nearMe;
  final List<String> _trendingHashtags = ['TravelTips', 'Foodie', 'HiddenGems', 'SoloSafe', 'Budget', 'LocalSecret'];
  String? _selectedHashtag;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _isSearching = false;
  late AnimationController _fabAnimationController;
  late Animation<double> _fabScaleAnimation;
  bool _showLocationTooltip = false;
  
  @override
  void initState() {
    super.initState();
    _fabAnimationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _fabScaleAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _fabAnimationController, curve: Curves.easeInOut),
    );
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().loadPosts(refresh: true, context: context);
      _startFABAnimation();
    });
  }
  
  void _startFABAnimation() {
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) {
        _fabAnimationController.repeat(reverse: true);
        setState(() => _showLocationTooltip = true);
        Future.delayed(const Duration(seconds: 3), () {
          if (mounted) {
            _fabAnimationController.stop();
            _fabAnimationController.value = 0;
            setState(() => _showLocationTooltip = false);
          }
        });
      }
    });
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    _fabAnimationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: CustomScrollView(
        slivers: [
          _buildModernAppBar(),
          _buildLocationContext(),
          _buildFilterBar(),
          _buildHashtagCarousel(),
          _buildFeed(),
        ],
      ),
      floatingActionButton: _buildModernFAB(),
    );
  }

  Widget _buildModernAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: 64,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.white, const Color(0xFFF8F9FA).withOpacity(0.5)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                if (_isSearching)
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      autofocus: true,
                      decoration: const InputDecoration(
                        hintText: 'Search places...',
                        border: InputBorder.none,
                        hintStyle: TextStyle(color: Colors.grey),
                      ),
                      style: const TextStyle(fontSize: 16),
                      onChanged: (value) => setState(() => _searchQuery = value),
                    ),
                  )
                else ...[
                  const Text(
                    '🌍 COMMUNITY',
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: Color(0xFF212529), letterSpacing: 0.5),
                  ),
                  const Spacer(),
                ],
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined, size: 26),
                      onPressed: _showNotifications,
                    ),
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(_isSearching ? Icons.close : Icons.search, size: 26),
                  onPressed: () {
                    setState(() {
                      _isSearching = !_isSearching;
                      if (!_isSearching) {
                        _searchQuery = '';
                        _searchController.clear();
                      }
                    });
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLocationContext() {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            const Icon(Icons.location_on, size: 18, color: Color(0xFF4361EE)),
            const SizedBox(width: 6),
            const Text('Seminyak, Bali', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF212529))),
            const SizedBox(width: 16),
            const Text('🌤️', style: TextStyle(fontSize: 16)),
            const SizedBox(width: 4),
            const Text('28°C', style: TextStyle(fontSize: 14, color: Color(0xFF6C757D), fontWeight: FontWeight.w500)),
            const Spacer(),
            Text('7:30 PM', style: TextStyle(fontSize: 13, color: Colors.grey[600], fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return SliverToBoxAdapter(
      child: Container(
        height: 56,
        color: Colors.white,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            _buildFilterChip('📍 Near Me', FeedFilter.nearMe),
            _buildFilterChip('🔥 Hot Now', FeedFilter.hotNow),
            _buildFilterChip('🗺️ My Trip', FeedFilter.myTrip),
            _buildFilterChip('👥 Like Me', FeedFilter.likeMe),
            _buildFilterChip('⚠️ Safety', FeedFilter.safety),
            _buildFilterChip('❤️ Saved', FeedFilter.saved),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, FeedFilter filter) {
    final isSelected = _selectedFilter == filter;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        onSelected: (selected) {
          setState(() => _selectedFilter = filter);
          _applyFilter();
        },
        backgroundColor: const Color(0xFFF8F9FA),
        selectedColor: const Color(0xFF4361EE),
        labelStyle: TextStyle(color: isSelected ? Colors.white : const Color(0xFF212529)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      ),
    );
  }

  Widget _buildHashtagCarousel() {
    return SliverToBoxAdapter(
      child: Container(
        height: 48,
        color: Colors.white,
        margin: const EdgeInsets.only(bottom: 8),
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          itemCount: _trendingHashtags.length,
          itemBuilder: (context, index) {
            final isSelected = _selectedHashtag == _trendingHashtags[index];
            final isTrending = index == 1; // Foodie is trending
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ActionChip(
                label: Text('#${_trendingHashtags[index]}'),
                onPressed: () {
                  setState(() {
                    _selectedHashtag = isSelected ? null : _trendingHashtags[index];
                  });
                  _applyFilter();
                },
                backgroundColor: isSelected || isTrending ? const Color(0xFF4361EE) : Colors.white,
                labelStyle: TextStyle(
                  color: isSelected || isTrending ? Colors.white : const Color(0xFF4361EE),
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
                side: BorderSide(color: const Color(0xFF4361EE).withOpacity(0.3)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildFeed() {
    return Consumer<CommunityProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.posts.isEmpty) {
          return const SliverFillRemaining(child: Center(child: CircularProgressIndicator()));
        }

        final posts = _searchQuery.isEmpty 
            ? provider.posts 
            : provider.posts.where((post) {
                final content = post.content.toLowerCase();
                final location = post.location.toLowerCase();
                final username = post.userName.toLowerCase();
                final query = _searchQuery.toLowerCase();
                return content.contains(query) || location.contains(query) || username.contains(query);
              }).toList();

        if (posts.isEmpty) {
          return SliverFillRemaining(child: _buildEmptyState());
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              if (index >= posts.length) {
                if (provider.hasMorePosts && _searchQuery.isEmpty) {
                  provider.loadPosts(context: context);
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                return const SizedBox.shrink();
              }
              
              final currentUser = context.read<AppProvider>().currentUser;
              final currentUserId = currentUser?.mongoId ?? currentUser?.uid;
              
              return ModernPostCard(
                post: posts[index],
                isHero: index == 0,
                onLike: () => _handleLike(posts[index]),
                onComment: () => _handleComment(posts[index]),
                onShare: () => _handleShare(posts[index]),
                onUserTap: () => _showUserProfile(posts[index].userId),
                onReport: () => _reportPost(posts[index]),
                onDelete: () => _handleDelete(posts[index]),
                onEdit: () => _handleEdit(posts[index]),
                currentUserId: currentUserId,
              );
            },
            childCount: posts.length + (provider.hasMorePosts && _searchQuery.isEmpty ? 1 : 0),
          ),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🌴', style: TextStyle(fontSize: 80)),
            const SizedBox(height: 24),
            const Text(
              'Discover Places Near You',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF212529)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'No places to show yet. Start by\nreviewing your first location!',
              style: TextStyle(color: Colors.grey[600], fontSize: 16, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4361EE), Color(0xFF2EC4B6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4361EE).withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const CreatePostScreen())),
                icon: const Icon(Icons.location_on, size: 22),
                label: const Text('📸 Review Warung Mak Beng', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FA),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE9ECEF)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on, size: 14, color: Color(0xFF6C757D)),
                  const SizedBox(width: 4),
                  Text('500m away', style: TextStyle(fontSize: 13, color: Colors.grey[700], fontWeight: FontWeight.w500)),
                  const SizedBox(width: 8),
                  const Text('•', style: TextStyle(color: Color(0xFF6C757D))),
                  const SizedBox(width: 8),
                  const Icon(Icons.star, size: 14, color: Color(0xFFFFD700)),
                  const SizedBox(width: 4),
                  Text('4.8', style: TextStyle(fontSize: 13, color: Colors.grey[700], fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernFAB() {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        ScaleTransition(
          scale: _fabScaleAnimation,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(
                colors: [Color(0xFF4361EE), Color(0xFF2EC4B6)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4361EE).withOpacity(0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: FloatingActionButton.extended(
              onPressed: () {
                _fabAnimationController.stop();
                setState(() => _showLocationTooltip = false);
                Navigator.push(context, MaterialPageRoute(builder: (context) => const CreatePostScreen()));
              },
              icon: const Icon(Icons.add, size: 24),
              label: const Text('Review Place', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              backgroundColor: Colors.transparent,
              elevation: 0,
            ),
          ),
        ),
        if (_showLocationTooltip)
          Positioned(
            bottom: 70,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF212529),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 12, offset: const Offset(0, 4)),
                ],
              ),
              child: const Text(
                'Share your experience!',
                style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ),
      ],
    );
  }
  
  void _applyFilter() {
    String? filterParam;
    switch (_selectedFilter) {
      case FeedFilter.hotNow:
        filterParam = 'popular';
        break;
      case FeedFilter.nearMe:
        filterParam = 'nearby';
        break;
      default:
        filterParam = null;
    }
    
    context.read<CommunityProvider>().loadPosts(
      refresh: true,
      context: context,
      filter: filterParam,
      hashtag: _selectedHashtag,
    );
  }

  void _handleLike(dynamic post) {
    context.read<CommunityProvider>().toggleLike(post.id);
  }
  
  void _handleComment(dynamic post) async {
    final commentController = TextEditingController();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Add Comment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: commentController,
                decoration: const InputDecoration(hintText: 'Write a comment...', border: OutlineInputBorder()),
                maxLines: 3,
                autofocus: true,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final text = commentController.text.trim();
                  if (text.isEmpty) return;
                  
                  Navigator.pop(context);
                  
                  try {
                    final currentUser = context.read<AppProvider>().currentUser;
                    final success = await context.read<CommunityProvider>().addComment(
                      postId: post.id,
                      content: text,
                      userId: currentUser?.mongoId ?? currentUser?.uid,
                      username: currentUser?.username ?? 'User',
                    );
                    
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(success ? 'Comment posted!' : 'Failed to post comment')),
                      );
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                },
                child: const Text('Post Comment'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  void _handleShare(dynamic post) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Share Post', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.copy, color: Color(0xFF4361EE)),
              title: const Text('Copy Link'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied to clipboard')));
              },
            ),
            ListTile(
              leading: const Icon(Icons.share, color: Color(0xFF2EC4B6)),
              title: const Text('Share to...'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Opening share menu...')));
              },
            ),
          ],
        ),
      ),
    );
  }
  
  void _showUserProfile(String? userId) {
    if (userId == null) return;
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('User Profile'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(radius: 40, child: Icon(Icons.person, size: 40)),
            const SizedBox(height: 16),
            Text('User ID: $userId', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Travel Enthusiast'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Column(children: [const Text('125', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Posts', style: TextStyle(fontSize: 12))]),
                Column(children: [const Text('1.2K', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Followers', style: TextStyle(fontSize: 12))]),
                Column(children: [const Text('340', style: TextStyle(fontWeight: FontWeight.bold)), const Text('Following', style: TextStyle(fontSize: 12))]),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
          ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Follow')),
        ],
      ),
    );
  }
  
  void _reportPost(dynamic post) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Report Post'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Why are you reporting this post?'),
            const SizedBox(height: 16),
            ListTile(title: const Text('Spam'), onTap: () => _submitReport('Spam')),
            ListTile(title: const Text('Inappropriate Content'), onTap: () => _submitReport('Inappropriate')),
            ListTile(title: const Text('Harassment'), onTap: () => _submitReport('Harassment')),
            ListTile(title: const Text('False Information'), onTap: () => _submitReport('False Info')),
          ],
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel'))],
      ),
    );
  }
  
  void _submitReport(String reason) {
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Post reported for: $reason. Thank you for keeping our community safe.')),
    );
  }
  
  void _handleEdit(dynamic post) async {
    final contentController = TextEditingController(text: post.content);
    final locationController = TextEditingController(text: post.location);
    
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Post'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: contentController, decoration: const InputDecoration(labelText: 'Content', border: OutlineInputBorder()), maxLines: 4),
              const SizedBox(height: 16),
              TextField(controller: locationController, decoration: const InputDecoration(labelText: 'Location', border: OutlineInputBorder(), prefixIcon: Icon(Icons.location_on))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
        ],
      ),
    );
    
    if (result == true) {
      try {
        final success = await context.read<CommunityProvider>().editPost(
          postId: post.id,
          content: contentController.text.trim(),
          location: locationController.text.trim(),
          images: post.images,
          hashtags: post.hashtags,
        );
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(success ? 'Post updated successfully' : 'Failed to update post')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }
  
  void _handleDelete(dynamic post) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this post? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      try {
        await context.read<CommunityProvider>().deletePost(post.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Post deleted successfully')));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete post: $e')));
        }
      }
    }
  }
  
  void _showNotifications() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.favorite, color: Colors.red)),
              title: const Text('John liked your post'),
              subtitle: const Text('2 hours ago'),
            ),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.comment, color: Colors.blue)),
              title: const Text('Sarah commented on your post'),
              subtitle: const Text('5 hours ago'),
            ),
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person_add, color: Colors.green)),
              title: const Text('Mike started following you'),
              subtitle: const Text('1 day ago'),
            ),
          ],
        ),
      ),
    );
  }
}
