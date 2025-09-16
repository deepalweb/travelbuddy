// Script to seed community posts for testing
import fetch from 'node-fetch';

const BACKEND_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

// First create a sample user
const sampleUser = {
  username: 'mobile_test_user',
  email: 'mobile@test.com',
  tier: 'free'
};

const samplePosts = [
  {
    userId: null, // Will be set after creating user
    content: {
      text: 'Just had the most amazing sunset dinner at this rooftop restaurant in Santorini! The view was absolutely breathtaking and the food was incredible. Highly recommend for anyone visiting! 🌅',
      images: ['https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400']
    },
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      location: 'Santorini, Greece',
      verified: false
    },
    tags: ['photo', 'restaurant', 'sunset'],
    category: 'Photo'
  },
  {
    content: {
      text: 'Pro tip for Tokyo travelers: Get a JR Pass and explore beyond the city center. Some of the most beautiful temples and gardens are just a short train ride away!',
      images: []
    },
    author: {
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      location: 'Tokyo, Japan',
      verified: true
    },
    tags: ['tip', 'transportation', 'temples'],
    category: 'Tip'
  },
  {
    content: {
      text: 'Backpacking through the Swiss Alps was life-changing! The hiking trails, mountain views, and cozy mountain huts made this trip unforgettable. Already planning my next adventure!',
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1551524164-6cf2ac531400?w=400'
      ]
    },
    author: {
      name: 'Emma Wilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      location: 'Swiss Alps, Switzerland',
      verified: false
    },
    tags: ['story', 'hiking', 'adventure'],
    category: 'Experience'
  },
  {
    content: {
      text: 'Hidden gem alert! 🏖️ Found this secluded beach in Bali that\'s not in any guidebook. Crystal clear water, white sand, and barely any tourists. Sometimes the best discoveries happen when you get lost!',
      images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400']
    },
    author: {
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      location: 'Bali, Indonesia',
      verified: false
    },
    tags: ['photo', 'beach', 'hidden-gem'],
    category: 'Photo'
  },
  {
    content: {
      text: 'Budget travel hack: Book flights on Tuesday afternoons for the best deals! Also, use incognito mode when searching to avoid price tracking. Saved over $300 on my last trip to Europe using these tips.',
      images: []
    },
    author: {
      name: 'Budget Traveler',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      location: 'Digital Nomad',
      verified: true
    },
    tags: ['tip', 'budget', 'flights'],
    category: 'Tip'
  }
];

async function seedPosts() {
  console.log('🌱 Seeding community posts...');
  
  // First create or get a user
  let userId;
  try {
    const userResponse = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleUser)
    });
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      userId = user._id;
      console.log(`✅ Created/found user: ${user.username}`);
    } else {
      console.log(`❌ Failed to create user: ${userResponse.status}`);
      return;
    }
  } catch (error) {
    console.log(`❌ Error creating user:`, error.message);
    return;
  }
  
  // Now create posts with the userId
  for (const post of samplePosts) {
    post.userId = userId;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(post)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created post by ${post.author.name}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to create post by ${post.author.name}: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error creating post by ${post.author.name}:`, error.message);
    }
  }
  
  console.log('🎉 Community seeding complete!');
}

seedPosts();