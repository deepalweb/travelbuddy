// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'post.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Post _$PostFromJson(Map<String, dynamic> json) => Post(
      id: json['id'] as String,
      userId: json['userId'] as String,
      content: PostContent.fromJson(json['content'] as Map<String, dynamic>),
      author: PostAuthor.fromJson(json['author'] as Map<String, dynamic>),
      engagement:
          PostEngagement.fromJson(json['engagement'] as Map<String, dynamic>),
      likedBy:
          (json['likedBy'] as List<dynamic>).map((e) => e as String).toList(),
      commentsList: (json['commentsList'] as List<dynamic>)
          .map((e) => PostComment.fromJson(e as Map<String, dynamic>))
          .toList(),
      tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),
      category: json['category'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$PostToJson(Post instance) => <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'content': instance.content,
      'author': instance.author,
      'engagement': instance.engagement,
      'likedBy': instance.likedBy,
      'commentsList': instance.commentsList,
      'tags': instance.tags,
      'category': instance.category,
      'createdAt': instance.createdAt.toIso8601String(),
    };

PostContent _$PostContentFromJson(Map<String, dynamic> json) => PostContent(
      text: json['text'] as String?,
      images:
          (json['images'] as List<dynamic>).map((e) => e as String).toList(),
    );

Map<String, dynamic> _$PostContentToJson(PostContent instance) =>
    <String, dynamic>{
      'text': instance.text,
      'images': instance.images,
    };

PostAuthor _$PostAuthorFromJson(Map<String, dynamic> json) => PostAuthor(
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
      location: json['location'] as String?,
      verified: json['verified'] as bool,
    );

Map<String, dynamic> _$PostAuthorToJson(PostAuthor instance) =>
    <String, dynamic>{
      'name': instance.name,
      'avatar': instance.avatar,
      'location': instance.location,
      'verified': instance.verified,
    };

PostEngagement _$PostEngagementFromJson(Map<String, dynamic> json) =>
    PostEngagement(
      likes: (json['likes'] as num).toInt(),
      comments: (json['comments'] as num).toInt(),
      shares: (json['shares'] as num).toInt(),
    );

Map<String, dynamic> _$PostEngagementToJson(PostEngagement instance) =>
    <String, dynamic>{
      'likes': instance.likes,
      'comments': instance.comments,
      'shares': instance.shares,
    };

PostComment _$PostCommentFromJson(Map<String, dynamic> json) => PostComment(
      id: json['id'] as String,
      userId: json['userId'] as String?,
      username: json['username'] as String?,
      text: json['text'] as String,
      likes: (json['likes'] as num).toInt(),
      likedBy:
          (json['likedBy'] as List<dynamic>).map((e) => e as String).toList(),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$PostCommentToJson(PostComment instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'username': instance.username,
      'text': instance.text,
      'likes': instance.likes,
      'likedBy': instance.likedBy,
      'createdAt': instance.createdAt.toIso8601String(),
    };
