/**
 * Unified scraper service for handball.no
 * Handles match links, tournament links, and league tables
 * Optimized with browser reuse and parallel execution
 */

import { chromium, type Browser, type Page } from 'playwright'
import type { Team, MatchLink } from '../types/index.js'
import { HandballUrlService } from './handball-url.service.js'

const COOKIE_ACCEPT_TEXT = 'AKSEPTER'
const COOKIE_TIMEOUT = 3000
const KAMPNR_REGEX = /^\d{9,}/

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

export interface TeamScrapingResult {
  matchLinks: Map<string, MatchLink>
  tournamentLinks: Map<string, string>
}

export interface FullRefreshResult {
  matchLinksPerTeam: Map<string, Map<string, MatchLink>>
  allTournamentLinks: Map<string, string>
  tables: LeagueTable[]
}

export class HandballScraperService {
  private urlService = new HandballUrlService()
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
   * Scrapes match links and tournament links from a team page
   */
  async scrapeTeamPage(team: Team): Promise<TeamScrapingResult> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      const url = this.urlService.buildTeamUrl(team.lagid)
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await this.handleCookieBanner(page)

      const data = await page.evaluate(
        ({ kampnrRegex }) => {
          const matchLinks: Array<{
            kampnr: string
            kampUrl?: string
            hjemmelagUrl?: string
            bortelagUrl?: string
          }> = []
          const tournamentLinks: Array<{ name: string; url: string }> = []

          // Extract match links
          const rows = document.querySelectorAll('tr')
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length === 0) return

            let kampnr = ''
            let kampUrl = ''
            let hjemmelagUrl = ''
            let bortelagUrl = ''

            cells.forEach((cell) => {
              const text = cell.textContent?.trim() || ''
              if (new RegExp(kampnrRegex).test(text)) {
                kampnr = text.trim()
              }

              const cellLinks = cell.querySelectorAll('a')
              cellLinks.forEach((link) => {
                const href = link.getAttribute('href')
                if (!href) return
                const fullUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`

                if (href.includes('kampoppgjoer') || href.includes('/kamp/')) {
                  kampUrl = fullUrl
                } else if (href.includes('lagid=') || href.includes('/lag/')) {
                  if (!hjemmelagUrl) hjemmelagUrl = fullUrl
                  else if (!bortelagUrl) bortelagUrl = fullUrl
                }
              })
            })

            if (kampnr) {
              matchLinks.push({ kampnr, kampUrl, hjemmelagUrl, bortelagUrl })
            }
          })

          // Extract tournament links
          document.querySelectorAll('a[href*="turnid="]').forEach((anchor) => {
            const href = anchor.getAttribute('href')
            const text = anchor.textContent?.trim() || ''
            if (href && text) {
              const url = href.startsWith('http') ? href : `https://www.handball.no${href}`
              tournamentLinks.push({ name: text, url })
            }
          })

          return { matchLinks, tournamentLinks }
        },
        { kampnrRegex: KAMPNR_REGEX.source }
      )

      const matchLinkMap = new Map<string, MatchLink>()
      data.matchLinks.forEach((link) => {
        const kampnr = link.kampnr.trim()
        if (!matchLinkMap.has(kampnr)) {
          matchLinkMap.set(kampnr, link)
        }
      })

      const tournamentLinkMap = new Map<string, string>()
      data.tournamentLinks.forEach((t) => {
        if (!tournamentLinkMap.has(t.name)) {
          tournamentLinkMap.set(t.name, t.url)
        }
      })

