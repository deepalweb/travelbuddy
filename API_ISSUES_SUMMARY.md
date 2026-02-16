# API Issues Summary

## Issue 1: Posts Not Persisting After Refresh
**Status**: ✅ FIXED
**Problem**: Posts disappeared after app refresh because `loadPosts(refresh: true)` replaced all posts with backend data
**Solution**: Modified `community_provider.dart` to preserve temp posts when merging with backend

## Issue 2: Images Not Showing  
**Status**: ✅ FIXED
**Problem**: No error handling for failed image loads
**Solution**: Added `errorBuilder` and `loadingBuilder` to Image.network in `community_screen_place_first.dart`

## Issue 3: Post Creation Failing (400 Error)
**Status**: ❌ NOT FIXED - NEEDS ATTENTION
**Problem**: Backend returns 400 error when creating posts
**Root Cause**: Request body structure mismatch

### Backend Expects (posts.js line 95-110):
```javascript
{
  "content": { "text": "...", "images": [...] },
  "author": { "name": "...", "location": "..." },
  "tags": [...],
  "category": "..."
}
```

### Mobile App Sends (api_service.dart line 1050):
```dart
{
  'content': {'text': content, 'images': images},
  'author': {'name': username, 'avatar': photoURL, 'location': location, 'verified': false},
  'tags': hashtags,
  'category': postType,
}
```

### Mobile App Also Sends (community_api_service.dart line 45):
```dart
{
  'content': {'text': content, 'images': images},
  'author': {'name': username, 'location': location},
  'tags': hashtags,
  'category': postType,
  'userId': userId,
}
```

**Issue**: The structures look similar but backend validation might be failing. Need to check:
1. Backend Post model schema
2. What exact validation is failing (check backend logs)
3. Whether userId field is causing issues

## Issue 4: Next Button Not Enabling in Step 2
**Status**: ⚠️ PARTIALLY FIXED
**Problem**: Next button doesn't enable after entering valid tip
**Solution Applied**: Simplified validation logic and added debug prints
**Need**: User to test and provide console output

## Recommendations

### Immediate Actions:
1. **Check backend logs** when creating a post to see exact validation error
2. **Test tip validation** - type "Go before 7PM" and check console
3. **Verify Post model schema** in backend to match request structure

### API Alignment Needed:
- Standardize on ONE post creation structure across all services
- Add better error messages from backend (return which field failed validation)
- Consider adding request/response logging middleware

### Data Flow:
```
CreatePlacePostScreen → CommunityProvider.createPost() 
  → CommunityApiService.createPost() [PRIMARY]
  → ApiService.createPost() [FALLBACK]
  → Backend /api/community/posts
```

Both API services send slightly different structures - this needs consolidation.
