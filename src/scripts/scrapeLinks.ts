import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const URL = 'https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches';
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'kamplenker.json');

interface MatchLink {
  kampnr: string;
  kampUrl?: string;
  hjemmelagUrl?: string;
  bortelagUrl?: string;
  turneringUrl?: string;
}

export async function scrapeMatchLinks(): Promise<MatchLink[]> {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle' });

    // Handle cookie banner
    try {
      await page.click('text=AKSEPTER', { timeout: 5000 });
      console.log('Accepted cookies');
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('No cookie banner or already accepted');
    }

    // Click on "Terminliste" tab if needed
    try {
      const terminlisteButton = page.locator('text=Terminliste');
      if (await terminlisteButton.isVisible({ timeout: 2000 })) {
        await terminlisteButton.click();
        await page.waitForTimeout(1000);
        console.log('Clicked Terminliste tab');
      }
    } catch (e) {
      console.log('Terminliste tab not found or already active');
    }

    console.log('Scraping match links...');

    // Extract all match links from the page
    const matchLinks = await page.evaluate(() => {
      const links: MatchLink[] = [];

      // Find all table rows with match data
      const rows = document.querySelectorAll('tr');

      rows.forEach((row) => {
        // Look for match number in the row
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        let kampnr = '';
        let kampUrl = '';
        let hjemmelagUrl = '';
        let bortelagUrl = '';
        let turneringUrl = '';

        cells.forEach((cell, index) => {
          const text = cell.textContent?.trim() || '';

          // Look for kampnr (usually a long number)
          if (/^\d{10,}/.test(text)) {
            kampnr = text.trim();
          }

          // Look for links in the cell
          const links = cell.querySelectorAll('a');
          links.forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) return;

            const linkText = link.textContent?.trim() || '';

            // Match link (kampoppgjør)
            if (href.includes('kampoppgjoer') || href.includes('/kamp/')) {
              kampUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`;
            }
            // Tournament links
            else if (href.includes('turnering') || href.includes('/serie/')) {
              turneringUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`;
            }
            // Team links
            else if (href.includes('lagid=') || href.includes('/lag/')) {
              const url = href.startsWith('http') ? href : `https://www.handball.no${href}`;

              // Try to determine if it's home or away team based on position or context
              if (!hjemmelagUrl) {
                hjemmelagUrl = url;
              } else if (!bortelagUrl) {
                bortelagUrl = url;
              }
            }
          });
        });

        if (kampnr) {
          links.push({
            kampnr,
            kampUrl: kampUrl || undefined,
            hjemmelagUrl: hjemmelagUrl || undefined,
            bortelagUrl: bortelagUrl || undefined,
            turneringUrl: turneringUrl || undefined,
          });
        }
      });

      return links;
    });

    console.log(`Found ${matchLinks.length} matches with links`);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Save to JSON file
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(matchLinks, null, 2), 'utf-8');
    console.log(`Match links saved to ${OUTPUT_PATH}`);

    await browser.close();
    return matchLinks;
  } catch (error) {
    console.error('Error scraping match links:', error);
    await browser.close();
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeMatchLinks();
}
