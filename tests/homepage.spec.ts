import { test, expect } from '@playwright/test';

test.describe('Homepage - Terminliste', () => {
  test('should display the page title', async ({ page }) => {
    await page.goto('/');

    // Check for page title
    await expect(page.locator('h1')).toContainText('Terminliste');
  });

  test('should display a table with schedule data', async ({ page }) => {
    await page.goto('/');

    // Check that table exists
    const table = page.locator('table');
    await expect(table).toBeVisible();

    // Check for table headers (7 or 8 depending on if we have links)
    const headers = page.locator('th');
    const headerCount = await headers.count();
    expect(headerCount).toBeGreaterThanOrEqual(7);

    // Should have Turnering header
    await expect(page.locator('th:has-text("Turnering")')).toBeVisible();

    // Check some expected headers
    await expect(page.locator('th:has-text("Dato")')).toBeVisible();
    await expect(page.locator('th:has-text("Tid")')).toBeVisible();
    await expect(page.locator('th:has-text("Hjemmelag")')).toBeVisible();
    await expect(page.locator('th:has-text("Bortelag")')).toBeVisible();
  });

  test('should display schedule rows with data', async ({ page }) => {
    await page.goto('/');

    // Check that we have data rows (tbody tr)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();

    // Should have at least one row of data
    expect(rowCount).toBeGreaterThan(0);

    console.log(`Found ${rowCount} schedule rows`);
  });

  test('should display team names in rows', async ({ page }) => {
    await page.goto('/');

    // Check that Fjellhammer appears in the table (they are in the data)
    await expect(page.locator('text=Fjellhammer').first()).toBeVisible();
  });

  test('should have clickable links to matches if available', async ({ page }) => {
    await page.goto('/');

    // Check if there are any match links
    const matchLinks = page.locator('a.match-link');
    const count = await matchLinks.count();

    // If we have the enhanced CSV, there should be match links
    if (count > 0) {
      console.log(`Found ${count} match links`);

      // Check that first link has correct attributes
      const firstLink = matchLinks.first();
      await expect(firstLink).toHaveAttribute('target', '_blank');
      await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

      // Check that link has handball.no URL
      const href = await firstLink.getAttribute('href');
      expect(href).toContain('handball.no');
    } else {
      console.log('No match links found (enhanced CSV not present)');
    }
  });

  test('should have clickable team links if available', async ({ page }) => {
    await page.goto('/');

    // Look for links within table cells (team links)
    const teamLinks = page.locator('tbody td a:not(.match-link)');
    const count = await teamLinks.count();

    if (count > 0) {
      console.log(`Found ${count} team links`);

      // Check first team link
      const firstLink = teamLinks.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toContain('handball.no');
      expect(href).toContain('lagid=');
    } else {
      console.log('No team links found (enhanced CSV not present)');
    }
  });
});
