import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only plugin: runs API handlers directly in the Vite server
// so SSE streaming works without vercel dev's response buffering.
function apiMiddleware() {
  return {
    name: 'api-middleware',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      Object.assign(process.env, env)

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const route = req.url.replace('/api/', '').split('?')[0]

        // Parse JSON body for POST requests
        if (req.method === 'POST') {
          try {
            req.body = await new Promise((resolve, reject) => {
              let data = ''
              req.on('data', chunk => (data += chunk))
              req.on('end', () => {
                try { resolve(JSON.parse(data)) }
                catch (e) { reject(e) }
              })
              req.on('error', reject)
            })
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid JSON body' }))
            return
          }
        }

        // Polyfill Vercel's express-like res helpers
        res.status = (code) => { res.statusCode = code; return res }
        const origEnd = res.end.bind(res)
        res.json = (data) => {
          if (!res.headersSent) res.setHeader('Content-Type', 'application/json')
          origEnd(JSON.stringify(data))
        }

        try {
          const mod = await server.ssrLoadModule(`/api/${route}.js`)
          await mod.default(req, res)
        } catch (err) {
          console.error(`API error (${route}):`, err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), apiMiddleware()],
})
