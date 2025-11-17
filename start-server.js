#!/usr/bin/env node

// Simple server startup script
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TravelBuddy Server...');

// Change to backend directory
process.chdir(path.join(__dirname, 'backend'));

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`🛑 Server process exited with code ${code}`);
  if (code !== 0) {
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down server...');
  server.kill('SIGTERM');
});