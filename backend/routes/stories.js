import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Story Schema
const storySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 5000 },
  images: [{ type: String }], // Array of image URLs (max 10)
  location: {
    name: String,
    coordinates: { lat: Number, lng: Number },
    placeId: String
  },
  tags: [{ type: String }],
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ tags: 1 });
storySchema.index({ 'location.coordinates': '2dsphere' });
storySchema.index({ createdAt: -1 });
storySchema.index({ likes: -1 });

let Story;
try {
  Story = mongoose.model('Story');
} catch {
  Story = mongoose.model('Story', storySchema);
}

// GET /api/stories - Fetch stories with filters
router.get('/', async (req, res) => {
  try {
    const { filter = 'recent', tag, userId, lat, lng, radius = 50000, limit = 20, skip = 0 } = req.query;
    
    let query = {};
    let sort = { createdAt: -1 };
    
    // Filter by user
    if (userId) query.userId = userId;
    
    // Filter by tag
    if (tag) query.tags = tag;
    
    // Filter by location (nearby)
    if (lat && lng && filter === 'nearby') {
      query['location.coordinates'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      };
    }
    
    // Apply filter sorting
    if (filter === 'popular') sort = { likes: -1, createdAt: -1 };
    else if (filter === 'trending') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: oneDayAgo };
      sort = { likes: -1, views: -1 };
    }
    
    const stories = await Story.find(query)
      .populate('userId', 'username profilePicture')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stories/:id - Get single story
router.get('/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('userId', 'username profilePicture');
    
    if (!story) return res.status(404).json({ error: 'Story not found' });
    
    // Increment views
    story.views += 1;
    await story.save();
    
    res.json(story);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stories - Create story
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const { title, content, images, location, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    if (images && images.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 images allowed' });
    }
    
    // Find user
    let user = await mongoose.model('User').findOne({ firebaseUid: userId });
    if (!user) user = await mongoose.model('User').findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const story = new Story({
      userId: user._id,
      title,
      content,
      images: images || [],
      location,
      tags: tags || []
    });
    
    await story.save();
    
    const populated = await Story.findById(story._id)
      .populate('userId', 'username profilePicture');
    
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/stories/:id - Update story
router.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    
    // Check ownership
    let user = await mongoose.model('User').findOne({ firebaseUid: userId });
    if (!user) user = await mongoose.model('User').findById(userId);
    if (!user || story.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { title, content, images, location, tags } = req.body;
    
    if (title) story.title = title;
    if (content) story.content = content;
    if (images) story.images = images.slice(0, 10);
    if (location) story.location = location;
    if (tags) story.tags = tags;
    story.updatedAt = new Date();
    
    await story.save();
    
    const populated = await Story.findById(story._id)
      .populate('userId', 'username profilePicture');
    
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/stories/:id - Delete story
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    
    // Check ownership
    let user = await mongoose.model('User').findOne({ firebaseUid: userId });
    if (!user) user = await mongoose.model('User').findById(userId);
    if (!user || story.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Story.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/stories/:id/like - Like/unlike story
router.post('/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'Authentication required' });
    
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ error: 'Story not found' });
    
    const hasLiked = story.likedBy.includes(userId);
    
    if (hasLiked) {
      story.likedBy = story.likedBy.filter(id => id !== userId);
      story.likes = Math.max(0, story.likes - 1);
    } else {
      story.likedBy.push(userId);
      story.likes += 1;
    }
    
    await story.save();
    res.json({ liked: !hasLiked, likes: story.likes });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
