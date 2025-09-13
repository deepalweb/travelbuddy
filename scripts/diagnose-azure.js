#!/usr/bin/env node
// Azure App Service Diagnostic Tool
// Helps diagnose common deployment issues

import https from 'https';
import { performance } from 'perf_hooks';

const APP_URL = 'https://travelbuddy.azurewebsites.net';
const SCM_URL = 'https://travelbuddy.scm.azurewebsites.net';

console.log('🔧 Azure App Service Diagnostic Tool');
console.log('=====================================\n');

async function checkWithDetails(url, name) {
  console.log(`🔍 Checking ${name}: ${url}`);
  
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const req = https.get(url, { timeout: 15000 }, (res) => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      console.log(`   📊 Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   ⚡ Response Time: ${responseTime}ms`);
      console.log(`   📋 Headers:`);
      
      // Show important headers
      const importantHeaders = ['server', 'x-powered-by', 'content-type', 'location', 'www-authenticate'];
      importantHeaders.forEach(header => {
        if (res.headers[header]) {
          console.log(`      ${header}: ${res.headers[header]}`);
        }
      });
      
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.log(`   💥 Error Response Body:`);
          console.log(`   ${body.substring(0, 500)}${body.length > 500 ? '...' : ''}`);
        }
        
        resolve({
          success: res.statusCode < 400,
          statusCode: res.statusCode,
          responseTime,
          headers: res.headers,
          body
        });
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log(`   ❌ Request timeout after 15 seconds`);
      resolve({ success: false, error: 'timeout' });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Connection error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

async function diagnoseIssues() {
  console.log('🏥 Running Diagnostics...\n');
  
  // Check main app
  const mainResult = await checkWithDetails(APP_URL, 'Main Application');
  console.log('');
  
  // Check SCM site (if accessible)
  console.log('🔧 Checking SCM site for deployment status...');
  const scmResult = await checkWithDetails(`${SCM_URL}/api/deployments`, 'SCM Deployments API');
  console.log('');
  
  // Analyze results
  console.log('📋 DIAGNOSIS SUMMARY:');
  console.log('═══════════════════════\n');
  
  if (mainResult.statusCode === 403) {
    console.log('🚨 HTTP 403 FORBIDDEN detected:');
    console.log('   Possible causes:');
    console.log('   1. 🔐 IP restrictions configured in Azure App Service');
    console.log('   2. 🛡️ Application Gateway or WAF blocking requests');
    console.log('   3. 📁 Missing or incorrect web.config');
    console.log('   4. 🚫 Authentication required but not provided');
    console.log('   5. 🏗️ App is still starting up after deployment');
  } else if (mainResult.statusCode === 404) {
    console.log('🚨 HTTP 404 NOT FOUND detected:');
    console.log('   Possible causes:');
    console.log('   1. 📦 Build artifacts not deployed correctly');
    console.log('   2. 📁 Missing index.html in deployment package');
    console.log('   3. 🔧 Incorrect deployment path configuration');
  } else if (mainResult.statusCode === 500) {
    console.log('🚨 HTTP 500 INTERNAL SERVER ERROR detected:');
    console.log('   Possible causes:');
    console.log('   1. 🐛 Application error during startup');
    console.log('   2. 🔧 Missing environment variables');
    console.log('   3. 📦 Node.js version mismatch');
  } else if (mainResult.success) {
    console.log('✅ Application is responding correctly!');
  }
  
  console.log('\n🛠️ RECOMMENDED ACTIONS:');
  console.log('═══════════════════════\n');
  
  console.log('1. 🔍 Check Azure Portal:');
  console.log('   - Go to App Service → Overview');
  console.log('   - Check deployment status');
  console.log('   - Review application logs');
  
  console.log('\n2. 🔧 Verify Configuration:');
  console.log('   - App Service → Configuration → General settings');
  console.log('   - Ensure "Platform" is set to 64-bit');
  console.log('   - Check "Always On" is enabled for production');
  
  console.log('\n3. 📋 Check Application Settings:');
  console.log('   - App Service → Configuration → Application settings');
  console.log('   - Verify environment variables are set');
  
  console.log('\n4. 🚀 Recent Deployment:');
  console.log('   - App Service → Deployment Center');
  console.log('   - Check latest deployment status and logs');
  
  console.log('\n5. 📊 Monitor Logs:');
  console.log('   - App Service → Monitoring → Log stream');
  console.log('   - Look for startup errors or exceptions');
  
  if (mainResult.statusCode === 403) {
    console.log('\n🎯 FOR 403 ERRORS SPECIFICALLY:');
    console.log('   - Check if IP restrictions are enabled');
    console.log('   - Verify web.config rewrite rules');
    console.log('   - Try accessing /index.html directly');
    console.log('   - Wait 5-10 minutes if deployment just completed');
  }
  
  return mainResult.success;
}

// Run diagnostics
diagnoseIssues()
  .then(success => {
    console.log('\n🎯 DIAGNOSTIC COMPLETE');
    if (success) {
      console.log('🎉 No major issues detected!');
      process.exit(0);
    } else {
      console.log('⚠️ Issues found - review recommendations above');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });
