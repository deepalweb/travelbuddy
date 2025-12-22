# Profile Page - Missing Features Implementation Plan

## Priority 1: Critical Stats (30 min)

### 1. Travel Stats API
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/travel-stats
router.get('/travel-stats', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({
    totalPlacesVisited: user.visitedPlaces?.length || 0,
    placesVisitedThisMonth: 0, // Calculate from visitedPlaces dates
    totalDistanceKm: user.totalDistanceKm || 0,
    currentStreak: user.travelStreak || 0,
    favoriteCategory: user.favoriteCategory || 'Exploring'
  });
});

// PUT /api/users/travel-stats
router.put('/travel-stats', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOneAndUpdate(
    { firebaseUid: req.user.uid },
    { $set: { 
      totalDistanceKm: req.body.totalDistanceKm,
      travelStreak: req.body.currentStreak,
      favoriteCategory: req.body.favoriteCategory
    }},
    { new: true }
  );
  res.json({ success: true });
});
```

**Database:** Add to User schema
```javascript
visitedPlaces: [{ placeId: String, visitedAt: Date }],
totalDistanceKm: { type: Number, default: 0 },
travelStreak: { type: Number, default: 0 },
favoriteCategory: { type: String, default: 'Exploring' }
```

---

## Priority 2: Social Features (45 min)

### 2. Followers/Following API
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/followers
router.get('/followers', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json(user.followers || []);
});

// GET /api/users/following
router.get('/following', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json(user.following || []);
});

// GET /api/users/followers/count
router.get('/followers/count', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json({ count: user.followers?.length || 0 });
});

// GET /api/users/following/count
router.get('/following/count', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json({ count: user.following?.length || 0 });
});

// POST /api/users/follow/:userId
router.post('/follow/:userId', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  const targetUser = await User.findById(req.params.userId);
  
  if (!user.following.includes(req.params.userId)) {
    user.following.push(req.params.userId);
    targetUser.followers.push(user._id.toString());
    await user.save();
    await targetUser.save();
  }
  res.json({ success: true });
});

// DELETE /api/users/follow/:userId
router.delete('/follow/:userId', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  const targetUser = await User.findById(req.params.userId);
  
  user.following = user.following.filter(id => id !== req.params.userId);
  targetUser.followers = targetUser.followers.filter(id => id !== user._id.toString());
  await user.save();
  await targetUser.save();
  res.json({ success: true });
});
```

**Database:** Add to User schema
```javascript
followers: [{ type: String }],
following: [{ type: String }]
```

---

## Priority 3: Posts & Bookmarks (30 min)

### 3. Posts Count API
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/posts/count
router.get('/posts/count', requireAuth, async (req, res) => {
  const Post = mongoose.model('Post');
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  const count = await Post.countDocuments({ userId: user._id });
  res.json({ count });
});
```

### 4. Bookmarked Posts API
**Backend:** `backend/routes/posts.js` (create if missing)
```javascript
// GET /api/posts/bookmarked
router.get('/bookmarked', requireAuth, async (req, res) => {
  const User = getUser();
  const Post = mongoose.model('Post');
  const user = await User.findOne({ firebaseUid: req.user.uid });
  const posts = await Post.find({ _id: { $in: user.bookmarkedPosts || [] } });
  res.json(posts);
});
```

**Database:** Add to User schema
```javascript
bookmarkedPosts: [{ type: String }]
```

---

## Priority 4: Profile Enhancements (20 min)

### 5. Social Links API
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/social-links
router.get('/social-links', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json(user.socialLinks || []);
});

// PUT /api/users/social-links
router.put('/social-links', requireAuth, async (req, res) => {
  const User = getUser();
  await User.findOneAndUpdate(
    { firebaseUid: req.user.uid },
    { $set: { socialLinks: req.body.links } }
  );
  res.json({ success: true });
});
```

### 6. Preferences API
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/preferences
router.get('/preferences', requireAuth, async (req, res) => {
  const User = getUser();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  res.json(user.travelPreferences || {});
});

// PUT /api/users/preferences
router.put('/preferences', requireAuth, async (req, res) => {
  const User = getUser();
  await User.findOneAndUpdate(
    { firebaseUid: req.user.uid },
    { $set: { travelPreferences: req.body } }
  );
  res.json({ success: true });
});
```

---

## Priority 5: Data Management (15 min)

### 7. Export & Delete APIs
**Backend:** `backend/routes/users.js`
```javascript
// GET /api/users/export
router.get('/export', requireAuth, async (req, res) => {
  const User = getUser();
  const TripPlan = getTripPlan();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  const trips = await TripPlan.find({ userId: user._id });
  
  res.json({
    profile: user,
    trips,
    exportedAt: new Date()
  });
});

// DELETE /api/users/account
router.delete('/account', requireAuth, async (req, res) => {
  const User = getUser();
  const TripPlan = getTripPlan();
  const user = await User.findOne({ firebaseUid: req.user.uid });
  
  await TripPlan.deleteMany({ userId: user._id });
  await User.deleteOne({ firebaseUid: req.user.uid });
  
  res.json({ success: true });
});

// POST /api/users/password-reset
router.post('/password-reset', requireAuth, async (req, res) => {
  // Firebase handles password reset
  res.json({ success: true, message: 'Check your email' });
});
```

---

## Implementation Order

### Phase 1 (30 min) - Stats
1. Add travel stats fields to User schema
2. Implement GET/PUT `/api/users/travel-stats`
3. Test with mobile app

### Phase 2 (45 min) - Social
1. Add followers/following fields to User schema
2. Implement all follower/following endpoints
3. Test follow/unfollow flow

### Phase 3 (30 min) - Posts
1. Add bookmarkedPosts field to User schema
2. Implement posts count endpoint
3. Implement bookmarked posts endpoint

### Phase 4 (20 min) - Enhancements
1. Implement social links endpoints
2. Implement preferences endpoints

### Phase 5 (15 min) - Data Management
1. Implement export endpoint
2. Implement account deletion endpoint
3. Implement password reset endpoint

---

## Total Time: ~2.5 hours

## Database Schema Updates Needed

```javascript
// backend/models/User.js - Add these fields:
{
  // Travel Stats
  visitedPlaces: [{ placeId: String, visitedAt: Date }],
  totalDistanceKm: { type: Number, default: 0 },
  travelStreak: { type: Number, default: 0 },
  favoriteCategory: { type: String, default: 'Exploring' },
  
  // Social
  followers: [{ type: String }],
  following: [{ type: String }],
  
  // Posts
  bookmarkedPosts: [{ type: String }]
}
```

---

## Testing Checklist

- [ ] Travel stats display correctly
- [ ] Followers/following counts update
- [ ] Follow/unfollow works
- [ ] Bookmarked posts load
- [ ] Social links save/load
- [ ] Preferences save/load
- [ ] Data export downloads
- [ ] Account deletion works
- [ ] All endpoints return proper errors

---

## Notes

- All endpoints use existing `requireAuth` middleware
- No new dependencies needed
- Minimal database changes
- Mobile app already has API calls ready
- Just need to implement backend routes
