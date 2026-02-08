/**
 * Service for scraping match results from handball.no
 * Uses Playwright since the site requires JavaScript rendering
 */

import { chromium, type Page } from 'playwright'

export interface MatchResult {
  matchId: string
  homeScore: number | null
  awayScore: number | null
  result: string // "31-23" format or "-" if not available
}

interface ResultScraperOptions {
  delayMs?: number
  timeoutMs?: number
}

const COOKIE_TIMEOUT = 1500

export class ResultScraperService {
  private readonly delayMs: number
  private readonly timeoutMs: number

  constructor(options: ResultScraperOptions = {}) {
    this.delayMs = options.delayMs ?? 500 // Rate limiting between pages
    this.timeoutMs = options.timeoutMs ?? 15000
  }

  private async handleCookieBanner(page: Page): Promise<void> {
    await page.waitForTimeout(COOKIE_TIMEOUT)
    await page
      .evaluate(() => {
        document.getElementById('cookie-information-template-wrapper')?.remove()
        document.querySelector('.coi-banner__page-overlay')?.remove()
      })
      .catch(() => {})
  }

  /**
   * Fetches result for a single match from its URL using an existing page
   */
  private async fetchMatchResultFromPage(
    page: Page,
    matchUrl: string
  ): Promise<MatchResult | null> {
    const matchId = this.extractMatchId(matchUrl)
    if (!matchId) {
      return null
    }

    try {
      await page.goto(matchUrl, { waitUntil: 'domcontentloaded', timeout: this.timeoutMs })

      // Wait for Angular to render
      await page.waitForTimeout(2000)

      // Extract scores from page text
      // Format is: "27   (12)	Hjemmelag" and "22   (8)	Bortelag"
      const scores = await page.evaluate(() => {
        const bodyText = document.body.innerText
        const lines = bodyText.split('\n')

        // Look for score pattern: number (number) team-name
        // e.g., "27   (12)	Fjellhammer 2"
        const scorePattern = /^(\d{1,2})\s+\(\d+\)\s+.+$/
        const foundScores: number[] = []

        for (const line of lines) {
          const trimmed = line.trim()
          const match = trimmed.match(scorePattern)
          if (match) {
            foundScores.push(parseInt(match[1], 10))
            if (foundScores.length === 2) break
          }
        }

        if (foundScores.length === 2) {
          return { homeScore: foundScores[0], awayScore: foundScores[1] }
        }

        return { homeScore: null, awayScore: null }
      })

      return {
        matchId,
        homeScore: scores.homeScore,
        awayScore: scores.awayScore,
        result:
          scores.homeScore !== null && scores.awayScore !== null
            ? `${scores.homeScore}-${scores.awayScore}`
            : '-',
      }
    } catch {
      return null
    }
  }

  /**
   * Fetches results for multiple matches, reusing browser instance
   */
  async fetchMultipleResults(
    matchUrls: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, MatchResult>> {
    const results = new Map<string, MatchResult>()

    if (matchUrls.length === 0) {
      return results
    }

    const browser = await chromium.launch({ headless: true })

    try {
      const page = await browser.newPage()

      // Handle cookie banner on first navigation
      await page.goto(matchUrls[0], { waitUntil: 'domcontentloaded', timeout: this.timeoutMs })
      await this.handleCookieBanner(page)

      for (let i = 0; i < matchUrls.length; i++) {
        const url = matchUrls[i]
        onProgress?.(i + 1, matchUrls.length)

        const result = await this.fetchMatchResultFromPage(page, url)
        if (result && result.result !== '-') {
          results.set(result.matchId, result)
        }

        // Small delay between requests
        if (i < matchUrls.length - 1) {
          await page.waitForTimeout(this.delayMs)
        }
      }

      await browser.close()
    } catch (error) {
      await browser.close()
      throw error
    }

    return results
  }

  /**
   * Extracts match ID from URL
   */
  private extractMatchId(url: string): string | null {
    const match = url.match(/matchid=(\d+)/)
    return match ? match[1] : null
  }
}
