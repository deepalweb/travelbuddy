import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const postSchema = new mongoose.Schema({
  content: {
    title: String,
    text: String,
    images: [String]
  },
  username: String,
  location: String,
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  likedBy: [String],
  commentsList: [{
    userId: String,
    username: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  moderationStatus: { type: String, default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

async function addSamplePosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const samplePosts = [
      {
        content: {
          title: 'Amazing Sunset at Sigiriya Rock',
          text: 'Just climbed the ancient Sigiriya Rock fortress in Sri Lanka! The view from the top was absolutely breathtaking. The sunset painted the entire landscape in golden hues. This 5th-century citadel is truly a marvel of ancient engineering and artistry.',
          images: [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop'
          ]
        },
        username: 'AdventureSeeker',
        location: 'Sigiriya, Sri Lanka',
        engagement: { likes: 127, comments: 23 },
        moderationStatus: 'approved'
      },
      {
        content: {
          title: 'Street Food Paradise in Bangkok',
          text: 'Spent the entire day exploring Bangkok\'s street food scene! From pad thai to mango sticky rice, every bite was a flavor explosion. The vendors were so friendly and passionate about their craft.',
          images: [
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&h=300&fit=crop',
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&h=300&fit=crop'
          ]
        },
        username: 'FoodieExplorer',
        location: 'Bangkok, Thailand',
        engagement: { likes: 89, comments: 15 },
        moderationStatus: 'approved'
      },
      {
        content: {
          title: 'Northern Lights Magic in Iceland',
          text: 'After 4 nights of waiting, we finally witnessed the Aurora Borealis! The green lights dancing across the star-filled sky was the most magical moment of my life.',
          images: [
            'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=500&h=300&fit=crop'
          ]
        },
        username: 'NatureLover23',
        location: 'Reykjavik, Iceland',
        engagement: { likes: 203, comments: 41 },
        moderationStatus: 'approved'
      }
    ];

    await Post.deleteMany({}); // Clear existing posts
    await Post.insertMany(samplePosts);
    
    console.log(`✅ Added ${samplePosts.length} sample posts`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSamplePosts();