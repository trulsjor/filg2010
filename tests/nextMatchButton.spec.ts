import { test, expect } from '@playwright/test'

test.describe('Next match button layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('displays next match button in header', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(200)

    const header = page.locator('.page-header')
    const button = page.locator('.next-match-btn')

    await expect(header).toBeVisible()
    await expect(button).toBeVisible()

    await expect(header).toHaveScreenshot('next-match-button-mobile.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 150,
    })
  })
})
