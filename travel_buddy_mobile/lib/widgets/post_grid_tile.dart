import 'package:flutter/material.dart';
import '../models/community_post.dart';
import '../models/travel_enums.dart';

class PostGridTile extends StatelessWidget {
  final CommunityPost post;

  const PostGridTile({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (post.images.isNotEmpty)
          Image.network(
            post.images.first,
            fit: BoxFit.cover,
          )
        else
          Container(
            color: Colors.grey[200],
            child: const Icon(Icons.article, color: Colors.grey),
          ),
        if (post.images.length > 1)
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(
                Icons.collections,
                color: Colors.white,
                size: 16,
              ),
            ),
          ),
        Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [
                  Colors.black.withOpacity(0.8),
                  Colors.transparent,
                ],
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTypeIcon(),
                const SizedBox(width: 4),
                if (post.likesCount > 0)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.favorite,
                        color: Colors.white,
                        size: 12,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        post.likesCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTypeIcon() {
    IconData icon;
    switch (post.postType) {
      case PostType.experience:
        icon = Icons.auto_stories;
        break;
      case PostType.tip:
        icon = Icons.lightbulb;
        break;
      case PostType.review:
        icon = Icons.star;
        break;
      case PostType.question:
        icon = Icons.help;
        break;
      case PostType.tripDiary:
        icon = Icons.book;
        break;
      case PostType.photo:
        icon = Icons.photo_camera;
        break;
      case PostType.story:
        icon = Icons.auto_stories;
        break;
    }
    return Icon(icon, color: Colors.white, size: 12);
  }
}
