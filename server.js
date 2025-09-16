import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Starting TravelBuddy application...');

// Note: MongoDB is optional at runtime; if MONGO_URI is not provided, the backend will start and skip DB access.
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'disabled') {
  console.log('✅ MONGO_URI detected (database connection will be attempted by backend)');
} else {
  const skip = String(process.env.SKIP_MONGO || '').toLowerCase() === 'true';
  console.warn('ℹ️ MONGO_URI not set or disabled. Backend will start without MongoDB.');
  console.warn(`   SKIP_MONGO=${skip} (set to false and provide MONGO_URI to enable persistence).`);
}

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