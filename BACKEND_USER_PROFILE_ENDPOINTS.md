# Backend User Profile Endpoints - Complete Reference

## 📋 Overview
All endpoints are available at `/api/users/*` and require authentication unless specified.

---

## 🔐 Authentication & User Management

### POST `/api/users/sync`
**Auth:** Bearer token required  
**Purpose:** Sync user from Firebase to MongoDB  
**Body:**
```json
{
  "email": "user@example.com",
  "username": "username"
}
```
**Returns:** Complete user object

---

## 👤 Profile Management

### GET `/api/users/profile`
**Auth:** requireAuth  
**Purpose:** Get current user's complete profile  
**Returns:** Full user document

### PUT `/api/users/profile`
**Auth:** requireAuth  
**Purpose:** Update profile information  
**Allowed Fields:** username, fullName, phone, bio, profilePicture, homeCity, socialLinks, travelPreferences  
**Body:**
```json
{
  "username": "newname",
  "fullName": "John Doe",
  "bio": "Travel enthusiast",
  "profilePicture": "base64_or_url"
}
```

### DELETE `/api/users/profile`
**Auth:** requireAuth  
**Purpose:** Delete user profile (soft delete)  
**Returns:** `{ success: true }`

---

## 📊 User Statistics

### GET `/api/users/:id/stats`
**Auth:** Bearer token required  
**Purpose:** Get comprehensive user statistics  
**Returns:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "profilePicture": "url",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "bio": "Travel lover",
  "homeCity": "New York",
  "totalTrips": 15,
  "totalFavorites": 42,
  "totalPosts": 28,
  "followersCount": 120,
  "followingCount": 85,
  "memberSince": "2024-01-01",
  "tier": "premium",
  "socialLinks": {},
  "travelPreferences": {}
}
```

---

## ❤️ Favorites Management

### GET `/api/users/favorites`
**Auth:** requireAuth  
**Purpose:** Get user's favorite places  
**Returns:** Array of place IDs

### POST `/api/users/favorites`
**Auth:** requireAuth  
**Purpose:** Add place to favorites  
**Body:** `{ "placeId": "place_123" }`

### DELETE `/api/users/favorites/:placeId`
**Auth:** requireAuth  
**Purpose:** Remove place from favorites

---

## 🗺️ Trip Plans

### GET `/api/users/trip-plans`
**Auth:** Bearer token required  
**Purpose:** Get all user's trip plans  
**Returns:** Array of trip plans (sorted by createdAt desc)

### POST `/api/users/trip-plans`
**Auth:** Bearer token required  
**Purpose:** Create new trip plan  
**Body:** Trip plan object

### GET `/api/users/trip-plans/:id`
**Auth:** Bearer token required  
**Purpose:** Get specific trip plan  
**Returns:** Single trip plan

### DELETE `/api/users/trip-plans/:id`
**Auth:** Bearer token required  
**Purpose:** Delete trip plan

---

## 🔒 Security Settings

### GET `/api/users/security`
**Auth:** requireAuth  
**Purpose:** Get security settings  
**Returns:**
```json
{
  "emailVerified": true,
  "phoneVerified": false,
  "twoFactorEnabled": false,
  "lastLogin": "2024-01-15",
  "loginHistory": []
}
```

### PUT `/api/users/security`
**Auth:** requireAuth  
**Purpose:** Update security settings  
**Body:** Security settings object

---

## 🔔 Privacy & Notifications

### PUT `/api/users/privacy`
**Auth:** requireAuth  
**Purpose:** Update privacy settings  
**Body:** Privacy settings object

### PUT `/api/users/notifications`
**Auth:** requireAuth  
**Purpose:** Update notification preferences  
**Body:** Notification preferences object

---

## 💳 Subscription Management

### PUT `/api/users/subscription`
**Auth:** requireAuth  
**Purpose:** Update subscription tier  
**Body:**
```json
{
  "tier": "premium",
  "status": "active",
  "trialEndDate": "2024-02-01",
  "subscriptionEndDate": "2025-01-01"
}
```

---

## 📈 Travel Statistics

### GET `/api/users/travel-stats`
**Auth:** requireAuth  
**Purpose:** Get travel statistics  
**Returns:**
```json
{
  "totalPlacesVisited": 42,
  "placesVisitedThisMonth": 5,
  "totalDistanceKm": 15420.5,
  "currentStreak": 7,
  "favoriteCategory": "Nature"
}
```

### PUT `/api/users/travel-stats`
**Auth:** requireAuth  
**Purpose:** Update travel statistics  
**Body:**
```json
{
  "totalDistanceKm": 15500,
  "currentStreak": 8,
  "favoriteCategory": "Adventure"
}
```

### POST `/api/users/visited-places`
**Auth:** requireAuth  
**Purpose:** Add visited place  
**Body:**
```json
{
  "placeId": "place_123",
  "visitedAt": "2024-01-15T10:30:00Z"
}
```

---

## 👥 Social Features

### GET `/api/users/followers`
**Auth:** requireAuth  
**Purpose:** Get followers list (with username & profilePicture)  
**Returns:** Array of user objects

### GET `/api/users/following`
**Auth:** requireAuth  
**Purpose:** Get following list (with username & profilePicture)  
**Returns:** Array of user objects

### GET `/api/users/followers/count`
**Auth:** requireAuth  
**Purpose:** Get followers count  
**Returns:** `{ count: 120 }`

### GET `/api/users/following/count`
**Auth:** requireAuth  
**Purpose:** Get following count  
**Returns:** `{ count: 85 }`

### POST `/api/users/follow/:userId`
**Auth:** requireAuth  
**Purpose:** Follow a user  
**Returns:** `{ success: true }`

### DELETE `/api/users/follow/:userId`
**Auth:** requireAuth  
**Purpose:** Unfollow a user  
**Returns:** `{ success: true }`

---

## 📝 Posts & Bookmarks

### GET `/api/users/posts/count`
**Auth:** requireAuth  
**Purpose:** Get user's post count  
**Returns:** `{ count: 28 }`

### GET `/api/users/bookmarked-posts`
**Auth:** requireAuth  
**Purpose:** Get bookmarked posts  
**Returns:** Array of post objects (sorted by createdAt desc)

### POST `/api/users/bookmark/:postId`
**Auth:** requireAuth  
**Purpose:** Bookmark a post  
**Returns:** `{ success: true }`

### DELETE `/api/users/bookmark/:postId`
**Auth:** requireAuth  
**Purpose:** Remove bookmark  
**Returns:** `{ success: true }`

---

## 🔗 Social Links

### GET `/api/users/social-links`
**Auth:** requireAuth  
**Purpose:** Get social media links  
**Returns:**
```json
{
  "instagram": "username",
  "linkedin": "profile-url",
  "tiktok": "username",
  "website": "https://example.com"
}
```

### PUT `/api/users/social-links`
**Auth:** requireAuth  
**Purpose:** Update social links  
**Body:** Social links object

---

## ⚙️ Travel Preferences

### GET `/api/users/preferences`
**Auth:** requireAuth  
**Purpose:** Get travel preferences  
**Returns:**
```json
{
  "budgetRange": "medium",
  "travelPace": "moderate",
  "interests": ["nature", "culture", "food"],
  "accessibility": ["wheelchair"]
}
```

### PUT `/api/users/preferences`
**Auth:** requireAuth  
**Purpose:** Update travel preferences  
**Body:** Preferences object

---

## 💾 Data Management

### GET `/api/users/export`
**Auth:** requireAuth  
**Purpose:** Export all user data  
**Returns:**
```json
{
  "profile": {},
  "trips": [],
  "posts": [],
  "exportedAt": "2024-01-15T10:30:00Z"
}
```

### DELETE `/api/users/account`
**Auth:** requireAuth  
**Purpose:** Delete account and all associated data  
**Deletes:** User profile, trip plans, posts  
**Returns:** `{ success: true }`

### POST `/api/users/password-reset`
**Auth:** requireAuth  
**Purpose:** Request password reset  
**Returns:** `{ success: true, message: "Password reset email sent. Check your inbox." }`

---

## 📊 Summary

### Total Endpoints: 35

**By Category:**
- Authentication & User Management: 1
- Profile Management: 3
- User Statistics: 1
- Favorites: 3
- Trip Plans: 4
- Security: 2
- Privacy & Notifications: 2
- Subscription: 1
- Travel Statistics: 3
- Social Features: 6
- Posts & Bookmarks: 4
- Social Links: 2
- Travel Preferences: 2
- Data Management: 3

**By HTTP Method:**
- GET: 17 endpoints
- POST: 7 endpoints
- PUT: 8 endpoints
- DELETE: 5 endpoints

---

## 🔑 Authentication Notes

- Most endpoints require `requireAuth` middleware
- Bearer token format: `Authorization: Bearer <firebase_token>`
- Demo tokens supported: `demo-token-*` maps to `demo-user-123`
- JWT tokens are decoded automatically
- Firebase tokens are verified as fallback

---

## 📱 Mobile App Integration

All endpoints are fully compatible with the mobile app. The mobile app uses:
- `ApiService().getUserStats()` → GET `/api/users/:id/stats`
- `ApiService().getFollowers()` → GET `/api/users/followers`
- `ApiService().getFollowing()` → GET `/api/users/following`
- `ApiService().getUserTravelStats()` → GET `/api/users/travel-stats`
- `ApiService().getBookmarkedPosts()` → GET `/api/users/bookmarked-posts`

---

## ✅ Recently Implemented (Latest Update)

All 21 new profile endpoints have been implemented and tested:
- ✅ Travel stats tracking
- ✅ Social follow/unfollow system
- ✅ Post bookmarking
- ✅ Social links management
- ✅ Travel preferences
- ✅ Data export & account deletion
- ✅ Profile data sync fix (username, email, profilePicture now included in stats)
