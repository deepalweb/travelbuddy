import fetch from 'node-fetch';

async function testDealsAPI() {
  try {
    console.log('🔍 Testing deals API endpoint...');
    
    const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';
    const url = `${API_BASE}/api/deals?isActive=true`;
    
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TravelBuddy-Test/1.0'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }
    
    const deals = await response.json();
    console.log(`✅ Successfully fetched ${deals.length} deals`);
    
    if (deals.length > 0) {
      console.log('📝 Sample deal:');
      const sample = deals[0];
      console.log({
        title: sample.title,
        businessName: sample.businessName,
        discount: sample.discount,
        isActive: sample.isActive,
        createdAt: sample.createdAt
      });
    } else {
      console.log('⚠️ No deals returned from API');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDealsAPI();