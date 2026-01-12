import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/community_post.dart';
import '../models/trip.dart';
import '../models/place.dart';
import '../models/user.dart';
import '../models/travel_enums.dart';

class OfflineManager {
  static const String _keyPosts = 'offline_posts';
  static const String _keyTrips = 'offline_trips';
  static const String _keyPlaces = 'offline_places';
  static const String _keyUser = 'offline_user';
  static const String _keyDeals = 'offline_deals';
  static const String _keyTimestamp = 'offline_timestamp_';
  static const int _maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours

  // Cache posts
  static Future<void> cachePosts(List<CommunityPost> posts) async {
    final prefs = await SharedPreferences.getInstance();
    final data = posts.map((p) => {
      'id': p.id,
      'userId': p.userId,
      'userName': p.userName,
      'userAvatar': p.userAvatar,
      'content': p.content,
      'images': p.images,
      'location': p.location,
      'createdAt': p.createdAt.toIso8601String(),
      'likesCount': p.likesCount,
      'commentsCount': p.commentsCount,
      'isLiked': p.isLiked,
      'postType': p.postType.name,
      'isSaved': p.isSaved,
    }).toList();
    
    await prefs.setString(_keyPosts, jsonEncode(data));
    await prefs.setInt('$_keyTimestamp$_keyPosts', DateTime.now().millisecondsSinceEpoch);
  }

  // Get cached posts
  static Future<List<CommunityPost>> getCachedPosts() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt('$_keyTimestamp$_keyPosts') ?? 0;
    
    if (DateTime.now().millisecondsSinceEpoch - timestamp > _maxCacheAge) {
      return [];
    }
    
    final data = prefs.getString(_keyPosts);
    if (data == null) return [];
    
    final List<dynamic> list = jsonDecode(data);
    return list.map((json) => CommunityPost(
      id: json['id'],
      userId: json['userId'],
      userName: json['userName'],
      userAvatar: json['userAvatar'],
      content: json['content'],
      images: List<String>.from(json['images'] ?? []),
      location: json['location'],
      createdAt: DateTime.parse(json['createdAt']),
      likesCount: json['likesCount'],
      commentsCount: json['commentsCount'],
      isLiked: json['isLiked'],
      postType: _parsePostType(json['postType']),
      isSaved: json['isSaved'] ?? false,
    )).toList();
  }

  // Cache trip plans
  static Future<void> cacheTripPlans(List<TripPlan> trips) async {
    final prefs = await SharedPreferences.getInstance();
    final data = trips.map((t) => t.toJson()).toList();
    await prefs.setString(_keyTrips, jsonEncode(data));
    await prefs.setInt('$_keyTimestamp$_keyTrips', DateTime.now().millisecondsSinceEpoch);
  }

  // Get cached trip plans
  static Future<List<TripPlan>> getCachedTripPlans() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyTrips);
    if (data == null) return [];
    
    final List<dynamic> list = jsonDecode(data);
    return list.map((json) => TripPlan.fromJson(json)).toList();
  }

  // Cache places
  static Future<void> cachePlaces(List<Place> places, {String category = 'all'}) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '${_keyPlaces}_$category';
    final data = places.map((p) => p.toJson()).toList();
    await prefs.setString(key, jsonEncode(data));
    await prefs.setInt('$_keyTimestamp$key', DateTime.now().millisecondsSinceEpoch);
  }

  // Get cached places
  static Future<List<Place>> getCachedPlaces({String category = 'all'}) async {
    final prefs = await SharedPreferences.getInstance();
    final key = '${_keyPlaces}_$category';
    final timestamp = prefs.getInt('$_keyTimestamp$key') ?? 0;
    
    if (DateTime.now().millisecondsSinceEpoch - timestamp > _maxCacheAge) {
      return [];
    }
    
    final data = prefs.getString(key);
    if (data == null) return [];
    
    final List<dynamic> list = jsonDecode(data);
    return list.map((json) => Place.fromJson(json)).toList();
  }

  // Cache user profile
  static Future<void> cacheUser(CurrentUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyUser, jsonEncode(user.toJson()));
    await prefs.setInt('$_keyTimestamp$_keyUser', DateTime.now().millisecondsSinceEpoch);
  }

  // Get cached user
  static Future<CurrentUser?> getCachedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_keyUser);
    if (data == null) return null;
    
    return CurrentUser.fromJson(jsonDecode(data));
  }

  // Cache deals
  static Future<void> cacheDeals(List<Deal> deals) async {
    final prefs = await SharedPreferences.getInstance();
    final data = deals.map((d) => {
      'id': d.id,
      'title': d.title,
      'description': d.description,
      'discount': d.discount,
      'placeName': d.placeName,
      'businessType': d.businessType,
      'businessName': d.businessName,
      'images': d.images,
      'validUntil': d.validUntil,
      'isActive': d.isActive,
      'views': d.views,
      'claims': d.claims,
      'merchantId': d.merchantId,
      'price': d.price,
      'isPremium': d.isPremium,
    }).toList();
    
    await prefs.setString(_keyDeals, jsonEncode(data));
    await prefs.setInt('$_keyTimestamp$_keyDeals', DateTime.now().millisecondsSinceEpoch);
  }

  // Get cached deals
  static Future<List<Deal>> getCachedDeals() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt('$_keyTimestamp$_keyDeals') ?? 0;
    
    if (DateTime.now().millisecondsSinceEpoch - timestamp > _maxCacheAge) {
      return [];
    }
    
    final data = prefs.getString(_keyDeals);
    if (data == null) return [];
    
    final List<dynamic> list = jsonDecode(data);
    return list.map((json) => Deal(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      discount: json['discount'],
      placeName: json['placeName'],
      businessType: json['businessType'],
      businessName: json['businessName'],
      images: List<String>.from(json['images'] ?? []),
      validUntil: json['validUntil'],
      isActive: json['isActive'],
      views: json['views'],
      claims: json['claims'],
      merchantId: json['merchantId'],
      price: json['price'],
      isPremium: json['isPremium'] ?? false,
    )).toList();
  }

  // Clear all cache
  static Future<void> clearCache() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPosts);
    await prefs.remove(_keyTrips);
    await prefs.remove(_keyUser);
    await prefs.remove(_keyDeals);
    
    // Clear all place caches
    final keys = prefs.getKeys();
    for (final key in keys) {
      if (key.startsWith(_keyPlaces) || key.startsWith(_keyTimestamp)) {
        await prefs.remove(key);
      }
    }
  }

  // Check if cache is fresh
  static Future<bool> isCacheFresh(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt('$_keyTimestamp$key') ?? 0;
    return DateTime.now().millisecondsSinceEpoch - timestamp < _maxCacheAge;
  }

  static PostType _parsePostType(String type) {
    switch (type.toLowerCase()) {
      case 'photo': return PostType.photo;
      case 'review': return PostType.review;
      case 'tip': return PostType.tip;
      case 'experience': return PostType.experience;
      case 'question': return PostType.question;
      case 'tripdiary': return PostType.tripDiary;
      default: return PostType.story;
    }
  }
}
