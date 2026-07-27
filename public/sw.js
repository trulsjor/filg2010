const VERSION = new URL(self.location.href).searchParams.get('v') || 'ukjent'
const SHELL_CACHE = `terminliste-shell-${VERSION}`
const ASSET_CACHE = 'terminliste-assets'
const MAX_ASSET_ENTRIES = 80
const SHELL_URL = '/index.html'

const SHELL_ASSETS = ['/index.html', '/manifest.json', '/fjellhammer-logo.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            return undefined
          })
        )
      )
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== SHELL_CACHE && name !== ASSET_CACHE)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => trimAssetCache())
      .then(() => self.clients.claim())
  )
})

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/')
}

function isSameOrigin(url) {
  return url.origin === self.location.origin
}

async function trimAssetCache() {
  const cache = await caches.open(ASSET_CACHE)
  const keys = await cache.keys()
  const excess = keys.length - MAX_ASSET_ENTRIES
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i])
  }
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    const shell = await cache.match(SHELL_URL)
    if (shell) return shell
    throw error
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    await trimAssetCache()
  }
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE)
  const cached = await cache.match(request)

  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => cached)

  return cached || fresh
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  if (!isSameOrigin(url)) return

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request))
    return
  }

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  event.respondWith(staleWhileRevalidate(event.request))
})

self.addEventListener('message', (event) => {
  if (event.data === 'unregister') {
    self.registration
      .unregister()
      .then(() => caches.keys())
      .then((names) => Promise.all(names.map((name) => caches.delete(name))))
  }
})
