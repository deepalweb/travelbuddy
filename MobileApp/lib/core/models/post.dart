import 'package:json_annotation/json_annotation.dart';

part 'post.g.dart';

@JsonSerializable()
class Post {
  final String id;
  final String userId;
  final PostContent content;
  final PostAuthor author;
  final PostEngagement engagement;
  final List<String> likedBy;
  final List<PostComment> commentsList;
  final List<String> tags;
  final String? category;
  final DateTime createdAt;

  Post({
    required this.id,
    required this.userId,
    required this.content,
    required this.author,
    required this.engagement,
    required this.likedBy,
    required this.commentsList,
    required this.tags,
    this.category,
    required this.createdAt,
  });

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
  Map<String, dynamic> toJson() => _$PostToJson(this);
}

@JsonSerializable()
class PostContent {
  final String? text;
  final List<String> images;

  PostContent({this.text, required this.images});

  factory PostContent.fromJson(Map<String, dynamic> json) => _$PostContentFromJson(json);
  Map<String, dynamic> toJson() => _$PostContentToJson(this);
}

@JsonSerializable()
class PostAuthor {
  final String name;
  final String? avatar;
  final String? location;
  final bool verified;

  PostAuthor({
    required this.name,
    this.avatar,
    this.location,
    required this.verified,
  });

  factory PostAuthor.fromJson(Map<String, dynamic> json) => _$PostAuthorFromJson(json);
  Map<String, dynamic> toJson() => _$PostAuthorToJson(this);
}

@JsonSerializable()
class PostEngagement {
  final int likes;
  final int comments;
  final int shares;

  PostEngagement({
    required this.likes,
    required this.comments,
    required this.shares,
  });

  factory PostEngagement.fromJson(Map<String, dynamic> json) => _$PostEngagementFromJson(json);
  Map<String, dynamic> toJson() => _$PostEngagementToJson(this);
}

@JsonSerializable()
class PostComment {
  final String id;
  final String? userId;
  final String? username;
  final String text;
  final int likes;
  final List<String> likedBy;
  final DateTime createdAt;

  PostComment({
    required this.id,
    this.userId,
    this.username,
    required this.text,
    required this.likes,
    required this.likedBy,
    required this.createdAt,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) => _$PostCommentFromJson(json);
  Map<String, dynamic> toJson() => _$PostCommentToJson(this);
}