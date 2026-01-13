/**
 * HTTP-based table fetcher - no Playwright needed
 * Fetches league tables directly from static HTML
 */

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

interface FetcherOptions {
  delayMs?: number
  timeoutMs?: number
}

export class TableFetcherService {
  private readonly delayMs: number
  private readonly timeoutMs: number

  constructor(options: FetcherOptions = {}) {
    this.delayMs = options.delayMs ?? 500
    this.timeoutMs = options.timeoutMs ?? 15000
  }

  async fetchLeagueTable(tournamentUrl: string): Promise<LeagueTable | null> {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      const response = await fetch(tournamentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TerminlisteBot/1.0)',
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return null
      }

      const html = await response.text()
      return this.parseTableFromHtml(html, tournamentUrl)
    } catch (error) {
      console.error(`Failed to fetch ${tournamentUrl}:`, error)
      return null
    }
  }

  private parseTableFromHtml(html: string, tournamentUrl: string): LeagueTable | null {
    const rows: TableRow[] = []

    // Extract tournament name from title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    let tournamentName = titleMatch ? titleMatch[1].trim() : 'Ukjent turnering'
    if (tournamentName.includes('|')) {
      tournamentName = tournamentName.split('|')[0].trim()
    }
    if (tournamentName.startsWith('Turnering,')) {
      tournamentName = tournamentName.substring(10).trim()
    }

    // Find table rows with standings data
    // Pattern: <tr class=" "> followed by position, team, stats
    const rowPattern =
      /<tr class=" ">\s*<td class="small-1">\s*(\d+)\s*<\/td>\s*<td>\s*<a[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td class="text-right">\s*(\d+)\s*<\/td>\s*<td class="hide-block-option text-right">\s*(\d+)\s*<\/td>\s*<td class="hide-block-option text-right">\s*(\d+)\s*<\/td>\s*<td class="hide-block-option text-right">\s*(\d+)\s*<\/td>\s*<td class="hide-for-small hide-block-option text-right">\s*(\d+)\s*-\s*(\d+)\s*<\/td>\s*<td class="text-right">\s*(\d+)/g

    let match
    const seenTeams = new Set<string>()
    while ((match = rowPattern.exec(html)) !== null) {
      const team = this.decodeHtmlEntities(match[2].trim())
      if (seenTeams.has(team)) continue
      seenTeams.add(team)

      rows.push({
        position: parseInt(match[1], 10),
        team,
        played: parseInt(match[3], 10),
        won: parseInt(match[4], 10),
        drawn: parseInt(match[5], 10),
        lost: parseInt(match[6], 10),
        goalsFor: parseInt(match[7], 10),
        goalsAgainst: parseInt(match[8], 10),
        points: parseInt(match[9], 10),
      })
    }

    if (rows.length === 0) {
      return null
    }

    return {
      tournamentName,
      tournamentUrl,
      rows,
      updatedAt: new Date().toISOString(),
    }
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&#229;/g, 'å')
      .replace(/&#248;/g, 'ø')
      .replace(/&#230;/g, 'æ')
      .replace(/&#197;/g, 'Å')
      .replace(/&#216;/g, 'Ø')
      .replace(/&#198;/g, 'Æ')
      .replace(/&amp;/g, '&')
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async fetchMultipleTables(urls: Map<string, string>): Promise<LeagueTable[]> {
    const tables: LeagueTable[] = []
    const entries = Array.from(urls.entries())

    for (let i = 0; i < entries.length; i++) {
      const [url, name] = entries[i]
      console.log(`  Henter tabell for: ${name}`)

      const table = await this.fetchLeagueTable(url)
      if (table) {
        tables.push(table)
        console.log(`  ✅ ${table.rows.length} lag i tabellen`)
      } else {
        console.log(`  ⚠️ Ingen tabell funnet`)
      }

      if (i < entries.length - 1) {
        await this.delay(this.delayMs)
      }
    }

    return tables
  }
}
