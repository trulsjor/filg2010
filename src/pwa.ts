const RELOAD_GUARD_KEY = 'sw-preload-reload-at'
const RELOAD_GUARD_MS = 10_000

let preloadListenerAttached = false

// Workbox precacher det meste, men de største datachunkene (player-stats) er over
// precache-grensen og hentes fra nett. Etter en deploy kan en kjørende (cachet)
// fane be om en slik gammel chunk som er borte fra serveren. Vite sender da
// `vite:preloadError`; vi laster siden på nytt én gang (guardet mot loop) slik at
// appen henter fersk index.html med gyldige hash-navn.
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
