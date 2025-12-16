import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function clearCache() {
  try {
    console.log('🗑️ Clearing backend cache...');
    
    const response = await fetch(`${BACKEND_URL}/api/places-hybrid/clear-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ ${data.message}`);
      console.log(`📊 Entries removed: ${data.entriesRemoved}`);
    } else {
      console.log('❌ Failed to clear cache');
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
  }
}

clearCache();
