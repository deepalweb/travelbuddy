import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = (env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'window.__GOOGLE_MAPS_API_KEY__': JSON.stringify(process.env.VITE_GOOGLE_MAPS_API_KEY),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            icons: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    publicDir: 'public',
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
