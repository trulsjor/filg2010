import { chromium } from 'playwright';

async function debugTurnering() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches');

  // Handle cookie banner
  try {
    await page.click('text=AKSEPTER', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch (e) {}

  await page.waitForTimeout(3000);

  // Find all links in the page
  const allLinks = await page.evaluate(() => {
    const links: { text: string; href: string }[] = [];
    const anchors = document.querySelectorAll('a');

    anchors.forEach((a) => {
      const text = a.textContent?.trim() || '';
      const href = a.getAttribute('href') || '';

      // Look for tournament-related links
      if (text.includes('Regionserien') || text.includes('Region') ||
          href.includes('turnering') || href.includes('serie')) {
        links.push({ text, href });
      }
    });

    return links;
  });

  console.log('Found tournament-related links:');
  console.log(JSON.stringify(allLinks, null, 2));

  // Keep browser open for inspection
  await page.waitForTimeout(30000);
  await browser.close();
}

debugTurnering();
