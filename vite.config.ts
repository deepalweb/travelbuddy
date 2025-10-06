import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react()
    ],
    publicDir: 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: {
  // Map AI keys to process.env for existing code paths; prefer VITE_ prefix if present
  'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
  '__DEV__': !isProduction
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      // Optimize chunk splitting
      rollupOptions: {
        input: path.resolve(__dirname, 'index-simple.html'),
        output: {
          // Dynamic chunk splitting with function for better Firebase handling
          manualChunks(id) {
            // Node modules as vendor (more stable than specific Firebase splitting)
            if (id.includes('node_modules')) {
              // Firebase modules grouped together to avoid initialization issues
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // Large libraries
              if (id.includes('leaflet')) {
                return 'maps-vendor';
              }
              if (id.includes('@google/genai')) {
                return 'ai-vendor';
              }
              // Socket.io
              if (id.includes('socket.io-client')) {
                return 'realtime-vendor';
              }
              // Other node_modules as vendor
              return 'vendor';
            }
            // Admin components
            if (id.includes('/admin/') || id.includes('AdminPortal')) {
              return 'admin-chunk';
            }
            // AI components
            if (id.includes('AITripPlannerView') || 
                id.includes('AIAssistantView') || 
                id.includes('ModernTripPlannerModal')) {
              return 'ai-components';
            }
            // Community features
            if (id.includes('CommunityView') || 
                id.includes('CommunityPhotoGalleryView') || 
                id.includes('CommunityInsights')) {
              return 'community-chunk';
            }
            // Other node_modules as vendor
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // Optimize chunk file names
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || 'asset';
            if (name.endsWith('.css')) {
              return 'css/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(name)) {
              return 'images/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      // Optimize terser settings
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug', 'console.info'],
        },
        mangle: {
          safari10: true
        }
      } : undefined,
      // Set chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true
    },
    server: {
      port: 5173,
      host: true,
      proxy: env.VITE_API_BASE_URL ? {} : {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 8080,
      host: true
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'leaflet',
        '@google/genai',
        'socket.io-client'
      ],
      exclude: ['@vite/client', '@vite/env', 'firebase']
    },
    // Enable esbuild optimizations
    esbuild: {
      target: 'es2020',
      drop: isProduction ? ['console', 'debugger'] : []
    }
  };
});