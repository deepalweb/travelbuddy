import fetch from 'node-fetch';

async function testDealsAPI() {
  try {
    console.log('🔍 Testing deals API endpoint...');
    
    const url = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/deals';
    console.log('📡 URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        'User-Agent': 'TravelBuddy-Test/1.0'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Response body:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Successfully parsed JSON');
        console.log('📊 Number of deals:', Array.isArray(data) ? data.length : 'Not an array');
        if (Array.isArray(data) && data.length > 0) {
          console.log('📋 First deal:', {
            title: data[0].title,
            businessName: data[0].businessName,
            isActive: data[0].isActive
          });
        }
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
      }
    } else {
      console.error('❌ API request failed');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testDealsAPI();