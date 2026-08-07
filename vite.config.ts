import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(rootDir, 'data')

const manifest = JSON.parse(fs.readFileSync(path.join(dataDir, 'index.json'), 'utf-8'))
const currentSeasonSlug: string = manifest.currentSeasonSlug

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

// Serverer data/ som statiske JSON-filer under /data i dev, og kopierer dem til
// dist/data/ ved build. Data lastes med fetch (ikke som hashede JS-chunks), så
// URL-ene er stabile.
function serveData(): PluginOption {
  return {
    name: 'serve-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/data/')) return next()
        const rel = req.url.split('?')[0].replace(/^\/data\//, '')
        // Kun sesongfiler (kull/slug/fil.json). La Vite håndtere bundlede importer
        // som /data/index.json (manifestet importeres som modul).
        if (rel.split('/').length < 3) return next()
        const filePath = path.join(dataDir, rel)
        if (
          filePath.startsWith(dataDir) &&
          fs.existsSync(filePath) &&
          fs.statSync(filePath).isFile()
        ) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(fs.readFileSync(filePath))
        } else {
          res.statusCode = 404
          res.end()
        }
      })
    },
    closeBundle() {
      if (fs.existsSync(dataDir)) copyDir(dataDir, path.join(rootDir, 'dist', 'data'))
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    serveData(),
    VitePWA({
      // Workbox genererer service workeren. Appshell + kode-chunks precaches, så en
      // kjørende versjon holder seg selvkonsistent. Data hentes som JSON og caches
      // per sesongtype (se runtimeCaching).
      registerType: 'autoUpdate',
      manifest: false, // behold eksisterende public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//, /^\/data\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Inneværende sesong endres ofte: vis cachet umiddelbart (rask), hent
            // fersk i bakgrunnen (oppdatert), fungerer offline.
            urlPattern: new RegExp(`/data/[^/]+/${currentSeasonSlug}/.*\\.json$`),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-current',
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Arkiverte sesonger er statiske: cache for alltid (umiddelbar, offline,
            // ingen revalidering).
            urlPattern: /\/data\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'data-archive',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 4321,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests-unit/**/*.spec.ts'],
  },
})
