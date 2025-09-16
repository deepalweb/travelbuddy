#!/usr/bin/env node
// Vite Build Analyzer
// Analyzes Vite build output and provides optimization insights

import fs from 'fs';
import path from 'path';

const DIST_DIR = './dist';

console.log('📊 Analyzing Vite Build Output...\n');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log('❌ Build directory not found. Run npm run build first.');
    process.exit(1);
  }

  const files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        files.push({
          name: item,
          path: fullPath.replace(DIST_DIR + path.sep, ''),
          size: stat.size,
          ext: path.extname(item).toLowerCase()
        });
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function categorizeFiles(files) {
  const categories = {
    javascript: files.filter(f => f.ext === '.js'),
    css: files.filter(f => f.ext === '.css'),
    images: files.filter(f => ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(f.ext)),
    fonts: files.filter(f => ['.woff', '.woff2', '.ttf', '.eot'].includes(f.ext)),
    other: files.filter(f => !['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(f.ext))
  };
  
  return categories;
}

function analyzeChunks(jsFiles) {
  const chunks = {
    vendor: jsFiles.filter(f => f.name.includes('vendor')),
    components: jsFiles.filter(f => f.name.includes('chunk')),
    main: jsFiles.filter(f => f.name.includes('index')),
    other: jsFiles.filter(f => !f.name.includes('vendor') && !f.name.includes('chunk') && !f.name.includes('index'))
  };
  
  return chunks;
}

function generateReport(files) {
  const categories = categorizeFiles(files);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  
  console.log('🎯 BUILD SUMMARY');
  console.log('================');
  console.log(`Total Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`Total Files: ${files.length}`);
  console.log('');
  
  // JavaScript Analysis
  if (categories.javascript.length > 0) {
    const jsSize = categories.javascript.reduce((sum, f) => sum + f.size, 0);
    const chunks = analyzeChunks(categories.javascript);
    
    console.log('📜 JAVASCRIPT CHUNKS');
    console.log('--------------------');
    console.log(`Total JS Size: ${formatBytes(jsSize)} (${Math.round(jsSize/totalSize*100)}%)`);
    console.log(`Chunks: ${categories.javascript.length}`);
    console.log('');
    
    // Show largest chunks first
    const sortedJs = categories.javascript.sort((a, b) => b.size - a.size);
    sortedJs.slice(0, 10).forEach(file => {
      console.log(`  ${file.name.padEnd(35)} ${formatBytes(file.size).padStart(10)}`);
    });
    
    console.log('');
    
    // Chunk type analysis
    console.log('🔧 CHUNK ANALYSIS');
    console.log('-----------------');
    if (chunks.vendor.length > 0) {
      const vendorSize = chunks.vendor.reduce((sum, f) => sum + f.size, 0);
      console.log(`Vendor chunks: ${chunks.vendor.length} files (${formatBytes(vendorSize)})`);
    }
    if (chunks.components.length > 0) {
      const componentSize = chunks.components.reduce((sum, f) => sum + f.size, 0);
      console.log(`Component chunks: ${chunks.components.length} files (${formatBytes(componentSize)})`);
    }
    if (chunks.main.length > 0) {
      const mainSize = chunks.main.reduce((sum, f) => sum + f.size, 0);
      console.log(`Main chunks: ${chunks.main.length} files (${formatBytes(mainSize)})`);
    }
    console.log('');
  }
  
  // CSS Analysis
  if (categories.css.length > 0) {
    const cssSize = categories.css.reduce((sum, f) => sum + f.size, 0);
    console.log('🎨 STYLESHEETS');
    console.log('--------------');
    console.log(`Total CSS Size: ${formatBytes(cssSize)} (${Math.round(cssSize/totalSize*100)}%)`);
    categories.css.forEach(file => {
      console.log(`  ${file.name.padEnd(35)} ${formatBytes(file.size).padStart(10)}`);
    });
    console.log('');
  }
  
  // Images Analysis
  if (categories.images.length > 0) {
    const imageSize = categories.images.reduce((sum, f) => sum + f.size, 0);
    console.log('🖼️  IMAGES & ASSETS');
    console.log('------------------');
    console.log(`Total Image Size: ${formatBytes(imageSize)} (${Math.round(imageSize/totalSize*100)}%)`);
    if (categories.images.length > 10) {
      console.log(`  ${categories.images.length} image files (showing largest 5):`);
      categories.images.sort((a, b) => b.size - a.size).slice(0, 5).forEach(file => {
        console.log(`  ${file.name.padEnd(35)} ${formatBytes(file.size).padStart(10)}`);
      });
    } else {
      categories.images.forEach(file => {
        console.log(`  ${file.name.padEnd(35)} ${formatBytes(file.size).padStart(10)}`);
      });
    }
    console.log('');
  }
  
  // Performance Analysis
  console.log('⚡ PERFORMANCE INSIGHTS');
  console.log('======================');
  
  const jsSize = categories.javascript.reduce((sum, f) => sum + f.size, 0);
  const mainChunk = categories.javascript.find(f => f.name.includes('index'));
  
  if (totalSize < 500 * 1024) {
    console.log('✅ Excellent bundle size! Very fast loading.');
  } else if (totalSize < 1024 * 1024) {
    console.log('✅ Good bundle size. Fast loading on most connections.');
  } else if (totalSize < 2 * 1024 * 1024) {
    console.log('⚠️  Large bundle size. Consider code splitting.');
  } else {
    console.log('🚨 Very large bundle! Optimization strongly recommended.');
  }
  
  if (mainChunk && mainChunk.size > 250 * 1024) {
    console.log('⚠️  Main chunk is large. Consider lazy loading components.');
  }
  
  if (categories.javascript.length < 5) {
    console.log('💡 Consider more aggressive code splitting for better caching.');
  } else if (categories.javascript.length > 20) {
    console.log('ℹ️  Many chunks detected. Good for caching but may increase requests.');
  }
  
  console.log('');
  console.log('🚀 Build analysis complete!');
  
  // Return metrics for programmatic use
  return {
    totalSize,
    totalFiles: files.length,
    jsSize: categories.javascript.reduce((sum, f) => sum + f.size, 0),
    cssSize: categories.css.reduce((sum, f) => sum + f.size, 0),
    imageSize: categories.images.reduce((sum, f) => sum + f.size, 0),
    chunkCount: categories.javascript.length
  };
}

// Run analysis
try {
  const files = analyzeDirectory(DIST_DIR);
  const metrics = generateReport(files);
  
  // Exit with appropriate code based on bundle size
  process.exit(metrics.totalSize > 3 * 1024 * 1024 ? 1 : 0);
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  process.exit(1);
}
