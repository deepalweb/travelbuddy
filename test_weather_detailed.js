import fetch from 'node-fetch';

const BASE_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

// Test multiple locations
const TEST_LOCATIONS = [
  { name: 'New York City', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 }
];

async function testWeatherEndpointDetailed() {
  console.log('🌤️ Detailed Weather API Testing\n');
  console.log(`Backend URL: ${BASE_URL}`);
  console.log('Testing Google Weather API endpoint with multiple locations\n');

  const results = [];

  for (const location of TEST_LOCATIONS) {
    console.log(`📍 Testing: ${location.name} (${location.lat}, ${location.lng})`);
    console.log('='.repeat(60));

    const url = `${BASE_URL}/api/weather/google?lat=${location.lat}&lng=${location.lng}`;
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TravelBuddy-Mobile-App/1.0'
        },
        timeout: 15000
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.status;
      
      if (response.ok) {
        const data = await response.json();
        
        const result = {
          location: location.name,
          coordinates: { lat: location.lat, lng: location.lng },
          status: 'SUCCESS',
          responseTime: responseTime,
          data: data
        };
        
        results.push(result);
        
        console.log(`✅ Status: ${status} OK`);
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        console.log(`🌡️  Temperature: ${data.current?.temperature || 'N/A'}°C`);
        console.log(`☁️  Condition: ${data.current?.condition || 'N/A'}`);
        console.log(`💧 Humidity: ${data.current?.humidity || 'N/A'}%`);
        console.log(`💨 Wind Speed: ${data.current?.windSpeed || 'N/A'} km/h`);
        console.log(`📝 Description: ${data.current?.description || 'N/A'}`);
        
        // Check if forecast data is available
        if (data.forecast) {
          console.log(`📊 Forecast: ${data.forecast.daily?.length || 0} days available`);
        }
        
        // Check data structure completeness
        const requiredFields = ['location', 'current'];
        const missingFields = requiredFields.filter(field => !data[field]);
        if (missingFields.length > 0) {
          console.log(`⚠️  Missing fields: ${missingFields.join(', ')}`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`❌ Status: ${status} ${response.statusText}`);
        console.log(`⏱️  Response Time: ${responseTime}ms`);
        console.log(`📄 Error: ${errorText}`);
        
        results.push({
          location: location.name,
          coordinates: { lat: location.lat, lng: location.lng },
          status: 'FAILED',
          responseTime: responseTime,
          error: errorText
        });
      }
      
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
      results.push({
        location: location.name,
        coordinates: { lat: location.lat, lng: location.lng },
        status: 'ERROR',
        responseTime: 0,
        error: error.message
      });
    }
    
    console.log(''); // Empty line for readability
  }

  // Performance Analysis
  console.log('📊 PERFORMANCE ANALYSIS');
  console.log('='.repeat(60));
  
  const successfulResults = results.filter(r => r.status === 'SUCCESS');
  const failedResults = results.filter(r => r.status !== 'SUCCESS');
  
  if (successfulResults.length > 0) {
    const responseTimes = successfulResults.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`✅ Successful Requests: ${successfulResults.length}/${results.length}`);
    console.log(`⏱️  Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`⚡ Fastest Response: ${minResponseTime}ms`);
    console.log(`🐌 Slowest Response: ${maxResponseTime}ms`);
    
    // Check data consistency
    const temperatures = successfulResults
      .map(r => r.data?.current?.temperature)
      .filter(t => t !== undefined);
    
    if (temperatures.length > 0) {
      console.log(`🌡️  Temperature Range: ${Math.min(...temperatures)}°C - ${Math.max(...temperatures)}°C`);
    }
  }
  
  if (failedResults.length > 0) {
    console.log(`❌ Failed Requests: ${failedResults.length}/${results.length}`);
    failedResults.forEach(result => {
      console.log(`   - ${result.location}: ${result.error || result.status}`);
    });
  }

  // Mobile App Compatibility Check
  console.log('\n📱 MOBILE APP COMPATIBILITY');
  console.log('='.repeat(60));
  
  if (successfulResults.length > 0) {
    const sampleData = successfulResults[0].data;
    
    // Check if response matches expected mobile app format
    const expectedFields = {
      'location': sampleData.location,
      'current.temperature': sampleData.current?.temperature,
      'current.condition': sampleData.current?.condition,
      'current.humidity': sampleData.current?.humidity,
      'current.windSpeed': sampleData.current?.windSpeed,
      'current.description': sampleData.current?.description
    };
    
    console.log('Expected mobile app fields:');
    Object.entries(expectedFields).forEach(([field, value]) => {
      const status = value !== undefined ? '✅' : '❌';
      console.log(`${status} ${field}: ${value !== undefined ? '✓' : 'Missing'}`);
    });
    
    // Check WeatherInfo compatibility
    console.log('\n🔄 WeatherInfo Class Compatibility:');
    const weatherInfoFields = [
      'temperature', 'feelsLike', 'humidity', 'windSpeed', 
      'condition', 'emoji', 'description', 'iconUrl', 
      'suggestions', 'timestamp', 'precipitation', 'forecast'
    ];
    
    weatherInfoFields.forEach(field => {
      let hasField = false;
      let value = 'N/A';
      
      if (field === 'temperature') {
        hasField = sampleData.current?.temperature !== undefined;
        value = sampleData.current?.temperature;
      } else if (field === 'condition') {
        hasField = sampleData.current?.condition !== undefined;
        value = sampleData.current?.condition;
      } else if (field === 'humidity') {
        hasField = sampleData.current?.humidity !== undefined;
        value = sampleData.current?.humidity;
      } else if (field === 'windSpeed') {
        hasField = sampleData.current?.windSpeed !== undefined;
        value = sampleData.current?.windSpeed;
      } else if (field === 'description') {
        hasField = sampleData.current?.description !== undefined;
        value = sampleData.current?.description;
      } else if (field === 'forecast') {
        hasField = sampleData.forecast !== undefined;
        value = sampleData.forecast ? 'Available' : 'N/A';
      }
      
      const status = hasField ? '✅' : '⚠️';
      console.log(`${status} ${field}: ${hasField ? value : 'Will use fallback/mock'}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  const successRate = (successfulResults.length / results.length) * 100;
  
  if (successRate === 100) {
    console.log('🎉 Excellent! Weather API is working perfectly across all test locations.');
    console.log('✅ Mobile app will receive real weather data consistently.');
  } else if (successRate >= 75) {
    console.log('👍 Good! Weather API is mostly working, but some locations failed.');
    console.log('⚠️  Monitor failed locations and investigate regional issues.');
  } else if (successRate >= 50) {
    console.log('⚠️  Warning! Weather API has significant issues.');
    console.log('🔧 Immediate investigation required for failed requests.');
  } else {
    console.log('🚨 Critical! Weather API is mostly failing.');
    console.log('🛠️  Urgent fixes needed - mobile app will rely heavily on fallbacks.');
  }
  
  if (successfulResults.length > 0) {
    const avgTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
    if (avgTime > 2000) {
      console.log('🐌 Performance Issue: Average response time > 2 seconds');
      console.log('   Consider adding caching or optimizing the weather service');
    } else if (avgTime > 1000) {
      console.log('⏱️  Performance Note: Response times could be improved');
      console.log('   Consider adding response caching for better user experience');
    } else {
      console.log('⚡ Performance: Response times are acceptable');
    }
  }

  return results;
}

// Run the detailed test
testWeatherEndpointDetailed()
  .then(results => {
    console.log('\n✨ Detailed weather API testing completed!');
    console.log(`📊 Final Results: ${results.filter(r => r.status === 'SUCCESS').length}/${results.length} locations successful`);
  })
  .catch(error => {
    console.error('\n💥 Failed to complete detailed weather API test:', error);
    process.exit(1);
  });