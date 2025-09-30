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
const distPath = join(process.cwd(), 'dist');
const wwwrootDistPath = join('/home/site/wwwroot/dist');
const siteDistPath = join('/home/site/dist');

console.log('🔍 Checking for dist folder at:', distPath);
console.log('🔍 Checking for wwwroot dist at:', wwwrootDistPath);
console.log('🔍 Checking for site dist at:', siteDistPath);
console.log('📁 Current working directory:', process.cwd());

// Check if any dist folder exists
const hasDistFolder = existsSync(distPath) || existsSync(wwwrootDistPath) || existsSync(siteDistPath);

console.log('📦 Building React application...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Build completed');
  
  // Copy to Azure locations
  const { copyFileSync, mkdirSync, readdirSync, statSync } = await import('fs');
  if (existsSync(distPath)) {
    for (const dest of [wwwrootDistPath, siteDistPath]) {
      try {
        mkdirSync(dest, { recursive: true });
        const files = readdirSync(distPath);
        for (const file of files) {
          const src = join(distPath, file);
          const dst = join(dest, file);
          if (statSync(src).isFile()) copyFileSync(src, dst);
        }
        console.log(`✅ Copied to ${dest}`);
      } catch (e) {
        console.log(`⚠️ Could not copy to ${dest}`);
      }
    }
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

// Start the server
console.log('🌐 Starting server...');
try {
  await import('./backend/server.js');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}