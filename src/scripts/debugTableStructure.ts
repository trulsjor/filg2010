import { chromium } from 'playwright';

async function debugTableStructure() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches');

  // Handle cookie banner
  try {
    await page.click('text=AKSEPTER', { timeout: 5000 });
    await page.waitForTimeout(1000);
  } catch (e) {}

  await page.waitForTimeout(3000);

  // Find table rows and their structure
  const rowsData = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody tr');
    const data: any[] = [];

    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      const rowData: any = {
        rowIndex: idx,
        cellCount: cells.length,
        cells: []
      };

      cells.forEach((cell, cellIdx) => {
        const links = cell.querySelectorAll('a');
        const linkData = Array.from(links).map(a => ({
          text: a.textContent?.trim(),
          href: a.getAttribute('href')
        }));

        rowData.cells.push({
          index: cellIdx,
          text: cell.textContent?.trim().substring(0, 50),
          linkCount: links.length,
          links: linkData
        });
      });

      // Only include rows with kampnr (long numbers)
      const hasKampnr = rowData.cells.some((c: any) => /\d{10,}/.test(c.text));
      if (hasKampnr) {
        data.push(rowData);
      }
    });

    return data.slice(0, 3); // First 3 rows
  });

  console.log('Table structure:');
  console.log(JSON.stringify(rowsData, null, 2));

  await page.waitForTimeout(30000);
  await browser.close();
}

debugTableStructure();
