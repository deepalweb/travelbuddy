import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/community_post.dart';
import '../providers/community_provider.dart';
import '../widgets/comment_list.dart';
import 'package:timeago/timeago.dart' as timeago;

class PostDetailView extends StatelessWidget {
  final CommunityPost post;

  const PostDetailView({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeader(context),
        if (post.images.isNotEmpty) _buildImageGallery(context),
        _buildContent(context),
        _buildActions(context),
        _buildComments(context),
      ],
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundImage: NetworkImage(post.userAvatar),
            radius: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.userName,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                Text(
                  post.location,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Text(
            timeago.format(post.createdAt),
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageGallery(BuildContext context) {
    return SizedBox(
      height: 300,
      child: PageView.builder(
        itemCount: post.images.length,
        itemBuilder: (context, index) {
          return Image.network(
            post.images[index],
            fit: BoxFit.cover,
          );
        },
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            post.content,
            style: const TextStyle(fontSize: 16),
          ),
          if (post.hashtags.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Wrap(
                spacing: 4,
                children: post.hashtags.map((tag) {
                  return Text(
                    '#$tag',
                    style: const TextStyle(
                      color: Colors.blue,
                      fontSize: 14,
                    ),
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Consumer<CommunityProvider>(
            builder: (context, provider, child) {
              return IconButton(
                icon: Icon(
                  post.isLiked ? Icons.favorite : Icons.favorite_border,
                  color: post.isLiked ? Colors.red : null,
                ),
                onPressed: () {
                  provider.toggleLike(post.id);
                },
              );
            },
          ),
          Text(
            '${post.likesCount}',
            style: const TextStyle(fontSize: 14),
          ),
          const SizedBox(width: 16),
          IconButton(
            icon: const Icon(Icons.comment_outlined),
            onPressed: () {
              // TODO: Focus comment input
            },
          ),
          Text(
            '${post.commentsCount}',
            style: const TextStyle(fontSize: 14),
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              post.isSaved ? Icons.bookmark : Icons.bookmark_border,
            ),
            onPressed: () {
              // TODO: Implement save functionality
            },
          ),
        ],
      ),
    );
  }

  Widget _buildComments(BuildContext context) {
    return CommentList(postId: post.id);
  }
}
