import { describe, it, expect, vi, beforeEach } from 'vitest'
import { recoverFromStalePreload } from './registerServiceWorker'

function stubReload(): ReturnType<typeof vi.fn> {
  const reload = vi.fn()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  })
  return reload
}

describe('recoverFromStalePreload', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('laster siden på nytt når en gammel chunk ikke kan lastes', () => {
    const reload = stubReload()
    recoverFromStalePreload()

    window.dispatchEvent(new CustomEvent('vite:preloadError'))

    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('reloader ikke gjentatte ganger i rask rekkefølge (ingen loop)', () => {
    const reload = stubReload()
    recoverFromStalePreload()

    window.dispatchEvent(new CustomEvent('vite:preloadError'))
    window.dispatchEvent(new CustomEvent('vite:preloadError'))

    expect(reload).toHaveBeenCalledTimes(1)
  })
})
