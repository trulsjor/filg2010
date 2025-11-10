import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');
const DATA_DIR = path.join(process.cwd(), 'data');
const COMBINED_JSON_PATH = path.join(DATA_DIR, 'terminliste.json');
const METADATA_PATH = path.join(DATA_DIR, 'metadata.json');

interface Team {
  name: string;
  lagid: string;
  seasonId: string;
  color: string;
}

interface MatchLink {
  kampnr: string;
  kampUrl?: string;
  hjemmelagUrl?: string;
  bortelagUrl?: string;
}

// Exported helper functions for testing
export function convertDateForSorting(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
  }
  return dateStr;
}

export function sortMatches(matches: any[]): any[] {
  return [...matches].sort((a, b) => {
    const dateA = a.Dato || '';
    const dateB = b.Dato || '';
    const timeA = a.Tid || '';
    const timeB = b.Tid || '';

    const sortableDateA = convertDateForSorting(dateA);
    const sortableDateB = convertDateForSorting(dateB);

    // First compare dates
    const dateCompare = sortableDateA.localeCompare(sortableDateB);
    if (dateCompare !== 0) return dateCompare;

    // If dates are equal, compare times
    return timeA.localeCompare(timeB);
  });
}

async function scrapeLinksForTeam(lagid: string): Promise<Map<string, MatchLink>> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const url = `https://www.handball.no/system/kamper/lag/?lagid=${lagid}#allmatches`;
    console.log(`  Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Handle cookie banner
    try {
      await page.click('text=AKSEPTER', { timeout: 5000 });
      await page.waitForTimeout(1000);
    } catch (e) {}

    const matchLinks = await page.evaluate(() => {
      const links: MatchLink[] = [];
      const rows = document.querySelectorAll('tr');

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        let kampnr = '';
        let kampUrl = '';
        let hjemmelagUrl = '';
        let bortelagUrl = '';

        cells.forEach((cell) => {
          const text = cell.textContent?.trim() || '';

          // Look for kampnr (9+ digits)
          if (/^\d{9,}/.test(text)) {
            kampnr = text.trim();
          }

          const cellLinks = cell.querySelectorAll('a');
          cellLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) return;

            if (href.includes('kampoppgjoer') || href.includes('/kamp/')) {
              kampUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`;
            } else if (href.includes('lagid=') || href.includes('/lag/')) {
              const url = href.startsWith('http') ? href : `https://www.handball.no${href}`;
              if (!hjemmelagUrl) {
                hjemmelagUrl = url;
              } else if (!bortelagUrl) {
                bortelagUrl = url;
              }
            }
          });
        });

        if (kampnr) {
          links.push({ kampnr, kampUrl: kampUrl || undefined, hjemmelagUrl: hjemmelagUrl || undefined, bortelagUrl: bortelagUrl || undefined });
        }
      });

      return links;
    });

    await browser.close();

    const linkMap = new Map<string, MatchLink>();
    matchLinks.forEach(link => {
      const kampnr = link.kampnr.trim();
      if (!linkMap.has(kampnr)) {
        linkMap.set(kampnr, link);
      }
    });

    return linkMap;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function scrapeTournamentLinksForAllTeams(teams: Team[]): Promise<Map<string, string>> {
  console.log('  Scraping tournament links from all team pages...');
  const browser = await chromium.launch({ headless: true });
  const tournamentMap = new Map<string, string>();

  try {
    for (const team of teams) {
      const url = `https://www.handball.no/system/kamper/lag/?lagid=${team.lagid}#allmatches`;
      console.log(`    - ${team.name} (${team.lagid})`);

      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      try {
        await page.click('text=AKSEPTER', { timeout: 5000 });
        await page.waitForTimeout(1000);
      } catch (e) {}

      const tournamentLinks = await page.evaluate(() => {
        const links: { name: string; url: string }[] = [];
        const anchors = document.querySelectorAll('a[href*="turnid="]');

        anchors.forEach((anchor) => {
          const href = anchor.getAttribute('href');
          const text = anchor.textContent?.trim() || '';

          if (href && text) {
            const url = href.startsWith('http') ? href : `https://www.handball.no${href}`;
            links.push({ name: text, url });
          }
        });

        return links;
      });

      // Add to map (deduplicated by tournament name)
      tournamentLinks.forEach(t => {
        if (!tournamentMap.has(t.name)) {
          tournamentMap.set(t.name, t.url);
        }
      });

      await page.close();
    }

    await browser.close();

    console.log(`    Found ${tournamentMap.size} unique tournaments`);

    // Save to cache
    const cachePath = path.join(DATA_DIR, 'turneringlenker.json');
    const tournamentArray = Array.from(tournamentMap.entries()).map(([name, url]) => ({ name, url }));
    fs.writeFileSync(cachePath, JSON.stringify(tournamentArray, null, 2), 'utf-8');

    return tournamentMap;
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function fetchAllTeamsData(): Promise<void> {
  try {
    console.log('=== Fetching data for all teams ===\n');

    // Load config
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    const teams: Team[] = config.teams;

    console.log(`Found ${teams.length} teams in config\n`);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Scrape tournament links from all team pages
    console.log('Step 1: Scraping tournament links from all team pages...');
    const tournamentMap = await scrapeTournamentLinksForAllTeams(teams);
    console.log();

    const allMatches: any[] = [];

    // Fetch data for each team
    for (const team of teams) {
      console.log(`Step 2: Fetching data for ${team.name} (lagid=${team.lagid})...`);

      // Fetch Excel data
      const apiUrl = `https://www.handball.no/AjaxData/TerminlisteLag?id=${team.lagid}&seasonId=${team.seasonId}`;
      console.log(`  Fetching Excel from API...`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`  Failed to fetch data for ${team.name}: ${response.statusText}`);
        continue;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(`  Loaded ${jsonData.length} matches from Excel`);

      // Scrape links for this team
      console.log(`  Scraping match links...`);
      const linkMap = await scrapeLinksForTeam(team.lagid);
      console.log(`  Found ${linkMap.size} match links`);

      // Combine data with links
      const enhancedData = jsonData.map((row: any) => {
        const kampnr = String(row.Kampnr || '').trim();
        const links = linkMap.get(kampnr);
        const turneringNavn = String(row.Turnering || '').trim();
        const turneringUrl = tournamentMap.get(turneringNavn) || '';

        return {
          Lag: team.name,
          ...row,
          'Kamp URL': links?.kampUrl || '',
          'Hjemmelag URL': links?.hjemmelagUrl || '',
          'Bortelag URL': links?.bortelagUrl || '',
          'Turnering URL': turneringUrl,
        };
      });

      allMatches.push(...enhancedData);
      console.log(`  Added ${enhancedData.length} matches for ${team.name}\n`);
    }

    // Sort all matches by date and time
    const sortedMatches = sortMatches(allMatches);
    allMatches.length = 0;
    allMatches.push(...sortedMatches);

    // Save as JSON
    fs.writeFileSync(COMBINED_JSON_PATH, JSON.stringify(allMatches, null, 2), 'utf-8');

    // Save metadata
    const metadata = {
      lastUpdated: new Date().toISOString(),
      teamsCount: teams.length,
      matchesCount: allMatches.length,
    };
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log('=== Summary ===');
    console.log(`Total matches: ${allMatches.length}`);
    console.log(`Teams: ${teams.map(t => t.name).join(', ')}`);
    console.log(`Saved to: ${COMBINED_JSON_PATH}`);
    console.log(`Last updated: ${metadata.lastUpdated}`);

  } catch (error) {
    console.error('Error fetching all teams data:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllTeamsData();
}
