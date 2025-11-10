import { chromium } from 'playwright';

async function inspectPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches');

  // Wait a bit for page to load
  await page.waitForTimeout(5000);

  // Get page content
  const html = await page.content();
  console.log('Page loaded, checking for tables...');

  // Find all tables
  const tables = await page.locator('table').count();
  console.log(`Found ${tables} tables`);

  // Try to find match rows
  const allText = await page.evaluate(() => {
    return document.body.innerText;
  });

  console.log('First 500 chars of page:', allText.substring(0, 500));

  // Take a screenshot
  await page.screenshot({ path: 'data/page-screenshot.png', fullPage: true });
  console.log('Screenshot saved to data/page-screenshot.png');

  // Wait for manual inspection
  console.log('Browser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

inspectPage();
