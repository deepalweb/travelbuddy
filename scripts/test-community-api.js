// Script to test community API endpoints
import fetch from 'node-fetch';

const BACKEND_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testCommunityAPI() {
  console.log('🧪 Testing Community API endpoints...\n');
  
  // Test 1: Fetch posts
  try {
    console.log('1. Testing GET /api/posts');
    const response = await fetch(`${BACKEND_URL}/api/posts?limit=5`);
    
    if (response.ok) {
      const posts = await response.json();
      console.log(`✅ Successfully fetched ${posts.length} posts`);
      
      if (posts.length > 0) {
        const firstPost = posts[0];
        console.log(`   First post: "${firstPost.content?.text?.substring(0, 50)}..."`);
        console.log(`   Author: ${firstPost.author?.name}`);
        console.log(`   Likes: ${firstPost.engagement?.likes || 0}`);
        console.log(`   Created: ${firstPost.createdAt}`);
        
        // Test 2: Like a post
        console.log('\n2. Testing POST /api/posts/:id/like');
        const likeResponse = await fetch(`${BACKEND_URL}/api/posts/${firstPost._id}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'test_mobile_user'
          })
        });
        
        if (likeResponse.ok) {
          const likeResult = await likeResponse.json();
          console.log(`✅ Successfully toggled like: ${likeResult.liked ? 'liked' : 'unliked'}`);
          console.log(`   New like count: ${likeResult.likes}`);
        } else {
          console.log(`❌ Failed to like post: ${likeResponse.status}`);
        }
      }
    } else {
      console.log(`❌ Failed to fetch posts: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error testing posts API:`, error.message);
  }
  
  // Test 3: Create a new post
  try {
    console.log('\n3. Testing POST /api/posts (create new post)');
    const newPost = {
      userId: '507f1f77bcf86cd799439011', // Mock ObjectId
      content: {
        text: 'Testing mobile app integration! 📱 This post was created from the mobile API test.',
        images: []
      },
      author: {
        name: 'Mobile Test User',
        avatar: '',
        location: 'Test Environment',
        verified: false
      },
      tags: ['test', 'mobile'],
      category: 'Experience'
    };
    
    const createResponse = await fetch(`${BACKEND_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPost)
    });
    
    if (createResponse.ok) {
      const createdPost = await createResponse.json();
      console.log(`✅ Successfully created test post`);
      console.log(`   Post ID: ${createdPost._id}`);
      console.log(`   Content: "${createdPost.content?.text?.substring(0, 50)}..."`);
    } else {
      const errorText = await createResponse.text();
      console.log(`❌ Failed to create post: ${createResponse.status} - ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error creating post:`, error.message);
  }
  
  console.log('\n🎉 Community API testing complete!');
}

testCommunityAPI();