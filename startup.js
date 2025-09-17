#!/usr/bin/env node

// Azure Web App startup script
console.log('🚀 Starting TravelBuddy Azure deployment...');

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import and start the main server
import('./server.js').catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});