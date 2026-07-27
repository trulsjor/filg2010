import { test, expect } from '@playwright/test'

test.describe('Kullvalg', () => {
  test('sender startsiden til et kull', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/(g|j)2010$/)
    await expect(page.locator('.header-text h1')).toContainText('Terminliste')
  })

  test('viser guttelaget på sin egen rute', async ({ page }) => {
    await page.goto('/g2010')

    await expect(page.locator('.header-text h1')).toHaveText('Terminliste G2010')
    await expect(page.locator('.squad-tab.active')).toHaveText('G2010')
  })

  test('viser jentelaget på sin egen rute', async ({ page }) => {
    await page.goto('/j2010')

    await expect(page.locator('.header-text h1')).toHaveText('Terminliste J2010')
    await expect(page.locator('.squad-tab.active')).toHaveText('J2010')
  })

  test('bytter kull når man klikker på fanen', async ({ page }) => {
    await page.goto('/g2010')
    await page.locator('.squad-tab', { hasText: 'J2010' }).click()

    await expect(page).toHaveURL(/\/j2010$/)
    await expect(page.locator('.header-text h1')).toHaveText('Terminliste J2010')
  })

  test('viser ulike kamper for de to kullene', async ({ page }) => {
    await page.goto('/g2010')
    await expect(page.locator('.match-card').first()).toBeVisible()
    const guttekamper = await page.locator('.match-card').allInnerTexts()

    await page.goto('/j2010')
    await expect(page.locator('.match-card').first()).toBeVisible()
    const jentekamper = await page.locator('.match-card').allInnerTexts()

    expect(guttekamper.join()).not.toBe(jentekamper.join())
  })

  test('sender gamle bokmerker videre i stedet for å vise tom side', async ({ page }) => {
    await page.goto('/tabeller')

    await expect(page).toHaveURL(/\/g2010\/tabeller$/)
  })
})

test.describe('Sesongarkiv', () => {
  test('viser arkivert sesong med tydelig merke', async ({ page }) => {
    await page.goto('/g2010?sesong=2025-2026')

    await expect(page.locator('.archive-badge')).toContainText('Arkiv 2025/2026')
  })

  test('viser arkivets kamper, ikke inneværende sesongs', async ({ page }) => {
    await page.goto('/g2010?sesong=2025-2026')

    const kamper = page.locator('.match-card')
    await expect(kamper.first()).toBeVisible()
    expect(await kamper.count()).toBeGreaterThan(10)
  })

  test('viser spillerstatistikk fra arkivsesongen', async ({ page }) => {
    await page.goto('/g2010/spillere?sesong=2025-2026')

    const rader = page.locator('.player-table tbody tr')
    await expect(rader.first()).toBeVisible()
    expect(await rader.count()).toBeGreaterThan(0)
  })

  test('tar vare på sesongvalget når man navigerer', async ({ page }) => {
    await page.goto('/g2010?sesong=2025-2026')
    await page.getByTestId('tabell-link').click()

    await expect(page).toHaveURL(/\/g2010\/tabeller\?sesong=2025-2026$/)
    await expect(page.locator('.archive-badge')).toBeVisible()
  })

  test('viser sesongvelger for begge kull, med begge sesongene', async ({ page }) => {
    for (const kull of ['g2010', 'j2010']) {
      await page.goto(`/${kull}`)

      const velger = page.locator('.season-select')
      await expect(velger).toBeVisible()
      await expect(velger.locator('option')).toHaveCount(2)
      await expect(velger).toHaveValue('2026-2027')
    }
  })

  test('bytter til arkivet via sesongvelgeren', async ({ page }) => {
    await page.goto('/j2010')
    await page.locator('.season-select').selectOption('2025-2026')

    await expect(page).toHaveURL(/\/j2010\?sesong=2025-2026$/)
    await expect(page.locator('.archive-badge')).toContainText('Arkiv 2025/2026')
  })
})

test.describe('Lenker fra tabellen', () => {
  test('går til lagsiden innenfor kullet, ikke til forsiden', async ({ page }) => {
    await page.goto('/g2010/tabeller?sesong=2025-2026')

    const lagLenke = page.locator('.table-team-link').first()
    await expect(lagLenke).toBeVisible()
    await lagLenke.click()

    await expect(page).toHaveURL(/\/g2010\/lag\/\d+\?sesong=2025-2026/)
  })

  test('beholder arkivsesongen på lagsiden', async ({ page }) => {
    await page.goto('/g2010/tabeller?sesong=2025-2026')
    await page.locator('.table-team-link').first().click()

    await expect(page.locator('.archive-badge')).toBeVisible()
  })

  test('sender gammel laglenke til kullet i stedet for forsiden', async ({ page }) => {
    await page.goto('/lag/531500')

    await expect(page).toHaveURL(/\/g2010\/lag\/531500$/)
  })

  test('beholder både spiller og sesong i gammel spillerlenke', async ({ page }) => {
    await page.goto('/g2010/spillere?sesong=2025-2026')
    const href = await page.locator('.player-name-link').first().getAttribute('href')
    const id = href?.split('/').pop()?.split('?')[0]

    await page.goto(`/spillere/${id}?sesong=2025-2026`)

    await expect(page).toHaveURL(`/g2010/spillere/${id}?sesong=2025-2026`)
    await expect(page.locator('.archive-badge')).toBeVisible()
  })
})
