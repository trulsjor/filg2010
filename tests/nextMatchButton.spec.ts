import { test, expect } from '@playwright/test';

test.describe('Next match button layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('aligns button with header and captures visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });

    const header = page.locator('.page-header');
    const button = page.locator('#next-match-button');
    const headingBlock = page.locator('.page-header-heading');

    await expect(button).toBeVisible();

    const [buttonBox, headingBox] = await Promise.all([
      button.boundingBox(),
      headingBlock.boundingBox(),
    ]);

    expect(buttonBox && headingBox).toBeTruthy();

    if (buttonBox && headingBox) {
      expect(buttonBox.x).toBeGreaterThan(headingBox.x + headingBox.width - 8);
      expect(buttonBox.height).toBeLessThan(headingBox.height);
    }

    await expect(header).toHaveScreenshot('next-match-button-mobile.png', {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 150,
    });
  });
});
