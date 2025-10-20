import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Flexible auth middleware for mobile/web
const flexAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  const userId = req.headers['x-user-id'];
  
  if (token) {
    try {
      // Try Firebase first
      const admin = (await import('../config/firebase.js')).default;
      if (admin?.auth) {
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = { uid: decoded.uid, ...decoded };
        return next();
      }
    } catch {}
    
    try {
      // Fallback to simple token
      const decoded = Buffer.from(token, 'base64').toString('utf8');
      const [id] = decoded.split(':');
      req.user = { uid: id };
      return next();
    } catch {}
  }
  
  if (userId) {
    req.user = { uid: userId };
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

// Get community posts with pagination
router.get('/community', async (req, res) => {
  try {
    console.log('🔍 Community posts request received');
    console.log('📋 Query params:', req.query);
    
    const Post = mongoose.model('Post');
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const cursor = req.query.cursor;
    
    // Check total posts in database first
    const totalPosts = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${totalPosts}`);
    
    if (totalPosts === 0) {
      console.log('⚠️ No posts found in database');
      return res.json([]);
    }
    
    let query = { 
      $or: [
        { moderationStatus: 'approved' },
        { moderationStatus: { $exists: false } }
      ]
    };
    
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }
    
    console.log('🔍 Fetching posts with query:', JSON.stringify(query));
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    console.log(`✅ Found ${posts.length} posts matching query`);
    
    // Return posts directly for mobile compatibility
    res.json(posts);
  } catch (error) {
    console.error('❌ Posts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create community post
router.post('/community', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const body = req.body || {};
    
    console.log('📝 Creating post - Raw body:', JSON.stringify(body, null, 2));
    console.log('👤 Auth user:', req.user);
    
    const images = body?.content?.images;
    if (Array.isArray(images) && images.length > 2) {
      return res.status(400).json({ error: 'Max 2 images allowed' });
    }
    
    if (!body.userId && req.user?.uid) {
      body.userId = req.user.uid;
    }
    
    // Ensure moderationStatus is approved by default
    if (!body.moderationStatus) {
      body.moderationStatus = 'approved';
    }
    
    console.log('📝 Final post data:', JSON.stringify(body, null, 2));
    
    const post = new Post(body);
    console.log('💾 Attempting to save post...');
    const saved = await post.save();
    console.log('✅ Post saved successfully:', saved._id);
    
    // Verify post was actually saved
    const verification = await Post.findById(saved._id);
    if (verification) {
      console.log('✅ Post verification successful - exists in database');
    } else {
      console.log('❌ Post verification failed - not found in database');
    }
    
    res.json(saved);
  } catch (error) {
    console.error('❌ Post creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Like/Unlike a post
router.post('/:id/like', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const { userId, username } = req.body || {};
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const likerKey = (userId || req.user?.uid || username || 'anon').toString();
    const hasLiked = post.likedBy.includes(likerKey);

    if (hasLiked) {
      post.likedBy = post.likedBy.filter((k) => k !== likerKey);
      post.engagement.likes = Math.max(0, (post.engagement.likes || 0) - 1);
    } else {
      post.likedBy.push(likerKey);
      post.engagement.likes = (post.engagement.likes || 0) + 1;
    }
    
    await post.save();
    
    return res.json({
      success: true,
      liked: !hasLiked,
      likes: post.engagement.likes,
      likedByCount: post.likedBy.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bookmark/Unbookmark a post
router.post('/:id/bookmark', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const User = mongoose.model('User');
    
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const user = await User.findOne({ $or: [{ firebaseUid: userId }, { _id: userId }] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bookmarks = user.bookmarkedPosts || [];
    const isBookmarked = bookmarks.includes(req.params.id);

    if (isBookmarked) {
      user.bookmarkedPosts = bookmarks.filter(id => id !== req.params.id);
    } else {
      user.bookmarkedPosts = [...bookmarks, req.params.id];
    }
    
    await user.save();
    res.json({ success: true, bookmarked: !isBookmarked });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a comment to a post
router.post('/:id/comments', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const { userId, username, text } = req.body || {};
    
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const commentUserId = userId || req.user?.uid;
    post.commentsList.push({ 
      userId: commentUserId, 
      username, 
      text: text.trim() 
    });
    post.engagement.comments = (post.engagement.comments || 0) + 1;
    
    await post.save();
    
    return res.json({ 
      success: true, 
      comments: post.commentsList, 
      count: post.engagement.comments 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const post = await Post.findById(req.params.id).select('commentsList engagement');
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    return res.json({ 
      comments: post.commentsList || [], 
      count: post.engagement?.comments || 0 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's bookmarked posts
router.get('/bookmarked', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const User = mongoose.model('User');
    
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findOne({ $or: [{ firebaseUid: userId }, { _id: userId }] });
    if (!user || !user.bookmarkedPosts) return res.json([]);

    const posts = await Post.find({ _id: { $in: user.bookmarkedPosts } })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
router.put('/:id', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const updates = {};
    
    if (req.body?.content && typeof req.body.content === 'object') {
      updates['content.text'] = req.body.content.text;
    }
    if (Array.isArray(req.body?.tags)) {
      updates['tags'] = req.body.tags;
    }
    if (typeof req.body?.category === 'string') {
      updates['category'] = req.body.category;
    }
    
    const post = await Post.findByIdAndUpdate(
      req.params.id, 
      { $set: updates }, 
      { new: true }
    );
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', flexAuth, async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post count for debugging
router.get('/count', async (req, res) => {
  try {
    const Post = mongoose.model('Post');
    const total = await Post.countDocuments();
    const approved = await Post.countDocuments({ moderationStatus: 'approved' });
    const noStatus = await Post.countDocuments({ moderationStatus: { $exists: false } });
    
    res.json({ 
      total, 
      approved, 
      noStatus, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;