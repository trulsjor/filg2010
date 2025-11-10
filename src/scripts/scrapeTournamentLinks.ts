import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const URL = 'https://www.handball.no/system/kamper/lag/?lagid=531500#allmatches';
const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_PATH = path.join(DATA_DIR, 'turneringlenker.json');

interface TournamentLink {
  name: string;
  url: string;
}

export async function scrapeTournamentLinks(): Promise<Map<string, string>> {
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

    console.log('Scraping tournament links...');

    // Extract all tournament links from the page
    const tournamentLinks = await page.evaluate(() => {
      const links: TournamentLink[] = [];
      const seen = new Set<string>();

      // Find all links with turnid
      const anchors = document.querySelectorAll('a[href*="turnid="]');

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        const text = anchor.textContent?.trim() || '';

        if (href && text && !seen.has(text)) {
          seen.add(text);
          const url = href.startsWith('http') ? href : `https://www.handball.no${href}`;
          links.push({ name: text, url });
        }
      });

      return links;
    });

    console.log(`Found ${tournamentLinks.length} unique tournaments`);

    // Create a map for easy lookup
    const tournamentMap = new Map<string, string>();
    tournamentLinks.forEach(t => {
      tournamentMap.set(t.name, t.url);
      console.log(`  - ${t.name}`);
    });

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Save to JSON file
    const tournamentArray = Array.from(tournamentMap.entries()).map(([name, url]) => ({ name, url }));
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tournamentArray, null, 2), 'utf-8');
    console.log(`Tournament links saved to ${OUTPUT_PATH}`);

    await browser.close();
    return tournamentMap;
  } catch (error) {
    console.error('Error scraping tournament links:', error);
    await browser.close();
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeTournamentLinks();
}
