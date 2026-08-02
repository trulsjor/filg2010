import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const viteConfig = fs.readFileSync(path.join(process.cwd(), 'vite.config.ts'), 'utf-8')

test.describe('PWA / service worker-oppsett (vite-plugin-pwa)', () => {
  test('service workeren genereres av Workbox (vite-plugin-pwa)', () => {
    expect(viteConfig).toContain('VitePWA')
  })

  test('nye utgivelser tas i bruk automatisk', () => {
    expect(viteConfig).toContain("registerType: 'autoUpdate'")
    expect(viteConfig).toContain('cleanupOutdatedCaches: true')
  })

  test('precacher bygg-assets, så en kjørende versjon holder seg selvkonsistent', () => {
    // Precaching er kjernen i fiksen: en gammel fane har alle chunkene sine i
    // cachen, så «gammel index → manglende chunk → text/html MIME-feil» kan ikke skje.
    expect(viteConfig).toContain('globPatterns')
    expect(viteConfig).toMatch(/navigateFallback:\s*'\/index\.html'/)
  })

  test('navigasjons-fallback gjelder ikke /assets/, så manglende chunks feiler rent', () => {
    expect(viteConfig).toContain('navigateFallbackDenylist')
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
