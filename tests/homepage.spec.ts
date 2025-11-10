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

    // Check for table headers
    const headers = page.locator('th');
    await expect(headers).toHaveCount(10); // 10 columns

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
});
