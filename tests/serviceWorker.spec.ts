import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const swSource = fs.readFileSync(path.join(process.cwd(), 'public', 'sw.js'), 'utf-8')

test.describe('Service worker, statisk gjennomgang', () => {
  test('navigasjon hentes fra nett først, så nye utgivelser når fram', () => {
    expect(swSource).toContain("event.request.mode === 'navigate'")
    expect(swSource).toMatch(/navigate[\s\S]*networkFirst/)
  })

  test('bare filer med innholdshash serveres fra cache først', () => {
    expect(swSource).toMatch(/isHashedAsset[\s\S]*cacheFirst/)
    expect(swSource).toContain("url.pathname.startsWith('/assets/')")
  })

  test('cachen er versjonert, så en ny utgivelse rydder opp', () => {
    expect(swSource).toContain('terminliste-shell-${VERSION}')
    expect(swSource).toContain('caches.delete')
  })

  test('også asset-cachen er versjonert, så gamle/forgiftede oppføringer ryddes', () => {
    expect(swSource).toContain('terminliste-assets-${VERSION}')
  })

  test('cacher aldri SPA-fallbackens HTML for en manglende chunk', () => {
    // cacheFirst må sjekke content-type før den lagrer, ellers forgiftes cachen
    // med index.html og dynamiske import() feiler på «text/html is not a valid
    // JavaScript MIME type».
    expect(swSource).toContain('isHtmlResponse')
    expect(swSource).toMatch(/response\.ok && !isHtmlResponse\(response\)/)
    expect(swSource).toContain("type.includes('text/html')")
  })

  test('cachen for filer har en øvre grense', () => {
    expect(swSource).toContain('MAX_ASSET_ENTRIES')
    expect(swSource).toMatch(/trimAssetCache/)
  })

  test('tar over med en gang, uten å vente på at faner lukkes', () => {
    expect(swSource).toContain('self.skipWaiting()')
    expect(swSource).toContain('self.clients.claim()')
  })

  test('har en nødbryter som avregistrerer og tømmer cachen', () => {
    expect(swSource).toContain("event.data === 'unregister'")
    expect(swSource).toContain('self.registration')
  })

  test('rører ikke forespørsler til andre domener', () => {
    expect(swSource).toContain('if (!isSameOrigin(url)) return')
  })

  test('rører ikke annet enn GET', () => {
    expect(swSource).toContain("event.request.method !== 'GET'")
  })
})

test.describe('Service worker i nettleseren', () => {
  test('registreres ikke i utvikling', async ({ page }) => {
    await page.goto('/g2010')

    const registrations = await page.evaluate(async () => {
      const list = await navigator.serviceWorker.getRegistrations()
      return list.length
    })

    expect(registrations).toBe(0)
  })
})
