import { chromium } from 'playwright';

async function findMissingMatch() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches');

  // Handle cookie banner
  try {
    await page.click('text=AKSEPTER', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch (e) {}

  await page.waitForTimeout(3000);

  // Look for the specific kampnr
  const result = await page.evaluate(() => {
    const searchKampnr = '420315002';
    const rows = document.querySelectorAll('tbody tr');
    const matches: any[] = [];

    rows.forEach((row) => {
      const text = row.textContent || '';
      if (text.includes(searchKampnr) || text.includes('420315')) {
        const cells = row.querySelectorAll('td');
        const rowData: any[] = [];

        cells.forEach((cell) => {
          const links = Array.from(cell.querySelectorAll('a')).map(a => ({
            text: a.textContent?.trim(),
            href: a.getAttribute('href')
          }));

          rowData.push({
            text: cell.textContent?.trim(),
            links
          });
        });

        matches.push(rowData);
      }
    });

    return matches;
  });

  console.log('Found matches with 420315:');
  console.log(JSON.stringify(result, null, 2));

  await page.waitForTimeout(30000);
  await browser.close();
}

findMissingMatch();
