import { test, expect } from '@playwright/test'

test.describe('Homepage - Terminliste', () => {
  test('should display the page title', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Terminliste')
  })

  test('should display match cards', async ({ page }) => {
    await page.goto('/')

    const matchGrid = page.locator('.match-grid')
    await expect(matchGrid).toBeVisible()

    const cards = page.locator('.match-card')
    const cardCount = await cards.count()

    expect(cardCount).toBeGreaterThan(0)
    console.log(`Found ${cardCount} match cards`)
  })

  test('should display match card with correct structure', async ({ page }) => {
    await page.goto('/')

    const firstCard = page.locator('.match-card').first()
    await expect(firstCard).toBeVisible()

    await expect(firstCard.locator('.card-header')).toBeVisible()
    await expect(firstCard.locator('.card-teams')).toBeVisible()
    await expect(firstCard.locator('.card-score')).toBeVisible()
  })

  test('should display team names in cards', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Fjellhammer').first()).toBeVisible()
  })

  test('should have clickable match links if available', async ({ page }) => {
    await page.goto('/')

    const matchLinks = page.locator('.card-action-primary')
    const count = await matchLinks.count()

    if (count > 0) {
      console.log(`Found ${count} match links`)
      const firstLink = matchLinks.first()
      await expect(firstLink).toHaveAttribute('target', '_blank')
    } else {
      console.log('No match links found')
    }
  })

  test('should have clickable team links if available', async ({ page }) => {
    await page.goto('/')

    const teamLinks = page.locator('.card-team-link')
    const count = await teamLinks.count()

    if (count > 0) {
      console.log(`Found ${count} team links`)
      const firstLink = teamLinks.first()
      const href = await firstLink.getAttribute('href')
      expect(href).toContain('/lag/')
    } else {
      console.log('No team links found')
    }
  })
})
