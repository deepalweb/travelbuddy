#!/usr/bin/env node

/**
 * Azure Live App Status Verification Script
 * Tests all critical endpoints and services
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://travelbuddylk.com';
const API_BASE = `${BASE_URL}/api`;

// Test endpoints configuration
const ENDPOINTS = [
  {
    name: 'Health Check',
    url: `${API_BASE}/health`,
    method: 'GET',
    critical: true
  },
  {
    name: 'Places API',
    url: `${API_BASE}/places/nearby?lat=6.9271&lng=79.8612&q=restaurants`,
    method: 'GET',
    critical: true
  },
  {
    name: 'Trip Generation',
    url: `${API_BASE}/trips/generate`,
    method: 'POST',
    body: JSON.stringify({
      destination: 'Colombo',
      duration: '2 days',
      budget: 'medium'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    critical: true
  },
  {
    name: 'Weather API',
    url: `${API_BASE}/weather/forecast?lat=6.9271&lng=79.8612`,
    method: 'GET',
    critical: false
  },
  {
    name: 'Emergency Services',
    url: `${API_BASE}/emergency/police?lat=6.9271&lng=79.8612`,
    method: 'GET',
    critical: false
  },
  {
    name: 'Local Dishes',
    url: `${API_BASE}/dishes/local?lat=6.9271&lng=79.8612`,
    method: 'GET',
    critical: false
  },
  {
    name: 'Firebase Config',
    url: `${API_BASE}/config/firebase`,
    method: 'GET',
    critical: true
  },
  {
    name: 'Community Posts',
    url: `${API_BASE}/community/posts?limit=5`,
    method: 'GET',
    critical: false
  },
  {
    name: 'Database Check',
    url: `${API_BASE}/db-check`,
    method: 'GET',
    critical: true
  },
  {
    name: 'Usage Metrics',
    url: `${API_BASE}/usage`,
    method: 'GET',
    critical: false
  }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'User-Agent': 'TravelBuddy-Status-Check/1.0',
        ...endpoint.headers
      },
      timeout: 15000
    };

    const client = url.protocol === 'https:' ? https : http;
    const startTime = Date.now();

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        let parsedData = null;
        
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          // Not JSON, that's okay
        }

        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          responseTime,
          data: parsedData || data.substring(0, 200),
          error: null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        data: null,
        error: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        data: null,
        error: 'Request timeout'
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }

    req.end();
  });
}

async function runStatusCheck() {
  console.log(`${colors.bold}${colors.blue}🚀 TravelBuddy Azure Status Check${colors.reset}`);
  console.log(`${colors.blue}Testing: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}Time: ${new Date().toISOString()}${colors.reset}\n`);

  const results = [];
  let criticalFailures = 0;
  let totalFailures = 0;

  for (const endpoint of ENDPOINTS) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    const result = await makeRequest(endpoint);
    results.push({ endpoint, result });

    if (result.success) {
      console.log(`${colors.green}✅ OK${colors.reset} (${result.responseTime}ms)`);
    } else {
      const symbol = endpoint.critical ? '❌' : '⚠️';
      const color = endpoint.critical ? colors.red : colors.yellow;
      console.log(`${color}${symbol} FAIL${colors.reset} (${result.statusCode || 'ERR'}) ${result.error || ''}`);
      
      if (endpoint.critical) criticalFailures++;
      totalFailures++;
    }
  }

  // Summary
  console.log(`\n${colors.bold}📊 Summary${colors.reset}`);
  console.log(`Total endpoints: ${ENDPOINTS.length}`);
  console.log(`Successful: ${colors.green}${ENDPOINTS.length - totalFailures}${colors.reset}`);
  console.log(`Failed: ${totalFailures > 0 ? colors.red : colors.green}${totalFailures}${colors.reset}`);
  console.log(`Critical failures: ${criticalFailures > 0 ? colors.red : colors.green}${criticalFailures}${colors.reset}`);

  // Overall status
  if (criticalFailures === 0) {
    console.log(`\n${colors.bold}${colors.green}🎉 Status: OPERATIONAL${colors.reset}`);
  } else if (criticalFailures <= 2) {
    console.log(`\n${colors.bold}${colors.yellow}⚠️ Status: DEGRADED${colors.reset}`);
  } else {
    console.log(`\n${colors.bold}${colors.red}🚨 Status: DOWN${colors.reset}`);
  }

  // Detailed results for failures
  const failures = results.filter(r => !r.result.success);
  if (failures.length > 0) {
    console.log(`\n${colors.bold}🔍 Failure Details${colors.reset}`);
    failures.forEach(({ endpoint, result }) => {
      console.log(`\n${endpoint.name}:`);
      console.log(`  URL: ${endpoint.url}`);
      console.log(`  Status: ${result.statusCode || 'No response'}`);
      console.log(`  Error: ${result.error || 'Unknown error'}`);
      if (result.data && typeof result.data === 'string') {
        console.log(`  Response: ${result.data.substring(0, 100)}...`);
      }
    });
  }

  // Performance summary
  const successfulResults = results.filter(r => r.result.success);
  if (successfulResults.length > 0) {
    const avgResponseTime = successfulResults.reduce((sum, r) => sum + r.result.responseTime, 0) / successfulResults.length;
    const maxResponseTime = Math.max(...successfulResults.map(r => r.result.responseTime));
    
    console.log(`\n${colors.bold}⚡ Performance${colors.reset}`);
    console.log(`Average response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`Slowest response: ${maxResponseTime}ms`);
  }

  console.log(`\n${colors.blue}Check completed at ${new Date().toISOString()}${colors.reset}`);
  
  // Exit with appropriate code
  process.exit(criticalFailures > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}❌ Uncaught error: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}❌ Unhandled rejection: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run the status check
runStatusCheck().catch((error) => {
  console.error(`${colors.red}❌ Status check failed: ${error.message}${colors.reset}`);
  process.exit(1);
});