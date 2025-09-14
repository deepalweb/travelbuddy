import 'package:flutter/material.dart';

import '../../../shared/services/social_service.dart';
import '../../../core/models/post.dart';

class SocialScreen extends StatefulWidget {
  const SocialScreen({super.key});

  @override
  State<SocialScreen> createState() => _SocialScreenState();
}

class _SocialScreenState extends State<SocialScreen> {
  final SocialService _socialService = SocialService();
  List<Post> _posts = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Social'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showCreatePostDialog,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _posts.isEmpty
                ? const Center(child: Text('No posts yet'))
                : ListView.builder(
                    itemCount: _posts.length,
                    itemBuilder: (context, index) {
                      final post = _posts[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  CircleAvatar(
                                    backgroundImage: post.author.avatar != null
                                        ? NetworkImage(post.author.avatar!)
                                        : null,
                                    child: post.author.avatar == null
                                        ? Text(post.author.name.substring(0, 1))
                                        : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              post.author.name,
                                              style: const TextStyle(fontWeight: FontWeight.bold),
                                            ),
                                            if (post.author.verified)
                                              const Icon(
                                                Icons.verified,
                                                color: Colors.blue,
                                                size: 16,
                                              ),
                                          ],
                                        ),
                                        if (post.author.location != null)
                                          Text(
                                            post.author.location!,
                                            style: Theme.of(context).textTheme.bodySmall,
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              if (post.content.text != null)
                                Text(post.content.text!),
                              if (post.content.images.isNotEmpty)
                                Container(
                                  margin: const EdgeInsets.only(top: 8),
                                  height: 200,
                                  child: ListView.builder(
                                    scrollDirection: Axis.horizontal,
                                    itemCount: post.content.images.length,
                                    itemBuilder: (context, imageIndex) {
                                      return Container(
                                        margin: const EdgeInsets.only(right: 8),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(8),
                                          child: Image.network(
                                            post.content.images[imageIndex],
                                            width: 200,
                                            height: 200,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.favorite_border),
                                    onPressed: () => _likePost(post.id),
                                  ),
                                  Text('${post.engagement.likes}'),
                                  const SizedBox(width: 16),
                                  IconButton(
                                    icon: const Icon(Icons.comment_outlined),
                                    onPressed: () => _showCommentsDialog(post),
                                  ),
                                  Text('${post.engagement.comments}'),
                                  const SizedBox(width: 16),
                                  IconButton(
                                    icon: const Icon(Icons.share_outlined),
                                    onPressed: () => _sharePost(post.id),
                                  ),
                                  Text('${post.engagement.shares}'),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
      ),
    );
  }

  Future<void> _loadPosts() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final posts = await _socialService.getPosts();
      setState(() {
        _posts = posts;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading posts: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showCreatePostDialog() {
    final textController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create Post'),
        content: TextField(
          controller: textController,
          decoration: const InputDecoration(
            hintText: 'What\'s on your mind?',
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (textController.text.isNotEmpty) {
                _createPost(textController.text);
                Navigator.of(context).pop();
              }
            },
            child: const Text('Post'),
          ),
        ],
      ),
    );
  }

  void _showCommentsDialog(Post post) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Comments'),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: ListView.builder(
            itemCount: post.commentsList.length,
            itemBuilder: (context, index) {
              final comment = post.commentsList[index];
              return ListTile(
                title: Text(comment.username ?? 'Anonymous'),
                subtitle: Text(comment.text),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.favorite_border, size: 16),
                    Text('${comment.likes}'),
                  ],
                ),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Future<void> _createPost(String text) async {
    try {
      await _socialService.createPost(text);
      await _loadPosts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating post: $e')),
        );
      }
    }
  }

  Future<void> _likePost(String postId) async {
    try {
      await _socialService.likePost(postId);
      await _loadPosts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error liking post: $e')),
        );
      }
    }
  }

  Future<void> _sharePost(String postId) async {
    // Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share functionality coming soon')),
    );
  }
}