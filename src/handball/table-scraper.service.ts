/**
 * Service for scraping league tables from handball.no
 * Optimized to reuse browser instance across multiple tables
 */

import { chromium, type Browser, type Page } from 'playwright'

export interface TableRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export interface LeagueTable {
  tournamentName: string
  tournamentUrl: string
  rows: TableRow[]
  updatedAt: string
}

const COOKIE_ACCEPT_TEXT = 'AKSEPTER'
const COOKIE_TIMEOUT = 3000

export class TableScraperService {
  private browser: Browser | null = null
  private cookieHandled = false

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true })
    }
    return this.browser
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.cookieHandled = false
    }
  }

  private async handleCookieBanner(page: Page): Promise<void> {
    if (this.cookieHandled) return

    try {
      await page.click(`text=${COOKIE_ACCEPT_TEXT}`, { timeout: COOKIE_TIMEOUT })
      await page.waitForTimeout(500)
      this.cookieHandled = true
    } catch {
      this.cookieHandled = true
    }
  }

  /**
   * Scrapes a league table from a tournament URL
   */
  async scrapeLeagueTable(tournamentUrl: string): Promise<LeagueTable | null> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(tournamentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)

      // Click on "Tabell" tab if it exists
      try {
        await page.click('text=Tabell', { timeout: 3000 })
        await page.waitForTimeout(1000)
      } catch {
        // Tab might not exist or already on table view
      }

      // Wait for page content to load
      await page.waitForTimeout(2000)

      // Extract tournament name and table data
      const data = (await page.evaluate(`
        (function() {
          var titleEl = document.querySelector('h1, .tournament-name, title');
          var tournamentName = titleEl ? (titleEl.textContent || '').trim() : 'Ukjent turnering';

          if (tournamentName.indexOf('|') !== -1) {
            tournamentName = tournamentName.split('|')[0].trim();
          }
          if (tournamentName.indexOf('Turnering,') === 0) {
            tournamentName = tournamentName.substring(10).trim();
          }

          var tables = document.querySelectorAll('table:not([role="presentation"])');
          var rows = [];

          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var headerRow = table.querySelector('thead tr, tr:first-child');
            var headerText = headerRow ? (headerRow.textContent || '').toLowerCase() : '';

            if (headerText.indexOf('lag') !== -1 && headerText.indexOf('mål') !== -1) {
              var bodyRows = table.querySelectorAll('tbody tr');
              if (bodyRows.length === 0) {
                bodyRows = table.querySelectorAll('tr');
              }

              for (var j = 0; j < bodyRows.length; j++) {
                var row = bodyRows[j];
                if (row.querySelector('th')) continue;

                var cells = row.querySelectorAll('td');
                if (cells.length >= 7) {
                  var getText = function(cell) { return cell ? (cell.textContent || '').trim() : ''; };
                  var getNum = function(cell) { return parseInt(getText(cell)) || 0; };

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
      `)) as { tournamentName: string; rows: TableRow[] }

      if (data.rows.length === 0) {
        return null
      }

      return {
        tournamentName: data.tournamentName,
        tournamentUrl,
        rows: data.rows,
        updatedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Failed to scrape table from ${tournamentUrl}:`, error)
      return null
    } finally {
      await page.close()
    }
  }

  /**
   * Scrapes tables for multiple tournaments in parallel
   */
  async scrapeMultipleTables(
    tournamentUrls: Map<string, string>,
    concurrency = 3,
    onProgress?: (completed: number, total: number, name: string) => void
  ): Promise<LeagueTable[]> {
    const entries = Array.from(tournamentUrls.entries())
    const tables: LeagueTable[] = []
    let completed = 0

    // Process in parallel batches
    const chunks: [string, string][][] = []
    for (let i = 0; i < entries.length; i += concurrency) {
      chunks.push(entries.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async ([url, name]) => {
          const table = await this.scrapeLeagueTable(url)
          completed++
          onProgress?.(completed, entries.length, name)
          return table
        })
      )

      for (const table of results) {
        if (table) {
          tables.push(table)
        }
      }
    }

    return tables
  }
}
