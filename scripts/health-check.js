#!/usr/bin/env node
// Production Deployment Health Checker
// Validates that your Travel Buddy app is properly deployed and optimized

import https from 'https';
import { performance } from 'perf_hooks';

const APP_URL = 'https://travelbuddy.azurewebsites.net';
const TIMEOUT = 10000; // 10 seconds

console.log('🔍 Starting Travel Buddy Health Check...\n');

// Health check functions
async function checkEndpoint(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const req = https.get(url, { timeout: TIMEOUT }, (res) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode === expectedStatus,
          statusCode: res.statusCode,
          responseTime,
          contentLength: body.length,
          headers: res.headers,
          body: body.substring(0, 500) // First 500 chars for inspection
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
        responseTime: TIMEOUT
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
        responseTime: performance.now() - startTime
      });
    });
  });
}

async function runHealthChecks() {
  const checks = [
    { name: 'Main App', url: APP_URL },
    { name: 'Manifest', url: `${APP_URL}/manifest.json` },
    { name: 'Service Worker', url: `${APP_URL}/sw.js` }
  ];
  
  const results = {};
  
  for (const check of checks) {
    console.log(`📡 Checking ${check.name}...`);
    const result = await checkEndpoint(check.url);
    results[check.name] = result;
    
    if (result.success) {
      console.log(`✅ ${check.name}: OK (${result.responseTime}ms)`);
    } else {
      console.log(`❌ ${check.name}: FAILED - ${result.error || `HTTP ${result.statusCode}`}`);
    }
  }
  
  return results;
}

function analyzeResults(results) {
  console.log('\n📊 Health Check Analysis:');
  console.log('═══════════════════════════════════════');
  
  const mainApp = results['Main App'];
  if (mainApp.success) {
    // Check for React content
    const hasReact = mainApp.body.includes('react') || mainApp.body.includes('React');
    const hasTitle = mainApp.body.includes('Travel Buddy');
    
    console.log(`🌐 App Status: HEALTHY`);
    console.log(`⚡ Response Time: ${mainApp.responseTime}ms`);
    console.log(`📄 Content Size: ${(mainApp.contentLength / 1024).toFixed(1)}KB`);
    console.log(`🎯 React Detected: ${hasReact ? 'Yes' : 'No'}`);
    console.log(`📝 Title Check: ${hasTitle ? 'Pass' : 'Fail'}`);
    
    // Performance assessment
    if (mainApp.responseTime < 500) {
      console.log('⚡ Performance: EXCELLENT');
    } else if (mainApp.responseTime < 1000) {
      console.log('✅ Performance: GOOD');
    } else {
      console.log('⚠️ Performance: NEEDS IMPROVEMENT');
    }
    
  } else {
    console.log('❌ App Status: UNHEALTHY');
    console.log(`🔍 Error: ${mainApp.error}`);
  }
  
  // Check service worker
  const sw = results['Service Worker'];
  if (sw && sw.success) {
    console.log('📱 Service Worker: ACTIVE');
  } else {
    console.log('📱 Service Worker: INACTIVE (Normal in dev)');
  }
  
  // Check manifest
  const manifest = results['Manifest'];
  if (manifest && manifest.success) {
    console.log('📋 PWA Manifest: AVAILABLE');
  } else {
    console.log('📋 PWA Manifest: NOT FOUND');
  }
}

// Run the health check
runHealthChecks()
  .then(results => {
    analyzeResults(results);
    
    const mainAppHealthy = results['Main App'].success;
    console.log('\n🎯 Overall Status:');
    if (mainAppHealthy) {
      console.log('🎉 Travel Buddy is LIVE and HEALTHY! 🚀');
      console.log(`🔗 Visit: ${APP_URL}`);
      process.exit(0);
    } else {
      console.log('💥 Travel Buddy has issues that need attention!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  });
