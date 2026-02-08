import { chromium, type Browser, type Page } from 'playwright'
import type { Team, MatchLink } from '../types/index.js'
import type { MatchPlayerData, PlayerMatchStats } from '../types/player-stats.js'
import { HandballUrlService } from './handball-url.service.js'

const COOKIE_TIMEOUT = 1500
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

export class HandballScraper {
  private urlService = new HandballUrlService()
  private browser: Browser | null = null

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
    }
  }

  private async tryClick(page: Page, selector: string, timeout: number): Promise<boolean> {
    const clicked = await page
      .click(selector, { timeout })
      .then(() => true)
      .catch(() => false)
    if (clicked) await page.waitForTimeout(500)
    return clicked
  }

  private async handleCookieBanner(page: Page): Promise<void> {
    await page.waitForTimeout(COOKIE_TIMEOUT)
    await page
      .evaluate(() => {
        const wrapper = document.getElementById('cookie-information-template-wrapper')
        if (wrapper) wrapper.remove()
        const backdrop = document.querySelector('.coi-banner__page-overlay')
        if (backdrop) backdrop.remove()
      })
      .catch(() => {})
  }

  async scrapeTeamPage(team: Team): Promise<TeamScrapingResult> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      const url = this.urlService.buildTeamUrl(team.lagid)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)
      await page.waitForTimeout(3000)

      const data = await page.evaluate(
        ({ kampnrRegex }: { kampnrRegex: string }) => {
          const matchLinks: Array<{
            kampnr: string
            kampUrl?: string
            hjemmelagUrl?: string
            bortelagUrl?: string
            hasBeenPlayed: boolean
          }> = []
          const tournamentLinks: Array<{ name: string; url: string }> = []

          const rows = document.querySelectorAll('tr')
          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length === 0) return

            let kampnr = ''
            let kampUrl = ''
            let hjemmelagUrl = ''
            let bortelagUrl = ''

            const rowText = row.textContent
            const hasResult = rowText ? /\d+\s*[-–]\s*\d+/.test(rowText) : false

            cells.forEach((cell) => {
              const text = cell.textContent?.trim()
              if (text && new RegExp(kampnrRegex).test(text)) {
                kampnr = text
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
              matchLinks.push({
                kampnr,
                kampUrl,
                hjemmelagUrl,
                bortelagUrl,
                hasBeenPlayed: hasResult,
              })
            }
          })

          document.querySelectorAll('a[href*="turnid="]').forEach((anchor) => {
            const href = anchor.getAttribute('href')
            const text = anchor.textContent?.trim()
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

  async scrapeLeagueTable(tournamentUrl: string): Promise<LeagueTable | null> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(tournamentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)

      await this.tryClick(page, 'text=Tabell', 3000)
      await page.waitForTimeout(2000)

      const data = await page.evaluate((): { tournamentName: string | null; rows: TableRow[] } => {
        const titleEl = document.querySelector('h1, .tournament-name, title')
        const rawTournamentName = titleEl?.textContent?.trim()
        if (!rawTournamentName) return { tournamentName: null, rows: [] }

        let tournamentName = rawTournamentName
        if (tournamentName.includes('|')) tournamentName = tournamentName.split('|')[0].trim()
        if (tournamentName.startsWith('Turnering,'))
          tournamentName = tournamentName.substring(10).trim()

        const tables = document.querySelectorAll('table:not([role="presentation"])')
        const rows: TableRow[] = []

        for (let i = 0; i < tables.length; i++) {
          const table = tables[i]
          const headerRow = table.querySelector('thead tr, tr:first-child')
          const headerText = headerRow?.textContent?.toLowerCase()
          if (!headerText) continue

          if (headerText.includes('lag') && headerText.includes('mål')) {
            let bodyRows = table.querySelectorAll('tbody tr')
            if (bodyRows.length === 0) bodyRows = table.querySelectorAll('tr')

            for (let j = 0; j < bodyRows.length; j++) {
              const row = bodyRows[j]
              if (row.querySelector('th')) continue
              const cells = row.querySelectorAll('td')
              if (cells.length >= 7) {
                const teamName = cells[1]?.textContent?.trim()
                if (!teamName) continue

                const parseCell = (cell: Element | null): number => {
                  const text = cell?.textContent?.trim()
                  if (!text) return 0
                  const parsed = parseInt(text)
                  return Number.isNaN(parsed) ? 0 : parsed
                }

                const goalsCell = cells[6]?.textContent?.trim()
                const goalsText = goalsCell ? goalsCell : cells[5]?.textContent?.trim()
                const goalsParts = goalsText ? goalsText.split('-') : []

                const positionValue = parseCell(cells[0])
                const position = positionValue > 0 ? positionValue : j + 1

                const pointsFromCell7 = parseCell(cells[7])
                const pointsFromLastCell = parseCell(cells[cells.length - 1])
                const points = pointsFromCell7 > 0 ? pointsFromCell7 : pointsFromLastCell

                const goalsForText = goalsParts[0]?.trim()
                const goalsAgainstText = goalsParts[1]?.trim()
                const goalsFor = goalsForText ? parseInt(goalsForText) : 0
                const goalsAgainst = goalsAgainstText ? parseInt(goalsAgainstText) : 0

                rows.push({
                  position,
                  team: teamName,
                  played: parseCell(cells[2]),
                  won: parseCell(cells[3]),
                  drawn: parseCell(cells[4]),
                  lost: parseCell(cells[5]),
                  goalsFor: Number.isNaN(goalsFor) ? 0 : goalsFor,
                  goalsAgainst: Number.isNaN(goalsAgainst) ? 0 : goalsAgainst,
                  points,
                })
              }
            }
            if (rows.length > 0) break
          }
        }
        return { tournamentName, rows }
      })

      if (!data.tournamentName || data.rows.length === 0) return null

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

  async fullRefresh(
    teams: Team[],
    concurrency = 3,
    onProgress?: (step: string, detail: string) => void
  ): Promise<FullRefreshResult> {
    const matchLinksPerTeam = new Map<string, Map<string, MatchLink>>()
    const allTournamentLinks = new Map<string, string>()

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

  async scrapeMatchStats(matchUrl: string, matchId: string): Promise<MatchPlayerData | null> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(matchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)
      await page.waitForTimeout(2000)

      const data = await page.evaluate(() => {
        const result: {
          homeTeamName: string
          awayTeamName: string
          homeTeamId: string
          awayTeamId: string
          homeScore: number
          awayScore: number
          matchDate: string
          tournament: string
          homeTeamStats: Array<{
            playerName: string
            jerseyNumber: number | undefined
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
          }>
          awayTeamStats: Array<{
            playerName: string
            jerseyNumber: number | undefined
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
          }>
        } = {
          homeTeamName: '',
          awayTeamName: '',
          homeTeamId: '',
          awayTeamId: '',
          homeScore: 0,
          awayScore: 0,
          matchDate: '',
          tournament: '',
          homeTeamStats: [],
          awayTeamStats: [],
        }

        const parseScore = (text: string | undefined): number => {
          if (!text) return 0
          const match = text.match(/(\d+)/)
          return match ? parseInt(match[1]) : 0
        }

        const parseStatNum = (cell: Element | null): number => {
          const text = cell?.textContent?.trim()
          if (!text) return 0
          const parsed = parseInt(text)
          return Number.isNaN(parsed) ? 0 : parsed
        }

        const headerTables = document.querySelectorAll('table[width="100%"]')
        headerTables.forEach((table) => {
          const headers = table.querySelectorAll('th')
          headers.forEach((th, idx) => {
            const link = th.querySelector('a[href*="lagid="]')
            if (!link) return

            const teamName = link.textContent?.trim()
            const href = link.getAttribute('href')
            if (!teamName || !href) return

            const lagidMatch = href.match(/lagid=(\d+)/)
            if (!lagidMatch) return
            const teamId = lagidMatch[1]

            const scoreIdx = idx - 1
            if (scoreIdx >= 0) {
              const scoreTh = headers[scoreIdx]
              const score = parseScore(scoreTh?.textContent?.trim())

              if (!result.homeTeamName) {
                result.homeTeamName = teamName
                result.homeTeamId = teamId
                result.homeScore = score
              } else if (!result.awayTeamName) {
                result.awayTeamName = teamName
                result.awayTeamId = teamId
                result.awayScore = score
              }
            }
          })
        })

        if (!result.homeTeamName) {
          const teamLinks = document.querySelectorAll('a[href*="lagid="]')
          const seenTeams = new Set<string>()
          teamLinks.forEach((link) => {
            const teamName = link.textContent?.trim()
            const href = link.getAttribute('href')
            if (!teamName || !href) return

            const lagidMatch = href.match(/lagid=(\d+)/)
            if (!lagidMatch) return
            const teamId = lagidMatch[1]

            if (!seenTeams.has(teamId)) {
              seenTeams.add(teamId)
              if (!result.homeTeamName) {
                result.homeTeamName = teamName
                result.homeTeamId = teamId
              } else if (!result.awayTeamName) {
                result.awayTeamName = teamName
                result.awayTeamId = teamId
              }
            }
          })
        }

        if (result.homeScore === 0) {
          const statsTable = document.querySelector('table.stats-table')
          if (statsTable) {
            const rows = statsTable.querySelectorAll('tbody tr')
            rows.forEach((row, idx) => {
              const cells = row.querySelectorAll('td')
              if (cells.length >= 2) {
                const score = parseStatNum(cells[1])
                if (idx === 0) result.homeScore = score
                else if (idx === 1) result.awayScore = score
              }
            })
          }
        }

        const dateMatches = document.body.innerHTML.match(/(\d{2}\.\d{2}\.\d{4})\s+kl\./i)
        if (dateMatches) result.matchDate = dateMatches[1]

        const tournamentLink = document.querySelector('a[href*="turnid="]')
        const tournamentText = tournamentLink?.textContent?.trim()
        if (tournamentText) result.tournament = tournamentText

        const playerTables = document.querySelectorAll('table.player-table')
        const uniqueTables = new Map<string, Element>()

        playerTables.forEach((table) => {
          const firstPlayer = table
            .querySelector('tr:nth-child(2) td:nth-child(2)')
            ?.textContent?.trim()
          if (firstPlayer && !uniqueTables.has(firstPlayer)) {
            uniqueTables.set(firstPlayer, table)
          }
        })

        const tables = Array.from(uniqueTables.values())
        tables.forEach((table, tableIndex) => {
          const rows = table.querySelectorAll('tr')
          const playerStats: Array<{
            playerName: string
            jerseyNumber: number | undefined
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
          }> = []

          rows.forEach((row) => {
            const cells = row.querySelectorAll('td')
            if (cells.length < 6) return

            const nrText = cells[0]?.textContent?.trim()
            if (!nrText) return
            if (nrText.toLowerCase().includes('leder')) return

            const nr = parseInt(nrText)
            if (Number.isNaN(nr)) return

            const playerName = cells[1]?.textContent?.trim()
            if (!playerName) return
            if (playerName.toLowerCase() === 'total' || playerName === 'Spiller') return

            playerStats.push({
              playerName,
              jerseyNumber: nr,
              goals: parseStatNum(cells[2]),
              penaltyGoals: parseStatNum(cells[3]),
              twoMinutes: parseStatNum(cells[5]),
              yellowCards: parseStatNum(cells[4]),
              redCards: parseStatNum(cells[6]),
            })
          })

          if (playerStats.length > 0) {
            if (tableIndex === 0) {
              result.homeTeamStats = playerStats
            } else if (tableIndex === 1) {
              result.awayTeamStats = playerStats
            }
          }
        })

        return result
      })

      if (!data.homeTeamName || !data.awayTeamName) {
        console.error(`Could not extract team names from ${matchUrl}`)
        return null
      }

      if (data.homeTeamStats.length === 0 && data.awayTeamStats.length === 0) {
        console.error(`No player stats found in ${matchUrl}`)
        return null
      }

      const generatePlayerId = (name: string): string => {
        const normalized = name.toLowerCase().trim().replace(/\s+/g, ' ')
        let hash = 0
        for (let i = 0; i < normalized.length; i++) {
          const char = normalized.charCodeAt(i)
          hash = (hash << 5) - hash + char
          hash = hash & hash
        }
        return Math.abs(hash).toString(36)
      }

      const mapStats = (stats: typeof data.homeTeamStats): PlayerMatchStats[] => {
        return stats.map((s) => ({
          playerId: generatePlayerId(s.playerName),
          playerName: s.playerName,
          jerseyNumber: s.jerseyNumber,
          goals: s.goals,
          penaltyGoals: s.penaltyGoals,
          twoMinutes: s.twoMinutes,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
        }))
      }

      return {
        matchId,
        matchDate: data.matchDate,
        matchUrl,
        homeTeamId: data.homeTeamId,
        homeTeamName: data.homeTeamName,
        awayTeamId: data.awayTeamId,
        awayTeamName: data.awayTeamName,
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        tournament: data.tournament,
        homeTeamStats: mapStats(data.homeTeamStats),
        awayTeamStats: mapStats(data.awayTeamStats),
        scrapedAt: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Failed to scrape match stats from ${matchUrl}:`, error)
      return null
    } finally {
      await page.close()
    }
  }

  private async extractPlayedMatchesFromPage(
    page: Page,
    kampnrRegex: string
  ): Promise<Array<{ matchId: string; matchUrl: string }>> {
    return page.evaluate(
      ({ regex }: { regex: string }) => {
        const results: Array<{ matchId: string; matchUrl: string }> = []
        const seen = new Set<string>()

        const rows = document.querySelectorAll('tr')
        rows.forEach((row) => {
          const rowText = row.textContent
          if (!rowText) return
          const hasScore = /\d+\s*[-–]\s*\d+/.test(rowText)
          if (!hasScore) return

          let kampnr = ''
          let kampUrl = ''

          row.querySelectorAll('a').forEach((link) => {
            const text = link.textContent?.trim()
            const href = link.getAttribute('href')
            if (!text || !href) return

            if (new RegExp(regex).test(text) && href.includes('/kamp/')) {
              kampnr = text
              kampUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`
            }
          })

          if (!kampnr || !kampUrl) {
            const cells = row.querySelectorAll('td')
            cells.forEach((cell) => {
              const text = cell.textContent?.trim()
              if (text && new RegExp(regex).test(text)) {
                kampnr = text
              }
              cell.querySelectorAll('a').forEach((link) => {
                const href = link.getAttribute('href')
                if (href && (href.includes('kampoppgjoer') || href.includes('/kamp/'))) {
                  kampUrl = href.startsWith('http') ? href : `https://www.handball.no${href}`
                }
              })
            })
          }

          if (kampnr && kampUrl && !seen.has(kampnr)) {
            seen.add(kampnr)
            results.push({ matchId: kampnr, matchUrl: kampUrl })
          }
        })

        return results
      },
      { regex: kampnrRegex }
    )
  }

  async scrapeTournamentPlayedMatches(
    tournamentUrl: string
  ): Promise<Array<{ matchId: string; matchUrl: string }>> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(tournamentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)
      await page.waitForTimeout(3000)

      const extractWithRecovery = async (): Promise<
        Array<{ matchId: string; matchUrl: string }>
      > => {
        try {
          return await this.extractPlayedMatchesFromPage(page, KAMPNR_REGEX.source)
        } catch {
          return []
        }
      }

      const tabSelectors = ['text="Alle kamper"', 'text="Kamper"', 'text="Siste kamper"']
      for (const selector of tabSelectors) {
        const clicked = await this.tryClick(page, selector, 3000)
        if (clicked) {
          await page.waitForTimeout(3000)
          const matches = await extractWithRecovery()
          if (matches.length > 0) {
            return matches
          }
        }
      }

      // Fallback: try "Terminliste" which shows all matches (played and upcoming)
      const terminlisteClicked = await this.tryClick(page, 'text="Terminliste"', 3000)
      if (terminlisteClicked) {
        await page.waitForTimeout(3000)
        return extractWithRecovery()
      }

      return extractWithRecovery()
    } catch (error) {
      console.error(`Failed to scrape tournament matches from ${tournamentUrl}:`, error)
      return []
    } finally {
      await page.close().catch(() => {})
    }
  }

  async scrapeAllTournamentPlayedMatches(
    tournamentUrls: Map<string, string>,
    concurrency = 3,
    onProgress?: (tournamentName: string) => void
  ): Promise<Array<{ matchId: string; matchUrl: string }>> {
    const allMatches = new Map<string, { matchId: string; matchUrl: string }>()

    const entries = Array.from(tournamentUrls.entries())
    const chunks: [string, string][][] = []
    for (let i = 0; i < entries.length; i += concurrency) {
      chunks.push(entries.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async ([name, url]) => {
          onProgress?.(name)
          return this.scrapeTournamentPlayedMatches(url)
        })
      )

      for (const matches of results) {
        for (const match of matches) {
          if (!allMatches.has(match.matchId)) {
            allMatches.set(match.matchId, match)
          }
        }
      }
    }

    return Array.from(allMatches.values())
  }

  async scrapeTournamentTeams(
    tournamentUrl: string
  ): Promise<Array<{ teamName: string; teamUrl: string; lagId: string }>> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(tournamentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.handleCookieBanner(page)
      await page.waitForTimeout(2000)

      const teams = await page.evaluate(() => {
        const results: Array<{ teamName: string; teamUrl: string; lagId: string }> = []
        const seen = new Set<string>()

        document.querySelectorAll('a[href*="lagid="]').forEach((link) => {
          const href = link.getAttribute('href')
          if (!href) return

          const teamName = link.textContent?.trim()
          if (!teamName) return

          const match = href.match(/lagid=(\d+)/)
          if (!match) return

          const lagId = match[1]
          if (seen.has(lagId)) return
          seen.add(lagId)

          const url = href.startsWith('http') ? href : `https://www.handball.no${href}`
          results.push({
            teamName,
            teamUrl: url,
            lagId,
          })
        })

        return results
      })

      return teams
    } catch (error) {
      console.error(`Failed to scrape tournament teams from ${tournamentUrl}:`, error)
      return []
    } finally {
      await page.close()
    }
  }

  async scrapeTeamMatches(lagId: string): Promise<Array<{ matchId: string; matchUrl: string }>> {
    const result = await this.scrapeTeamPage({
      name: 'temp',
      lagid: lagId,
      seasonId: '',
      color: '',
    })

    const matches: Array<{ matchId: string; matchUrl: string }> = []
    for (const [kampnr, link] of result.matchLinks) {
      if (link.kampUrl && link.hasBeenPlayed) {
        matches.push({
          matchId: kampnr,
          matchUrl: link.kampUrl,
        })
      }
    }

    return matches
  }

  async scrapeAllTournamentMatches(
    tournamentUrls: Map<string, string>,
    concurrency = 3,
    onProgress?: (step: string, detail: string) => void
  ): Promise<Array<{ matchId: string; matchUrl: string }>> {
    const allMatches = new Map<string, { matchId: string; matchUrl: string }>()
    const scrapedTeams = new Set<string>()
    const failedTeams: Array<{ teamName: string; lagId: string; error: string }> = []

    const allTeams: Array<{ teamName: string; lagId: string; tournament: string }> = []

    for (const [tournamentName, tournamentUrl] of tournamentUrls) {
      onProgress?.('tournament', tournamentName)

      try {
        const teams = await this.scrapeTournamentTeams(tournamentUrl)
        onProgress?.('teams', `${teams.length} lag i ${tournamentName}`)

        for (const team of teams) {
          if (!scrapedTeams.has(team.lagId)) {
            scrapedTeams.add(team.lagId)
            allTeams.push({ ...team, tournament: tournamentName })
          }
        }
      } catch (error) {
        onProgress?.('error', `Feil ved henting av lag fra ${tournamentName}: ${error}`)
      }
    }

    onProgress?.('info', `Totalt ${allTeams.length} unike lag å scrape`)

    const chunks: (typeof allTeams)[] = []
    for (let i = 0; i < allTeams.length; i += concurrency) {
      chunks.push(allTeams.slice(i, i + concurrency))
    }

    let completed = 0
    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map(async (team) => {
          try {
            const matches = await this.scrapeTeamMatches(team.lagId)
            completed++
            onProgress?.(
              'team',
              `[${completed}/${allTeams.length}] ${team.teamName}: ${matches.length} kamper`
            )
            return { team, matches, error: null }
          } catch (error) {
            completed++
            const errorMsg = error instanceof Error ? error.message : String(error)
            onProgress?.(
              'error',
              `[${completed}/${allTeams.length}] ${team.teamName}: FEIL - ${errorMsg.substring(0, 50)}`
            )
            return { team, matches: [], error: errorMsg }
          }
        })
      )

      for (const { team, matches, error } of results) {
        if (error) {
          failedTeams.push({ teamName: team.teamName, lagId: team.lagId, error })
        }
        for (const match of matches) {
          if (!allMatches.has(match.matchId)) {
            allMatches.set(match.matchId, match)
          }
        }
      }
    }

    if (failedTeams.length > 0) {
      onProgress?.('warning', `${failedTeams.length} lag feilet`)
    }
    onProgress?.('done', `Totalt ${allMatches.size} unike kamper`)
    return Array.from(allMatches.values())
  }

  async scrapeMultipleMatchStats(
    matches: Array<{ matchId: string; matchUrl: string }>,
    concurrency = 2,
    onProgress?: (current: number, total: number, matchId: string) => void
  ): Promise<{ results: MatchPlayerData[]; noStats: string[] }> {
    const results: MatchPlayerData[] = []
    const noStats: string[] = []
    const chunks: (typeof matches)[] = []

    for (let i = 0; i < matches.length; i += concurrency) {
      chunks.push(matches.slice(i, i + concurrency))
    }

    let processed = 0
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(async ({ matchId, matchUrl }) => {
          const result = await this.scrapeMatchStats(matchUrl, matchId)
          processed++
          onProgress?.(processed, matches.length, matchId)
          return { matchId, result }
        })
      )

      for (const { matchId, result } of chunkResults) {
        if (result) {
          results.push(result)
        } else {
          noStats.push(matchId)
        }
      }
    }

    return { results, noStats }
  }
}