      return { matchLinks: matchLinkMap, tournamentLinks: tournamentLinkMap }
    } finally {
      await page.close()
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

      try {
        await page.click('text=Tabell', { timeout: 3000 })
        await page.waitForTimeout(1000)
      } catch {
        // Tab might not exist
      }

      await page.waitForTimeout(2000)

      const data = (await page.evaluate(`
        (function() {
          var titleEl = document.querySelector('h1, .tournament-name, title');
          var tournamentName = titleEl ? (titleEl.textContent || '').trim() : 'Ukjent';
          if (tournamentName.indexOf('|') !== -1) tournamentName = tournamentName.split('|')[0].trim();
          if (tournamentName.indexOf('Turnering,') === 0) tournamentName = tournamentName.substring(10).trim();

          var tables = document.querySelectorAll('table:not([role="presentation"])');
          var rows = [];

          for (var i = 0; i < tables.length; i++) {
            var table = tables[i];
            var headerRow = table.querySelector('thead tr, tr:first-child');
            var headerText = headerRow ? (headerRow.textContent || '').toLowerCase() : '';

            if (headerText.indexOf('lag') !== -1 && headerText.indexOf('mål') !== -1) {
              var bodyRows = table.querySelectorAll('tbody tr');
              if (bodyRows.length === 0) bodyRows = table.querySelectorAll('tr');

              for (var j = 0; j < bodyRows.length; j++) {
                var row = bodyRows[j];
                if (row.querySelector('th')) continue;
                var cells = row.querySelectorAll('td');
                if (cells.length >= 7) {
                  var getText = function(cell) { return cell ? (cell.textContent || '').trim() : ''; };
                  var getNum = function(cell) { return parseInt(getText(cell)) || 0; };
                  var goalsText = getText(cells[6]) || getText(cells[5]);
                  var goalsParts = goalsText.split('-');

                  rows.push({
                    position: getNum(cells[0]) || j + 1,
                    team: getText(cells[1]),
                    played: getNum(cells[2]),
                    won: getNum(cells[3]),
                    drawn: getNum(cells[4]),
                    lost: getNum(cells[5]),
                    goalsFor: parseInt((goalsParts[0] || '').trim()) || 0,
                    goalsAgainst: parseInt((goalsParts[1] || '').trim()) || 0,
                    points: getNum(cells[7]) || getNum(cells[cells.length - 1])
                  });
                }
              }
              if (rows.length > 0) break;
            }
          }
          return { tournamentName, rows };
        })()
      `)) as { tournamentName: string; rows: TableRow[] }

      if (data.rows.length === 0) return null

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
   * Full refresh: scrape all teams and tables in parallel
   */
  async fullRefresh(
    teams: Team[],
    concurrency = 3,
    onProgress?: (step: string, detail: string) => void
  ): Promise<FullRefreshResult> {
    const matchLinksPerTeam = new Map<string, Map<string, MatchLink>>()
    const allTournamentLinks = new Map<string, string>()

    // Step 1: Scrape all team pages in parallel
    onProgress?.('teams', `Scraping ${teams.length} teams...`)
    const chunks: Team[][] = []
    for (let i = 0; i < teams.length; i += concurrency) {
      chunks.push(teams.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (team) => {
          const result = await this.scrapeTeamPage(team)
          onProgress?.('teams', `✓ ${team.name}`)
          return { team, result }
        })
      )

      for (const { team, result } of results) {
        matchLinksPerTeam.set(team.lagid, result.matchLinks)
        for (const [name, url] of result.tournamentLinks) {
          if (!allTournamentLinks.has(name)) {
            allTournamentLinks.set(name, url)
          }
        }
      }
    }

    // Step 2: Filter out cups and scrape tables in parallel
    const leagueTournaments = new Map<string, string>()
    for (const [name, url] of allTournamentLinks) {
      if (!name.toLowerCase().includes('cup')) {
        leagueTournaments.set(name, url)
      }
    }

    onProgress?.('tables', `Scraping ${leagueTournaments.size} tables...`)
    const tables: LeagueTable[] = []
    const tableChunks: [string, string][][] = []
    const entries = Array.from(leagueTournaments.entries())

    for (let i = 0; i < entries.length; i += concurrency) {
      tableChunks.push(entries.slice(i, i + concurrency))
    }

    for (const chunk of tableChunks) {
      const results = await Promise.all(
        chunk.map(async ([name, url]) => {
          const table = await this.scrapeLeagueTable(url)
          onProgress?.('tables', `✓ ${name}`)
          return table
        })
      )
      for (const table of results) {
        if (table) tables.push(table)
      }
    }

    return { matchLinksPerTeam, allTournamentLinks, tables }
  }
}
