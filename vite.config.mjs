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
 * Paths where the proxy streams heartbeat spaces to keep the browser
 * connection alive while the backend processes long-running LLM calls.
 * JSON.parse ignores leading whitespace, so "   {json}" works perfectly.
 */
const HEARTBEAT_INTERVAL_MS = 3_000

/** POST routes that can take 10s+ (LLM); without heartbeats idle TCP sockets are dropped (Docker / some proxies). */
function needsLlmHeartbeat(method, urlPath) {
  if (method !== 'POST') return false
  if (urlPath === '/api/v1/planner/generate-plan') return true
  if (urlPath === '/api/v1/planner/generate-architecture') return true
  if (urlPath === '/api/v1/planner/chat') return true
  if (/^\/api\/v1\/projects\/\d+\/wiki\/generate$/.test(urlPath)) return true
  return false
}

/**
 * Custom /api proxy that replaces Vite's built-in http-proxy.
 * For slow LLM endpoints listed in HEARTBEAT_PATHS the proxy immediately
 * sends chunked 200 + periodic space characters so the browser–proxy TCP
 * connection never goes idle (Docker port-forwarding drops idle sockets).
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
        httpServer.timeout = 0
        httpServer.setTimeout(0)
        httpServer.on('timeout', () => {})
        httpServer.on('connection', (socket) => {
          socket.setTimeout(0)
          socket.setKeepAlive(true, 5_000)
          socket.setNoDelay(true)
        })
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()

        const start = Date.now()
        const urlPath = req.url.split('?')[0]
        const tag = `[api-proxy] ${req.method} ${req.url}`
        console.log(`${tag} -> ${PROXY_TARGET}`)

        req.socket?.setTimeout(0)
        req.socket?.setKeepAlive(true, 5_000)
        req.socket?.setNoDelay(true)

        const needsHeartbeat = needsLlmHeartbeat(req.method, urlPath)

        if (needsHeartbeat) {
          // ── Streaming heartbeat mode ──────────────────────────────
          // Send 200 + chunked immediately so the browser socket stays
          // active.  Spaces before JSON are harmless (JSON.parse trims).
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache, no-transform',
            'X-Accel-Buffering': 'no',
          })

          const hb = setInterval(() => {
            try { if (!res.writableEnded) res.write(' ') } catch {}
          }, HEARTBEAT_INTERVAL_MS)

          // Strip accept-encoding so the backend doesn't gzip the body
          // (we already sent our own headers; gzipped bytes would be garbled).
          const fwdHeaders = { ...req.headers, host: target.host, connection: 'keep-alive' }
          delete fwdHeaders['accept-encoding']

          const proxyReq = httpRequest(
            {
              hostname: target.hostname,
              port: target.port,
              path: req.url,
              method: req.method,
              headers: fwdHeaders,
            },
            (proxyRes) => {
              clearInterval(hb)
              const elapsed = ((Date.now() - start) / 1000).toFixed(1)
              console.log(`${tag} <- ${proxyRes.statusCode} (${elapsed}s)`)
              proxyRes.pipe(res)
            },
          )

          proxyReq.setTimeout(0)
          proxyReq.on('socket', (s) => {
            s.setTimeout(0); s.setNoDelay(true); s.setKeepAlive(true, 5_000)
          })
          proxyReq.on('error', (err) => {
            clearInterval(hb)
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            console.error(`${tag} ERROR (${elapsed}s):`, err.code, err.message)
            try {
              if (!res.writableEnded)
                res.end(JSON.stringify({ detail: `Proxy error: ${err.message}` }))
            } catch {}
          })
          req.on('error', () => { clearInterval(hb); proxyReq.destroy() })
          res.on('close', () => {
            clearInterval(hb)
            if (!res.writableFinished) {
              const elapsed = ((Date.now() - start) / 1000).toFixed(1)
              console.warn(`${tag} CLIENT DISCONNECTED (${elapsed}s)`)
              proxyReq.destroy()
            }
          })
          req.pipe(proxyReq)
          return
        }

        // ── Normal pass-through proxy ────────────────────────────────
        const proxyReq = httpRequest(
          {
            hostname: target.hostname,
            port: target.port,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, host: target.host, connection: 'keep-alive' },
          },
          (proxyRes) => {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            console.log(`${tag} <- ${proxyRes.statusCode} (${elapsed}s)`)
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res)
          },
        )

        proxyReq.setTimeout(0)
        proxyReq.on('socket', (s) => {
          s.setTimeout(0); s.setNoDelay(true); s.setKeepAlive(true, 5_000)
        })
        proxyReq.on('error', (err) => {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1)
          console.error(`${tag} ERROR (${elapsed}s):`, err.code, err.message)
          if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ detail: `Proxy error: ${err.message}` }))
        })
        req.on('error', (err) => {
          console.error(`${tag} CLIENT ERROR:`, err.code, err.message)
          proxyReq.destroy()
        })
        res.on('close', () => {
          if (!res.writableFinished) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            console.warn(`${tag} CLIENT DISCONNECTED (${elapsed}s)`)
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

  /**
   * Pre-bundle the hottest eager vendor modules so Vite's dev server doesn't
   * waterfall 50+ `GET /node_modules/…` requests on cold start. This is a
   * dev-only win that directly addresses "refresh on throttled network =
   * blank for too long" while developing.
   */
  optimizeDeps: {
    include: [
      '@tanstack/react-query',
      'react-router',
      'axios',
      'zustand',
      'sonner',
      'lucide-react',
      'react',
      'react-dom',
      'react-dom/client',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'mermaid',
      'react-zoom-pan-pinch',
    ],
  },
})
