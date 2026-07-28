export function registerServiceWorker(): void {
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
