# Backend Integration Plan - TravelBuddy Mobile App

## Required Backend Endpoints

### 1. Community/Posts API (Priority: HIGH)

**File:** `backend/routes/posts.js` (already exists - needs enhancement)

#### Endpoints Needed:
```javascript
// Comments
POST   /api/posts/:postId/comments        - Add comment to post
GET    /api/posts/:postId/comments        - Get post comments
DELETE /api/posts/:postId/comments/:id    - Delete comment

// Likes
POST   /api/posts/:postId/like            - Toggle like on post
GET    /api/posts/:postId/likes           - Get post likes

// Share
POST   /api/posts/:postId/share           - Track share action
GET    /api/posts/:postId/share-link      - Generate shareable link

// Report
POST   /api/posts/:postId/report          - Report post
```

### 2. Notifications API (Priority: HIGH)

**File:** `backend/routes/notifications.js` (NEW)

#### Endpoints Needed:
```javascript
GET    /api/notifications                 - Get user notifications
POST   /api/notifications/:id/read        - Mark notification as read
DELETE /api/notifications/:id             - Delete notification
GET    /api/notifications/count           - Get unread count
```

#### MongoDB Schema:
```javascript
{
  userId: ObjectId,
  type: String, // 'like', 'comment', 'follow', 'mention'
  actorId: ObjectId,
  actorName: String,
  actorAvatar: String,
  postId: ObjectId,
  message: String,
  isRead: Boolean,
  createdAt: Date
}
```

### 3. User Profile Stats API (Priority: MEDIUM)

**File:** `backend/routes/users.js` (enhance existing)

#### Endpoints Needed:
```javascript
GET    /api/users/:userId/stats           - Get user stats (posts, followers, following)
GET    /api/users/:userId/posts           - Get user's posts
POST   /api/users/:userId/follow          - Follow user
DELETE /api/users/:userId/follow          - Unfollow user
GET    /api/users/:userId/followers       - Get followers list
GET    /api/users/:userId/following       - Get following list
```

### 4. Deal Claims API (Priority: MEDIUM)

**File:** `backend/routes/deals.js` (enhance existing)

#### Endpoints Needed:
```javascript
POST   /api/deals/:dealId/claim           - Claim deal (already exists - enhance)
GET    /api/deals/:dealId/claims          - Get claim history
GET    /api/users/:userId/claimed-deals   - Get user's claimed deals
```

#### Enhance Claim Endpoint:
- Generate unique redemption code
- Track claim timestamp
- Prevent duplicate claims
- Send notification to merchant

### 5. Social Links API (Priority: LOW)

**File:** `backend/routes/users.js` (enhance existing)

#### Endpoints Needed:
```javascript
PUT    /api/users/social-links            - Update social media links
GET    /api/users/:userId/social-links    - Get user's social links
```

## Mobile App Integration Changes

### 1. Community Provider Enhancement

**File:** `travel_buddy_mobile/lib/providers/community_provider.dart`

Add methods:
```dart
Future<void> addComment(String postId, String comment)
Future<List<Comment>> getComments(String postId)
Future<void> sharePost(String postId)
Future<void> reportPost(String postId, String reason)
```

### 2. Notifications Provider (NEW)

**File:** `travel_buddy_mobile/lib/providers/notifications_provider.dart`

```dart
class NotificationsProvider extends ChangeNotifier {
  List<Notification> _notifications = [];
  int _unreadCount = 0;
  
  Future<void> loadNotifications()
  Future<void> markAsRead(String notificationId)
  Future<void> deleteNotification(String notificationId)
  int get unreadCount => _unreadCount;
}
```

### 3. User Service Enhancement

**File:** `travel_buddy_mobile/lib/services/user_service.dart`

Add methods:
```dart
Future<UserStats> getUserStats(String userId)
Future<void> followUser(String userId)
Future<void> unfollowUser(String userId)
```

### 4. Deal Service Enhancement

**File:** `travel_buddy_mobile/lib/services/deal_service.dart`

Add methods:
```dart
Future<ClaimResponse> claimDeal(String dealId)
Future<List<ClaimedDeal>> getClaimedDeals()
```

## Implementation Priority

### Phase 1 (Critical - Week 1)
1. ✅ Notifications API + Provider
2. ✅ Comments API + Integration
3. ✅ User Stats API + Integration

### Phase 2 (Important - Week 2)
4. ✅ Deal Claims Enhancement
5. ✅ Share Functionality
6. ✅ Report System

### Phase 3 (Nice to Have - Week 3)
7. ✅ Social Links
8. ✅ Follow/Unfollow System
9. ✅ Advanced Analytics

## Quick Start Implementation

### Step 1: Create Notifications Backend

```bash
cd backend/routes
# Create notifications.js with endpoints
```

### Step 2: Update Mobile App

```bash
cd travel_buddy_mobile
# Create notifications_provider.dart
# Update community_screen_v2.dart to use real data
```

### Step 3: Test Integration

```bash
# Start backend
cd backend && npm start

# Run mobile app
cd travel_buddy_mobile && flutter run
```

## Estimated Effort

- **Backend Development**: 3-4 days
- **Mobile Integration**: 2-3 days
- **Testing**: 1-2 days
- **Total**: ~1.5 weeks

## Notes

- All endpoints should use Firebase Auth middleware
- Use MongoDB for data persistence
- Implement proper error handling
- Add rate limiting for API endpoints
- Cache frequently accessed data
- Use WebSocket for real-time notifications (optional)

## Current Status

- ❌ Notifications: Mock data
- ❌ Comments: UI only, no backend
- ❌ User Stats: Hardcoded values
- ❌ Deal Claims: Basic implementation, needs enhancement
- ❌ Share: UI only
- ❌ Report: UI only
- ❌ Social Links: Model exists, no backend

## Next Steps

1. Review this plan with team
2. Prioritize features based on business needs
3. Create backend endpoints (Phase 1)
4. Integrate with mobile app
5. Test thoroughly
6. Deploy to production

---

**Created:** $(date)
**Author:** Development Team
**Status:** Planning Phase
