import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Workbox genererer service workeren. Precaching gjør at en kjørende versjon
      // holder seg selvkonsistent (alle chunks den refererer finnes i cachen), så
      // «gammel index → manglende chunk → text/html MIME-feil» ikke kan oppstå.
      registerType: 'autoUpdate',
      manifest: false, // behold eksisterende public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // De store statistikk-chunkene endres hver natt (data) og er store; å
        // precache dem ville betydd megabytes ny nedlasting per bruker hver natt.
        // De precaches ikke, men runtime-caches ved bruk (se runtimeCaching under).
        globIgnores: ['**/player-stats-*.js', '**/player-aggregates-*.js'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//],
        cleanupOutdatedCaches: true,
        // Cache hashede assets (inkl. de store data-chunkene som ikke precaches) ved
        // første bruk, så appen fungerer offline. Filnavnene har innholds-hash, så
        // CacheFirst er trygt; gamle filnavn ryddes via maxEntries.
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
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
