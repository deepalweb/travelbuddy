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
    // Handle backend format
    final content = json['content'] ?? {};
    final author = json['author'] ?? {};
    final engagement = json['engagement'] ?? {};
    
    return CommunityPost(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: author['name'] ?? json['userName'] ?? 'User',
      userAvatar: author['avatar'] ?? json['userAvatar'] ?? '',
      content: content['text'] ?? json['content'] ?? '',
      images: List<String>.from(content['images'] ?? json['images'] ?? []),
      location: author['location'] ?? json['location'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      likesCount: engagement['likes'] ?? json['likesCount'] ?? 0,
      commentsCount: engagement['comments'] ?? json['commentsCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      postType: PostType.fromString(json['category'] ?? json['postType'] ?? 'story'),
      hashtags: List<String>.from(json['tags'] ?? json['hashtags'] ?? []),
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
      id: json['_id'] ?? json['id'] ?? '',
      postId: json['postId'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['username'] ?? json['userName'] ?? 'User',
      userAvatar: json['userAvatar'] ?? '',
      content: json['text'] ?? json['content'] ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
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