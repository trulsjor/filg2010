import { test, expect } from '@playwright/test'

const IPHONE = { width: 390, height: 844 }

const sider = [
  '/g2010',
  '/g2010/tabeller',
  '/g2010/2025-2026',
  '/g2010/2025-2026/tabeller',
  '/g2010/2025-2026/spillere',
  '/g2010/2025-2026/spillere/7125498',
  '/g2010/2025-2026/lag/531500',
]

test.describe('Mobillayout', () => {
  test.use({ viewport: IPHONE })

  for (const side of sider) {
    test(`ingenting stikker utenfor skjermen på ${side}`, async ({ page }) => {
      await page.goto(side)
      await expect(page.locator('.app')).toBeVisible()

      const utenfor = await page.evaluate(() => {
        const bredde = window.innerWidth
        const funn: string[] = []
        document.querySelectorAll('*').forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width > 0 && (r.right > bredde + 1 || r.left < -1)) {
            funn.push(
              `${el.className || el.tagName} (${Math.round(r.left)}–${Math.round(r.right)})`
            )
          }
        })
        return {
          funn: [...new Set(funn)].slice(0, 5),
          scroller: document.documentElement.scrollWidth > bredde,
        }
      })

      expect(utenfor.funn, `stikker utenfor: ${utenfor.funn.join(', ')}`).toEqual([])
      expect(utenfor.scroller, 'siden scroller sidelengs').toBe(false)
    })
  }

  test('spiller med mange kamper får lesbar graf uten etikettrot', async ({ page }) => {
    await page.goto('/g2010/2025-2026/spillere/7125498')
    await expect(page.locator('.goals-timeline')).toBeVisible()

    await expect(page.locator('.goals-timeline-dense')).toBeVisible()
    await expect(page.locator('.goals-bar-label')).toHaveCount(0)
    await expect(page.locator('.goals-x-axis')).toBeVisible()
  })

  test('spiller med få kamper beholder dato og resultat per stolpe', async ({ page }) => {
    await page.goto('/g2010/2025-2026/spillere/7133023')
    await expect(page.locator('.goals-timeline')).toBeVisible()

    await expect(page.locator('.goals-timeline-dense')).toHaveCount(0)
    expect(await page.locator('.goals-bar-label').count()).toBeGreaterThan(0)
  })
})
