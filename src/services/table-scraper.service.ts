/**
 * Service for scraping league tables from handball.no
 */

import { chromium, type Page } from 'playwright';

export interface TableRow {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface LeagueTable {
  tournamentName: string;
  tournamentUrl: string;
  rows: TableRow[];
  updatedAt: string;
}

const COOKIE_ACCEPT_TEXT = 'AKSEPTER';
const COOKIE_TIMEOUT = 3000;

export class TableScraperService {
  private async handleCookieBanner(page: Page): Promise<void> {
    try {
      await page.click(`text=${COOKIE_ACCEPT_TEXT}`, { timeout: COOKIE_TIMEOUT });
      await page.waitForTimeout(500);
    } catch (error) {
      // Cookie banner not present or click failed - this is expected on most page loads
      if (error instanceof Error && !error.message.includes('Timeout')) {
        console.warn('Cookie banner handling failed:', error.message);
      }
    }
  }

  /**
   * Scrapes a league table from a tournament URL
   */
  async scrapeLeagueTable(tournamentUrl: string): Promise<LeagueTable | null> {
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.goto(tournamentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.handleCookieBanner(page);

      // Click on "Tabell" tab if it exists
      try {
        await page.click('text=Tabell', { timeout: 3000 });
        await page.waitForTimeout(1000);
      } catch {
        // Tab might not exist or already on table view
      }

      // Wait for page content to load
      await page.waitForTimeout(3000);

      // Extract tournament name and table data using a serializable function string
      const data = await page.evaluate(`
        (function() {
          // Get tournament name from page title or header
          var titleEl = document.querySelector('h1, .tournament-name, title');
          var tournamentName = titleEl ? (titleEl.textContent || '').trim() : 'Ukjent turnering';

          // Clean up title
          if (tournamentName.indexOf('|') !== -1) {
            tournamentName = tournamentName.split('|')[0].trim();
          }
          // Remove "Turnering," prefix
          if (tournamentName.indexOf('Turnering,') === 0) {
            tournamentName = tournamentName.substring(10).trim();
          }

          // Find the standings table (exclude cookie banner tables)
          var tables = document.querySelectorAll('table:not([role="presentation"])');
          var rows = [];

          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var headerRow = table.querySelector('thead tr, tr:first-child');
            var headerText = headerRow ? (headerRow.textContent || '').toLowerCase() : '';

            // Check if this looks like a standings table (columns: nr, lag, k, v, u, t, mål, p)
            if (headerText.indexOf('lag') !== -1 && headerText.indexOf('mål') !== -1) {
              var bodyRows = table.querySelectorAll('tbody tr');
              if (bodyRows.length === 0) {
                bodyRows = table.querySelectorAll('tr');
              }

              for (var j = 0; j < bodyRows.length; j++) {
                var row = bodyRows[j];
                // Skip header rows
                if (row.querySelector('th')) continue;

                var cells = row.querySelectorAll('td');
                if (cells.length >= 7) {
                  var getText = function(cell) { return cell ? (cell.textContent || '').trim() : ''; };
                  var getNum = function(cell) { return parseInt(getText(cell)) || 0; };

                  // Parse goals (format: "123-456")
                  var goalsText = getText(cells[6]) || getText(cells[5]);
                  var goalsParts = goalsText.split('-');
                  var goalsFor = parseInt((goalsParts[0] || '').trim()) || 0;
                  var goalsAgainst = parseInt((goalsParts[1] || '').trim()) || 0;

                  rows.push({
                    position: getNum(cells[0]) || j + 1,
                    team: getText(cells[1]),
                    played: getNum(cells[2]),
                    won: getNum(cells[3]),
                    drawn: getNum(cells[4]),
                    lost: getNum(cells[5]),
                    goalsFor: goalsFor,
                    goalsAgainst: goalsAgainst,
                    points: getNum(cells[7]) || getNum(cells[cells.length - 1])
                  });
                }
              }

              if (rows.length > 0) break;
            }
          }

          return { tournamentName: tournamentName, rows: rows };
        })()
      `) as { tournamentName: string; rows: TableRow[] };

      if (data.rows.length === 0) {
        return null;
      }

      return {
        tournamentName: data.tournamentName,
        tournamentUrl,
        rows: data.rows,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Failed to scrape table from ${tournamentUrl}:`, error);
      return null;
    } finally {
      await browser.close();
    }
  }

  /**
   * Scrapes tables for multiple tournaments
   */
  async scrapeMultipleTables(tournamentUrls: string[]): Promise<LeagueTable[]> {
    const tables: LeagueTable[] = [];

    for (const url of tournamentUrls) {
      const table = await this.scrapeLeagueTable(url);
      if (table) {
        tables.push(table);
      }
    }

    return tables;
  }
}
