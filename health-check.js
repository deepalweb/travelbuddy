const https = require('https');

async function healthCheck(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status !== 429) return response;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}

async function testDeployment() {
  const baseUrl = process.env.APP_URL;
  
  try {
    const apiHealth = await healthCheck(`${baseUrl}/api/health`);
    const frontendHealth = await healthCheck(baseUrl);
    
    console.log(`API: ${apiHealth.status}, Frontend: ${frontendHealth.status}`);
    process.exit(apiHealth.ok && frontendHealth.ok ? 0 : 1);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

testDeployment();