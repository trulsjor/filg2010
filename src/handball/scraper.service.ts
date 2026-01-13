import { chromium, type Browser, type Page } from 'playwright'
import type { Team, MatchLink } from '../types/index.js'
import { HandballUrlService } from './handball-url.service.js'

const COOKIE_ACCEPT_TEXT = 'AKSEPTER'
const COOKIE_TIMEOUT = 3000
const KAMPNR_REGEX = /^\d{9,}/

export interface TeamScrapingResult {
  matchLinks: Map<string, MatchLink>
  tournamentLinks: Map<string, string>
}

/**
 * Optimized scraper service - reuses browser instance and combines operations
 */
export class ScraperService {
  private urlService = new HandballUrlService()
  private browser: Browser | null = null
  private cookieHandled = false

  /**
   * Gets or creates browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true })
    }
    return this.browser
  }

  /**
   * Closes browser if open
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.cookieHandled = false
    }
  }

  /**
   * Handles cookie banner (only once per session)
   */
  private async handleCookieBanner(page: Page): Promise<void> {
    if (this.cookieHandled) return

    try {
      await page.click(`text=${COOKIE_ACCEPT_TEXT}`, { timeout: COOKIE_TIMEOUT })
      await page.waitForTimeout(500)
      this.cookieHandled = true
    } catch {
      // Cookie banner not present
      this.cookieHandled = true
    }
  }

  /**
   * Scrapes both match links AND tournament links from a single page visit
   */
  async scrapeTeamPage(team: Team): Promise<TeamScrapingResult> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      const url = this.urlService.buildTeamUrl(team.lagid)
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await this.handleCookieBanner(page)

      // Extract both match links and tournament links in one evaluate call
      const data = await page.evaluate(
        ({ kampnrRegex }) => {
          const matchLinks: Array<{
            kampnr: string
            kampUrl?: string
            hjemmelagUrl?: string
            bortelagUrl?: string
          }> = []

          const tournamentLinks: Array<{ name: string; url: string }> = []

          // Extract match links from table rows
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
                  if (!hjemmelagUrl) {
                    hjemmelagUrl = fullUrl
                  } else if (!bortelagUrl) {
                    bortelagUrl = fullUrl
                  }
                }
              })
            })

            if (kampnr) {
              matchLinks.push({
                kampnr,
                kampUrl: kampUrl || undefined,
                hjemmelagUrl: hjemmelagUrl || undefined,
                bortelagUrl: bortelagUrl || undefined,
              })
            }
          })

          // Extract tournament links
          const anchors = document.querySelectorAll('a[href*="turnid="]')
          anchors.forEach((anchor) => {
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

      // Convert to Maps
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

      return {
        matchLinks: matchLinkMap,
        tournamentLinks: tournamentLinkMap,
      }
    } finally {
      await page.close()
    }
  }

  /**
   * Scrapes all teams in parallel, combining results
   */
  async scrapeAllTeams(
    teams: Team[],
    concurrency = 3
  ): Promise<{
    matchLinksPerTeam: Map<string, Map<string, MatchLink>>
    allTournamentLinks: Map<string, string>
  }> {
    const matchLinksPerTeam = new Map<string, Map<string, MatchLink>>()
    const allTournamentLinks = new Map<string, string>()

    // Process teams with limited concurrency
    const chunks: Team[][] = []
    for (let i = 0; i < teams.length; i += concurrency) {
      chunks.push(teams.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (team) => {
          const result = await this.scrapeTeamPage(team)
          return { team, result }
        })
      )

      for (const { team, result } of results) {
        matchLinksPerTeam.set(team.lagid, result.matchLinks)

        // Merge tournament links
        for (const [name, url] of result.tournamentLinks) {
          if (!allTournamentLinks.has(name)) {
            allTournamentLinks.set(name, url)
          }
        }
      }
    }

    return { matchLinksPerTeam, allTournamentLinks }
  }

  // Legacy methods for backwards compatibility
  async scrapeMatchLinks(lagid: string): Promise<Map<string, MatchLink>> {
    const team: Team = { lagid, name: '', seasonId: '', color: '' }
    const result = await this.scrapeTeamPage(team)
    return result.matchLinks
  }

  async scrapeTournamentLinks(teams: Team[]): Promise<Map<string, string>> {
    const { allTournamentLinks } = await this.scrapeAllTeams(teams, 1)
    return allTournamentLinks
  }
}
