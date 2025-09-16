import 'travel_enums.dart';

class CommunityPost {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final String content;
  final List<String> images;
  final String location;
  final DateTime createdAt;
  final int likesCount;
  final int commentsCount;
  final bool isLiked;
  final PostType postType;
  final List<String> hashtags;
  final String? placeId;
  final String? tripId;
  final Map<String, dynamic>? metadata;
  final bool isSaved;
  final List<String>? mentionedUserIds;
  final double? rating; // For reviews
  final List<String> helpfulUserIds;

  CommunityPost({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.content,
    this.images = const [],
    required this.location,
    required this.createdAt,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLiked = false,
    this.postType = PostType.experience,
    this.hashtags = const [],
    this.placeId,
    this.tripId,
    this.metadata,
    this.isSaved = false,
    this.mentionedUserIds,
    this.rating,
    this.helpfulUserIds = const [],
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      content: json['content'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      location: json['location'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      postType: PostType.fromString(json['postType'] ?? 'story'),
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'userName': userName,
      'userAvatar': userAvatar,
      'content': content,
      'images': images,
      'location': location,
      'createdAt': createdAt.toIso8601String(),
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'isLiked': isLiked,
      'postType': postType.name,
      'metadata': metadata,
    };
  }
}

class Comment {
  final String id;
  final String postId;
  final String userId;
  final String userName;
  final String userAvatar;
  final String content;
  final DateTime createdAt;

  Comment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.content,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? '',
      postId: json['postId'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      content: json['content'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'postId': postId,
      'userId': userId,
      'userName': userName,
      'userAvatar': userAvatar,
      'content': content,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}