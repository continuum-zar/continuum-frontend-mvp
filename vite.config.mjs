import path from 'path'
import { fileURLToPath } from 'url'
import { request as httpRequest } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const analyzeBundle = process.env.ANALYZE === '1'

const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:8001'

/**
 * Custom /api proxy that replaces Vite's built-in http-proxy.
 * Uses Node's native http.request with all timeouts disabled so
 * slow LLM responses (30-120s+) are never dropped.
 */
function apiProxy() {
  const target = new URL(PROXY_TARGET)

  return {
    name: 'api-proxy',
    configureServer(server) {
      const httpServer = server.httpServer
      if (httpServer) {
        httpServer.headersTimeout = 0
        httpServer.requestTimeout = 0
        httpServer.keepAliveTimeout = 0
        httpServer.setTimeout(0)
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()

        const start = Date.now()
        const tag = `[api-proxy] ${req.method} ${req.url}`
        console.log(`${tag} -> ${PROXY_TARGET}`)

        req.socket?.setTimeout(0)
        req.socket?.setKeepAlive(true, 30_000)
        req.socket?.setNoDelay(true)

        const proxyReq = httpRequest(
          {
            hostname: target.hostname,
            port: target.port,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, host: target.host },
          },
          (proxyRes) => {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            console.log(`${tag} <- ${proxyRes.statusCode} (${elapsed}s)`)
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          },
        )

        proxyReq.setTimeout(0)
        proxyReq.on('socket', (socket) => {
          socket.setTimeout(0)
          socket.setNoDelay(true)
          socket.setKeepAlive(true, 30_000)
        })

        proxyReq.on('error', (err) => {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1)
          console.error(`${tag} ERROR (${elapsed}s):`, err.code, err.message)
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
          }
          res.end(JSON.stringify({ detail: `Proxy error: ${err.message}` }))
        })

        req.on('error', (err) => {
          console.error(`${tag} CLIENT ERROR:`, err.code, err.message)
          proxyReq.destroy()
        })

        res.on('close', () => {
          if (!res.writableFinished) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            console.warn(`${tag} CLIENT DISCONNECTED before response finished (${elapsed}s)`)
            proxyReq.destroy()
          }
        })

        req.pipe(proxyReq)
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiProxy(),
    ...(analyzeBundle
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            open: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    allowedHosts: true,
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
