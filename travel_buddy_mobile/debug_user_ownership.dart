// Debug script to check user ownership
// Run this in your app to see what's happening with user IDs

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'lib/providers/app_provider.dart';
import 'lib/providers/community_provider.dart';

void debugUserOwnership(BuildContext context) {
  final appProvider = Provider.of<AppProvider>(context, listen: false);
  final communityProvider = Provider.of<CommunityProvider>(context, listen: false);
  
  final currentUser = appProvider.currentUser;
  final posts = communityProvider.posts;
  
  print('🔍 DEBUG: User Ownership Check');
  print('================================');
  
  if (currentUser == null) {
    print('❌ No current user found!');
    return;
  }
  
  print('👤 Current User:');
  print('  - Username: ${currentUser.username}');
  print('  - UID: ${currentUser.uid}');
  print('  - MongoDB ID: ${currentUser.mongoId}');
  print('  - Email: ${currentUser.email}');
  
  print('\n📝 Posts Analysis:');
  print('  - Total posts: ${posts.length}');
  
  for (int i = 0; i < posts.length && i < 5; i++) {
    final post = posts[i];
    print('\n  Post ${i + 1}:');
    print('    - ID: ${post.id}');
    print('    - User ID: ${post.userId}');
    print('    - User Name: ${post.userName}');
    print('    - Created: ${post.createdAt}');
    
    // Check ownership
    final isOwnByMongoId = post.userId == currentUser.mongoId;
    final isOwnByUid = post.userId == currentUser.uid;
    final isOwnByUsername = post.userName == currentUser.username;
    
    print('    - Own by MongoDB ID: $isOwnByMongoId');
    print('    - Own by UID: $isOwnByUid');
    print('    - Own by Username: $isOwnByUsername');
    
    final isOwn = isOwnByMongoId || isOwnByUid || isOwnByUsername;
    print('    - IS OWN POST: $isOwn');
  }
  
  // Check if user has any posts
  final userPosts = posts.where((post) => 
    post.userId == currentUser.mongoId || 
    post.userId == currentUser.uid ||
    post.userName == currentUser.username
  ).toList();
  
  print('\n📊 Summary:');
  print('  - User has ${userPosts.length} posts');
  print('  - Should see delete button on ${userPosts.length} posts');
  
  if (userPosts.isEmpty) {
    print('\n💡 Suggestion: Create a post first to test delete functionality');
  }
}