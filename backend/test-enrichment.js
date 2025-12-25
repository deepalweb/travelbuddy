// Test script for Places Enrichment API
// Run with: node test-enrichment.js

const testPlaces = [
  {
    place_id: "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
    name: "Eiffel Tower",
    types: ["tourist_attraction", "point_of_interest"],
    city: "Paris",
    country: "France",
    rating: 4.7,
    user_ratings_total: 285000,
    price_level: 2
  },
  {
    place_id: "ChIJ51cu8IcbXWARiRtXIothAS4",
    name: "Tokyo Skytree",
    types: ["tourist_attraction", "point_of_interest"],
    city: "Tokyo",
    country: "Japan",
    rating: 4.5,
    user_ratings_total: 125000,
    price_level: 3
  },
  {
    place_id: "ChIJrTLr-GyuEmsRBfy61i59si0",
    name: "Sydney Opera House",
    types: ["performing_arts_theater", "tourist_attraction"],
    city: "Sydney",
    country: "Australia",
    rating: 4.8,
    user_ratings_total: 95000,
    price_level: 2
  }
];

const BASE_URL = 'http://localhost:5000';

async function testSingleEnrichment() {
  console.log('\n🧪 Testing Single Place Enrichment...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/places-enrichment/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        place: testPlaces[0],
        language: 'en'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Single enrichment successful!');
      console.log('\nPlace:', result.data.place_id);
      console.log('\nEnrichment:');
      console.log('- Description:', result.data.enrichment.shortDescription);
      console.log('- Why Visit:', result.data.enrichment.whyVisit);
      console.log('- Best Time:', result.data.enrichment.bestTimeToVisit);
      console.log('- Local Tip:', result.data.enrichment.localTip);
      console.log('- Safety:', result.data.enrichment.safetyNote);
      console.log('- Cached:', result.data.enrichment.cached);
      console.log('- Fallback:', result.data.enrichment.fallback || false);
    } else {
      console.error('❌ Single enrichment failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBatchEnrichment() {
  console.log('\n🧪 Testing Batch Enrichment...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/places-enrichment/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        places: testPlaces,
        language: 'en'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Batch enrichment successful!');
      console.log('\nProcessed:', result.metrics.processed);
      console.log('Cached:', result.metrics.cached);
      console.log('Fallback:', result.metrics.fallback);
      
      console.log('\nResults:');
      result.data.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`);
        console.log('   Description:', item.enrichment.shortDescription.substring(0, 80) + '...');
        console.log('   Cached:', item.enrichment.cached);
      });
    } else {
      console.error('❌ Batch enrichment failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMetrics() {
  console.log('\n🧪 Testing Metrics Endpoint...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/places-enrichment/metrics`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Metrics retrieved successfully!');
      console.log('\nMetrics:');
      console.log('- Total Calls:', result.metrics.totalCalls);
      console.log('- Total Tokens:', result.metrics.totalTokens);
      console.log('- Cache Hits:', result.metrics.cacheHits);
      console.log('- Cache Size:', result.metrics.cacheSize);
      console.log('- Cache Hit Rate:', result.metrics.cacheHitRate);
      console.log('- Avg Tokens/Place:', result.metrics.avgTokensPerPlace);
      console.log('- Estimated Cost:', result.metrics.estimatedCostUSD);
      console.log('- Failures:', result.metrics.failures);
    } else {
      console.error('❌ Metrics failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testMultiLanguage() {
  console.log('\n🧪 Testing Multi-Language Support...\n');
  
  const languages = ['en', 'es', 'fr', 'ja'];
  
  for (const lang of languages) {
    try {
      const response = await fetch(`${BASE_URL}/api/places-enrichment/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          place: testPlaces[0],
          language: lang
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ ${lang.toUpperCase()} enrichment successful!`);
        console.log('   Description:', result.data.enrichment.shortDescription.substring(0, 60) + '...');
      } else {
        console.error(`❌ ${lang.toUpperCase()} enrichment failed:`, result.error);
      }
    } catch (error) {
      console.error(`❌ ${lang.toUpperCase()} error:`, error.message);
    }
  }
}

async function testCaching() {
  console.log('\n🧪 Testing Caching Behavior...\n');
  
  const place = testPlaces[0];
  
  // First call (should not be cached)
  console.log('Making first call (should NOT be cached)...');
  const response1 = await fetch(`${BASE_URL}/api/places-enrichment/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ place, language: 'en' })
  });
  const result1 = await response1.json();
  console.log('Cached:', result1.data.enrichment.cached);
  
  // Second call (should be cached)
  console.log('\nMaking second call (SHOULD be cached)...');
  const response2 = await fetch(`${BASE_URL}/api/places-enrichment/enrich`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ place, language: 'en' })
  });
  const result2 = await response2.json();
  console.log('Cached:', result2.data.enrichment.cached);
  
  if (result2.data.enrichment.cached) {
    console.log('\n✅ Caching is working correctly!');
  } else {
    console.log('\n⚠️ Warning: Second call was not cached');
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Places Enrichment API - Test Suite');
  console.log('═══════════════════════════════════════════════════');
  
  await testSingleEnrichment();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testBatchEnrichment();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testCaching();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testMultiLanguage();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testMetrics();
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Test Suite Complete!');
  console.log('═══════════════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch(console.error);
