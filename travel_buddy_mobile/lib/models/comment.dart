class Comment {
  final String id;
  final String postId;
  final String userId;
  final String userName;
  final String userAvatar;
  final String content;
  final DateTime createdAt;
  final int likesCount;
  final bool isLiked;
  final List<Comment> replies;

  Comment({
    required this.id,
    required this.postId,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.content,
    required this.createdAt,
    this.likesCount = 0,
    this.isLiked = false,
    this.replies = const [],
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
      likesCount: json['likesCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
      replies: (json['replies'] as List<dynamic>?)
          ?.map((replyJson) => Comment.fromJson(replyJson))
          .toList() ??
          [],
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
      'likesCount': likesCount,
      'isLiked': isLiked,
      'replies': replies.map((reply) => reply.toJson()).toList(),
    };
  }
}
