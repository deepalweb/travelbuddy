#!/usr/bin/env node

/**
 * TravelBuddy Azure App Service Startup Script
 * Optimized for production deployment on Azure
 */

const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  backendPath: path.join(__dirname, 'backend'),
  serverFile: path.join(__dirname, 'backend', 'server.js')
};

// Logging utility
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`)
};

// Startup checks
function performStartupChecks() {
  log.info('🚀 Starting TravelBuddy application...');
  log.info(`📍 Environment: ${config.nodeEnv}`);
  log.info(`🔌 Port: ${config.port}`);
  log.info(`📁 Backend path: ${config.backendPath}`);
  
  // Check if backend directory exists
  if (!fs.existsSync(config.backendPath)) {
    log.error('❌ Backend directory not found!');
    process.exit(1);
  }
  
  // Check if server.js exists
  if (!fs.existsSync(config.serverFile)) {
    log.error('❌ Server file not found!');
    process.exit(1);
  }
  
  // Check if public directory exists (frontend build)
  const publicPath = path.join(config.backendPath, 'public');
  if (!fs.existsSync(publicPath)) {
    log.warn('⚠️ Public directory not found - frontend may not be built');
  } else {
    log.info('✅ Frontend build found');
  }
  
  // Check if admin directory exists
  const adminPath = path.join(config.backendPath, 'admin');
  if (!fs.existsSync(adminPath)) {
    log.warn('⚠️ Admin directory not found - admin panel may not be built');
  } else {
    log.info('✅ Admin build found');
  }
  
  // Check node_modules
  const nodeModulesPath = path.join(config.backendPath, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    log.error('❌ Node modules not found!');
    process.exit(1);
  }
  
  log.info('✅ All startup checks passed');
}

// Environment setup
function setupEnvironment() {
  log.info('🔧 Setting up environment...');
  
  // Set NODE_ENV if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = config.nodeEnv;
  }
  
  // Set PORT if not already set
  if (!process.env.PORT) {
    process.env.PORT = config.port;
  }
  
  // Azure-specific environment variables
  if (process.env.WEBSITE_HOSTNAME) {
    log.info(`🌐 Azure hostname: ${process.env.WEBSITE_HOSTNAME}`);
  }
  
  if (process.env.WEBSITE_SITE_NAME) {
    log.info(`📱 Azure site name: ${process.env.WEBSITE_SITE_NAME}`);
  }
  
  log.info('✅ Environment setup completed');
}

// Error handlers
function setupErrorHandlers() {
  process.on('uncaughtException', (error) => {
    log.error(`💥 Uncaught Exception: ${error.message}`);
    log.error(error.stack);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    log.error(`💥 Unhandled Rejection at: ${promise}, reason: ${reason}`);
    process.exit(1);
  });
  
  process.on('SIGTERM', () => {
    log.info('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log.info('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

// Start the application
function startApplication() {
  log.info('🎯 Starting main application...');
  
  try {
    // Change to backend directory
    process.chdir(config.backendPath);
    
    // Require and start the server
    require(config.serverFile);
    
    log.info('🎉 TravelBuddy application started successfully!');
    
  } catch (error) {
    log.error(`💥 Failed to start application: ${error.message}`);
    log.error(error.stack);
    process.exit(1);
  }
}

// Main execution
function main() {
  try {
    setupErrorHandlers();
    performStartupChecks();
    setupEnvironment();
    startApplication();
  } catch (error) {
    log.error(`💥 Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  config,
  log,
  performStartupChecks,
  setupEnvironment,
  startApplication
};