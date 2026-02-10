import { AzureMapsSearch } from './services/azureMapsSearch.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAzureMaps() {
  console.log('🧪 Testing Azure Maps Integration...\n');
  
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('❌ AZURE_MAPS_API_KEY not found in .env file');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...\n');
  
  const azureMaps = new AzureMapsSearch(apiKey);
  
  // Test 1: Search for restaurants in Colombo, Sri Lanka
  console.log('Test 1: Searching for restaurants in Colombo...');
  try {
    const restaurants = await azureMaps.searchPlacesComprehensive(
      6.9271,  // Colombo latitude
      79.8612, // Colombo longitude
      'restaurants',
      5000
    );
    console.log(`✅ Found ${restaurants.length} restaurants`);
    if (restaurants.length > 0) {
      console.log('Sample result:', {
        name: restaurants[0].name,
        address: restaurants[0].formatted_address,
        rating: restaurants[0].rating
      });
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 2: Search for tourist attractions
  console.log('Test 2: Searching for tourist attractions...');
  try {
    const attractions = await azureMaps.searchPlacesComprehensive(
      6.9271,
      79.8612,
      'tourist attractions',
      10000
    );
    console.log(`✅ Found ${attractions.length} attractions`);
    if (attractions.length > 0) {
      console.log('Sample result:', {
        name: attractions[0].name,
        address: attractions[0].formatted_address,
        types: attractions[0].types
      });
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  console.log('\n---\n');
  
  // Test 3: Search for hotels
  console.log('Test 3: Searching for hotels...');
  try {
    const hotels = await azureMaps.searchPlacesComprehensive(
      6.9271,
      79.8612,
      'hotels',
      5000
    );
    console.log(`✅ Found ${hotels.length} hotels`);
    if (hotels.length > 0) {
      console.log('Sample result:', {
        name: hotels[0].name,
        address: hotels[0].formatted_address,
        phone: hotels[0].phone || 'N/A'
      });
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
  
  console.log('\n🎉 Azure Maps integration test completed!');
}

testAzureMaps();
