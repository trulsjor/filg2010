const RELOAD_GUARD_KEY = 'sw-preload-reload-at'
const RELOAD_GUARD_MS = 10_000

let preloadListenerAttached = false

// Etter en deploy forsvinner de gamle hash-chunkene fra serveren. En kjørende
// (cachet) app som laster en gammel chunk får da en lastefeil. Vite sender
// `vite:preloadError` for slike; vi laster siden på nytt én gang slik at appen
// henter fersk index.html med gyldige hash-navn. Guarden hindrer reload-loop.
export function recoverFromStalePreload(): void {
  if (typeof window === 'undefined') return
  if (preloadListenerAttached) return
  preloadListenerAttached = true

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()

    let last = 0
    try {
      last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY)) || 0
    } catch {
      last = 0
    }

    if (Date.now() - last < RELOAD_GUARD_MS) return

    try {
      sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()))
    } catch {
      // sessionStorage utilgjengelig – reload uansett, uten guard
    }
    window.location.reload()
  })
}

export function registerServiceWorker(): void {
  recoverFromStalePreload()

  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${__BUILD_ID__}`, { updateViaCache: 'none' })
      .catch(() => {
        return undefined
      })
  })
}
