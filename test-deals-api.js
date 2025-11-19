import fetch from 'node-fetch';

const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testDealsAPI() {
  try {
    console.log('🔍 Testing deals API endpoint...');
    
    const url = `${API_BASE}/api/deals?isActive=true`;
    console.log('📡 Fetching from:', url);
    
    const response = await fetch(url, {
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
      console.log('📋 Sample deal:');
      const sample = deals[0];
      console.log({
        id: sample._id,
        title: sample.title,
        businessName: sample.businessName,
        discount: sample.discount,
        isActive: sample.isActive,
        validUntil: sample.validUntil
      });
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testDealsAPI();