// Quick test to check Google Places API
import fetch from 'node-fetch';

const API_KEY = 'AIzaSyAey-fuui7b3I-PkzJDVfsTFa9Kv_b_6ls';
const lat = 40.7128;
const lng = -74.0060;

async function testAPI() {
  console.log('🧪 Testing Google Places API...');
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📊 API Status:', data.status);
    console.log('📍 Results Count:', data.results?.length || 0);
    
    if (data.error_message) {
      console.log('❌ Error:', data.error_message);
    }
    
    if (data.results && data.results.length > 0) {
      console.log('✅ Sample Place:', data.results[0].name);
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
}

testAPI();