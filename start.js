import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting TravelBuddy application...');

// Check environment variables
const requiredEnvVars = ['MONGO_URI'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please set MONGO_URI in your Azure App Service Configuration');
    process.exit(1);
  }
}

console.log('✅ Environment variables check passed');

// Check if dist folder exists, if not build the app
if (!existsSync(join(process.cwd(), 'dist'))) {
  console.log('📦 Building React application...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    console.error('Continuing without build...');
  }
} else {
  console.log('✅ Build already exists');
}

// Start the server
console.log('🌐 Starting server...');
try {
  await import('./backend/server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
} 