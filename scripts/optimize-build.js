#!/usr/bin/env node

/**
 * Build optimization script for Travel Buddy
 * This script runs post-build optimizations
 */

import fs from 'fs';
import path from 'path';
import { gzipSync } from 'zlib';
import { execSync } from 'child_process';

const DIST_DIR = path.join(process.cwd(), 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

console.log('🚀 Starting post-build optimizations...');

// 1. Analyze bundle sizes
function analyzeBundleSizes() {
  console.log('\n📊 Analyzing bundle sizes...');
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log('Assets directory not found');
    return;
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const sizes = {};

  files.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    sizes[file] = sizeKB;
    
    // Warn about large files
    if (sizeKB > 500 && file.endsWith('.js')) {
      console.warn(`⚠️  Large JavaScript bundle: ${file} (${sizeKB}KB)`);
    }
    if (sizeKB > 100 && file.endsWith('.css')) {
      console.warn(`⚠️  Large CSS bundle: ${file} (${sizeKB}KB)`);
    }
  });

  console.log('Bundle sizes:', sizes);
  
  // Calculate total size
  const totalSize = Object.values(sizes).reduce((sum, size) => sum + size, 0);
  console.log(`📦 Total bundle size: ${totalSize}KB`);
  
  if (totalSize > 2000) {
    console.warn('⚠️  Large total bundle size. Consider further code splitting.');
  }
}

// 2. Generate pre-compressed files
function generateCompressedFiles() {
  console.log('\n🗜️  Generating pre-compressed files...');
  
  const files = fs.readdirSync(ASSETS_DIR, { recursive: true });
  let compressedCount = 0;

  files.forEach(file => {
    if (typeof file === 'string' && (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html'))) {
      const filePath = path.join(ASSETS_DIR, file);
      
      if (fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath);
        const compressed = gzipSync(content, { level: 9 });
        
        // Only create compressed version if it's significantly smaller
        if (compressed.length < content.length * 0.9) {
          fs.writeFileSync(`${filePath}.gz`, compressed);
          compressedCount++;
          
          const originalSize = Math.round(content.length / 1024);
          const compressedSize = Math.round(compressed.length / 1024);
          const savings = Math.round(((content.length - compressed.length) / content.length) * 100);
          
          console.log(`✅ ${file}: ${originalSize}KB → ${compressedSize}KB (${savings}% savings)`);
        }
      }
    }
  });

  console.log(`🎉 Generated ${compressedCount} compressed files`);
}

// 3. Generate resource preload hints
function generatePreloadHints() {
  console.log('\n🔗 Generating resource preload hints...');
  
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('index.html not found');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');
  const files = fs.readdirSync(ASSETS_DIR);
  
  // Find critical assets
  const criticalJS = files.find(file => file.includes('index') && file.endsWith('.js'));
  const criticalCSS = files.find(file => file.includes('index') && file.endsWith('.css'));
  
  const preloadLinks = [];
  
  if (criticalJS) {
    preloadLinks.push(`<link rel="preload" href="/assets/${criticalJS}" as="script">`);
  }
  
  if (criticalCSS) {
    preloadLinks.push(`<link rel="preload" href="/assets/${criticalCSS}" as="style">`);
  }
  
  // Add DNS prefetch for external domains
  const dnsPrefetch = [
    '<link rel="dns-prefetch" href="//fonts.googleapis.com">',
    '<link rel="dns-prefetch" href="//images.unsplash.com">',
    '<link rel="dns-prefetch" href="//api.gemini.google.com">',
    '<link rel="preconnect" href="//fonts.gstatic.com" crossorigin>'
  ];
  
  const allHints = [...dnsPrefetch, ...preloadLinks].join('\n  ');
  
  // Insert hints before closing head tag
  html = html.replace('</head>', `  ${allHints}\n</head>`);
  
  fs.writeFileSync(indexPath, html);
  console.log(`✅ Added ${preloadLinks.length} preload hints and ${dnsPrefetch.length} DNS prefetch hints`);
}

