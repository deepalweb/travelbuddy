import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8080';

async function testPostsAPI() {
  console.log('🧪 Testing Posts API...\n');

  try {
    // Test 1: Get posts count
    console.log('1. Testing posts count...');
    const countResponse = await fetch(`${BASE_URL}/api/posts/count`);
    const countData = await countResponse.json();
    console.log('✅ Posts count:', countData);

    // Test 2: Get community posts
    console.log('\n2. Testing community posts fetch...');
    const postsResponse = await fetch(`${BASE_URL}/api/posts/community?limit=5`);
    const postsData = await postsResponse.json();
    console.log('✅ Community posts:', postsData.length, 'posts found');

    // Test 3: Create a test post
    console.log('\n3. Testing post creation...');
    const testPost = {
      userId: '507f1f77bcf86cd799439011', // Mock ObjectId
      content: {
        text: 'Test post from API test script',
        images: []
      },
      author: {
        name: 'Test User',
        avatar: null,
        location: 'Test Location',
        verified: false
      },
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0
      },
      moderationStatus: 'approved',
      tags: ['test'],
      category: 'general'
    };

    const createResponse = await fetch(`${BASE_URL}/api/posts/community`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '507f1f77bcf86cd799439011'
      },
      body: JSON.stringify(testPost)
    });

    if (createResponse.ok) {
      const createdPost = await createResponse.json();
      console.log('✅ Post created successfully:', createdPost._id);

      // Test 4: Like the post
      console.log('\n4. Testing post like...');
      const likeResponse = await fetch(`${BASE_URL}/api/posts/${createdPost._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '507f1f77bcf86cd799439011'
        },
        body: JSON.stringify({
          userId: '507f1f77bcf86cd799439011',
          username: 'TestUser'
        })
      });

      if (likeResponse.ok) {
        const likeData = await likeResponse.json();
        console.log('✅ Post liked successfully:', likeData);
      } else {
        console.log('❌ Like failed:', await likeResponse.text());
      }

      // Test 5: Add a comment
      console.log('\n5. Testing comment addition...');
      const commentResponse = await fetch(`${BASE_URL}/api/posts/${createdPost._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '507f1f77bcf86cd799439011'
        },
        body: JSON.stringify({
          userId: '507f1f77bcf86cd799439011',
          username: 'TestUser',
          text: 'This is a test comment'
        })
      });

      if (commentResponse.ok) {
        const commentData = await commentResponse.json();
        console.log('✅ Comment added successfully:', commentData.count, 'comments total');
      } else {
        console.log('❌ Comment failed:', await commentResponse.text());
      }

    } else {
      console.log('❌ Post creation failed:', await createResponse.text());
    }

    console.log('\n🎉 Posts API test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPostsAPI();