import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces so the frontend is reachable from a Cloudflare
    // tunnel (or another LAN host). With host:true and the proxy below, the
    // guest only needs ONE URL: REST + WebSocket signalling both ride the
    // same origin and are forwarded to the backend on :9999.
    host: true,
    port: 5173,
    strictPort: true,
    // Cloudflare gives random `*.trycloudflare.com` hostnames; allow them
    // (and any other host) without the dev-server tripping its host check.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
      },
      '/ws/interview': {
        target: 'ws://localhost:9999',
        ws: true,
        changeOrigin: true,
      },
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash][extname]',
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable', 'docx'],
          'vendor-ui': ['lucide-react', 'class-variance-authority'],
          'vendor-http': ['axios'],
        }
      },
    },
  },
})