// 4. Generate service worker precache manifest
function updateServiceWorkerCache() {
  console.log('\n🔧 Updating service worker cache manifest...');
  
  const swPath = path.join(process.cwd(), 'sw-optimized.js');
  const distSwPath = path.join(DIST_DIR, 'sw.js');
  
  if (fs.existsSync(swPath)) {
    // Copy optimized service worker to dist
    fs.copyFileSync(swPath, distSwPath);
    
    let swContent = fs.readFileSync(distSwPath, 'utf-8');
    
    // Update cache names with build timestamp
    const timestamp = Date.now();
    swContent = swContent.replace(/v3\.0\.0/g, `v3.0.0-${timestamp}`);
    
    // Generate static assets list
    const staticAssets = [];
    const scanDir = (dir, relativePath = '') => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const relativeFilePath = path.join(relativePath, file).replace(/\\/g, '/');
        
        if (fs.statSync(filePath).isDirectory()) {
          scanDir(filePath, relativeFilePath);
        } else if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
          staticAssets.push(`'/${relativeFilePath}'`);
        }
      });
    };
    
    scanDir(DIST_DIR);
    
    // Update STATIC_ASSETS in service worker
    const assetsArray = `[\n  ${staticAssets.join(',\n  ')}\n]`;
    swContent = swContent.replace(
      /const STATIC_ASSETS = \[[\s\S]*?\];/,
      `const STATIC_ASSETS = ${assetsArray};`
    );
    
    fs.writeFileSync(distSwPath, swContent);
    console.log(`✅ Updated service worker with ${staticAssets.length} static assets`);
  } else {
    console.log('⚠️  Optimized service worker not found, using original');
    const originalSwPath = path.join(process.cwd(), 'sw.js');
    if (fs.existsSync(originalSwPath)) {
      fs.copyFileSync(originalSwPath, distSwPath);
    }
  }
}

// 5. Generate performance report
function generatePerformanceReport() {
  console.log('\n📈 Generating performance report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    bundleSizes: {},
    recommendations: [],
    metrics: {
      totalBundleSize: 0,
      compressedFiles: 0,
      preloadHints: 0
    }
  };

  // Calculate bundle sizes
  if (fs.existsSync(ASSETS_DIR)) {
    const files = fs.readdirSync(ASSETS_DIR);
    files.forEach(file => {
      if (file.endsWith('.js') || file.endsWith('.css')) {
        const filePath = path.join(ASSETS_DIR, file);
        const stats = fs.statSync(filePath);
        report.bundleSizes[file] = Math.round(stats.size / 1024);
      }
    });
    
    report.metrics.totalBundleSize = Object.values(report.bundleSizes)
      .reduce((sum, size) => sum + size, 0);
  }

  // Generate recommendations
  if (report.metrics.totalBundleSize > 2000) {
    report.recommendations.push('Consider further code splitting to reduce bundle size');
  }
  
  const jsFiles = Object.keys(report.bundleSizes).filter(f => f.endsWith('.js'));
  if (jsFiles.length > 5) {
    report.recommendations.push('Many JavaScript chunks - consider consolidating related functionality');
  }

  // Count compressed files
  if (fs.existsSync(ASSETS_DIR)) {
    const files = fs.readdirSync(ASSETS_DIR);
    report.metrics.compressedFiles = files.filter(f => f.endsWith('.gz')).length;
  }

  if (report.recommendations.length === 0) {
    report.recommendations.push('Bundle optimization looks good! 🎉');
  }

  const reportPath = path.join(DIST_DIR, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Performance Report:');
  console.log(`Total Bundle Size: ${report.metrics.totalBundleSize}KB`);
  console.log(`Compressed Files: ${report.metrics.compressedFiles}`);
  console.log('\n🎯 Recommendations:');
  report.recommendations.forEach(rec => console.log(`  • ${rec}`));
  
  console.log(`\n📋 Full report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    analyzeBundleSizes();
    generateCompressedFiles();
    generatePreloadHints();
    updateServiceWorkerCache();
    generatePerformanceReport();
    
    console.log('\n✅ Post-build optimizations completed successfully!');
    console.log('🚀 Your Travel Buddy app is now optimized for production');
    
  } catch (error) {
    console.error('\n❌ Optimization failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { analyzeBundleSizes, generateCompressedFiles, generatePreloadHints };
