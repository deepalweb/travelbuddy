import fetch from 'node-fetch';

const BASE_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

// Test coordinates (New York City)
const TEST_LAT = 40.7128;
const TEST_LNG = -74.0060;

async function checkWeatherEndpoints() {
  console.log('🌤️ Checking Weather API Endpoints Status\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Location: ${TEST_LAT}, ${TEST_LNG} (New York City)\n`);

  const endpoints = [
    {
      name: 'Google Weather API',
      url: `${BASE_URL}/api/weather/google?lat=${TEST_LAT}&lng=${TEST_LNG}`,
      description: 'Main weather endpoint used by mobile app'
    },
    {
      name: 'Weather Current',
      url: `${BASE_URL}/api/weather/current?lat=${TEST_LAT}&lng=${TEST_LNG}`,
      description: 'Alternative current weather endpoint'
    },
    {
      name: 'Weather Generic',
      url: `${BASE_URL}/api/weather?lat=${TEST_LAT}&lng=${TEST_LNG}`,
      description: 'Generic weather endpoint'
    },
    {
      name: 'Weather Forecast',
      url: `${BASE_URL}/api/weather/forecast?lat=${TEST_LAT}&lng=${TEST_LNG}`,
      description: 'Detailed forecast endpoint'
    }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TravelBuddy-Mobile-App/1.0'
        },
        timeout: 10000 // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.status;
      const statusText = response.statusText;
      
      let data = null;
      let contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          data = { error: 'Failed to parse JSON response' };
        }
      } else {
        const text = await response.text();
        data = { text: text.substring(0, 200) + (text.length > 200 ? '...' : '') };
      }

      const result = {
        endpoint: endpoint.name,
        url: endpoint.url,
        status: status,
        statusText: statusText,
        responseTime: responseTime,
        success: status >= 200 && status < 300,
        data: data,
        description: endpoint.description
      };

      results.push(result);

      if (result.success) {
        console.log(`✅ SUCCESS - ${status} ${statusText} (${responseTime}ms)`);
        if (data && typeof data === 'object') {
          if (data.current) {
            console.log(`   Temperature: ${data.current.temperature}°C`);
            console.log(`   Condition: ${data.current.condition}`);
          } else if (data.temperature) {
            console.log(`   Temperature: ${data.temperature}°C`);
            console.log(`   Condition: ${data.condition}`);
          }
        }
      } else {
        console.log(`❌ FAILED - ${status} ${statusText} (${responseTime}ms)`);
        if (data && data.error) {
          console.log(`   Error: ${data.error}`);
        }
      }
      
    } catch (error) {
      const result = {
        endpoint: endpoint.name,
        url: endpoint.url,
        status: 'ERROR',
        statusText: error.message,
        responseTime: 0,
        success: false,
        data: { error: error.message },
        description: endpoint.description
      };

      results.push(result);
      console.log(`❌ ERROR - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`Total Endpoints Tested: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%\n`);

  // Detailed results
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.endpoint}`);
    console.log(`   Status: ${result.status} ${result.statusText}`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Description: ${result.description}`);
    if (!result.success && result.data && result.data.error) {
      console.log(`   Error Details: ${result.data.error}`);
    }
    console.log('');
  });

  // Recommendations
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(50));
  
  const workingEndpoints = results.filter(r => r.success);
  const failedEndpoints = results.filter(r => !r.success);

  if (workingEndpoints.length > 0) {
    console.log('✅ Working endpoints:');
    workingEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.endpoint}: ${endpoint.url}`);
    });
    console.log('');
  }

  if (failedEndpoints.length > 0) {
    console.log('❌ Failed endpoints that need attention:');
    failedEndpoints.forEach(endpoint => {
      console.log(`   - ${endpoint.endpoint}: ${endpoint.status} ${endpoint.statusText}`);
    });
    console.log('');
  }

  if (successCount === 0) {
    console.log('🚨 CRITICAL: No weather endpoints are working!');
    console.log('   - Check if the backend server is running');
    console.log('   - Verify the base URL is correct');
    console.log('   - Check network connectivity');
    console.log('   - Review server logs for errors');
  } else if (successCount < totalCount) {
    console.log('⚠️  Some endpoints are not working:');
    console.log('   - The mobile app may fall back to mock data');
    console.log('   - Consider implementing the missing endpoints');
    console.log('   - Check server-side weather API configuration');
  } else {
    console.log('🎉 All weather endpoints are working correctly!');
    console.log('   - Mobile app should receive real weather data');
    console.log('   - No action needed');
  }

  return results;
}

// Run the check
checkWeatherEndpoints()
  .then(results => {
    console.log('\n✨ Weather API status check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Failed to complete weather API check:', error);
    process.exit(1);
  });