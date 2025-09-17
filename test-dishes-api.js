// Simple test script to verify local dishes API functionality
import fetch from 'node-fetch';

const API_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/dishes/local';

async function testLocalDishesAPI() {
  try {
    console.log('Testing Local Dishes API...');
    
    const response = await fetch(`${API_URL}?lat=6.878665&lng=79.8708143&cuisine=local&limit=8`);
    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    console.log('Number of dishes returned:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('✅ API is working - returned', data.length, 'dishes');
      console.log('Sample dish:', data[0]);
    } else {
      console.log('❌ API returned empty array or invalid data');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Test the API
testLocalDishesAPI();