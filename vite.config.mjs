import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    // Dev server (e.g. Docker on Railway) receives Host: *.up.railway.app — allow it (Vite 6 host check).
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8001',
        changeOrigin: true,
        autoRewrite: true,
      },
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'heavy-ui': ['recharts', 'motion'],
          'vendor-react-query': ['@tanstack/react-query'],
          'vendor-router': ['react-router'],
        },
      },
    },
  },
})
