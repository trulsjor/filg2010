import * as fs from 'fs'
import * as XLSX from 'xlsx'
import { chromium, type Browser, type Page } from 'playwright'
import type { CupConfig } from '../types/index.js'
import type { ProfixioMatchData } from './profixio-parser.js'

export interface ProfixioTableRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface ProfixioExcelRow {
  Kampnr: number
  Dag: string
  Dato: string | Date
  Tid: string
  League: string
  Hometeam: string
  Resultat: string | null
  Awayteam: string
  Venue: string
  'Match name': string | null
}

const BASE_URL = 'https://www.profixio.com/app'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des']

function parseExcelDate(value: string | Date): { year: number; dateStr: string } {
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return { year: 0, dateStr: '' }
  return {
    year: d.getUTCFullYear(),
    dateStr: `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`,
  }
}

function excelRowToMatchData(row: ProfixioExcelRow, tournamentSlug: string): ProfixioMatchData {
  const { year, dateStr } = parseExcelDate(row.Dato)

  const resultMatch = row.Resultat?.match(/(\d+)\s*-\s*(\d+)/)
  const hasResult = resultMatch != null

  const venueParts = (row.Venue || '').split(' ')
  const facility = venueParts[0] || ''
  const venue = venueParts.slice(1).join(' ') || ''

  return {
    matchId: String(row.Kampnr),
    matchNumber: String(row.Kampnr),
    date: dateStr,
    time: String(row.Tid),
    year,
    homeTeam: row.Hometeam,
    awayTeam: row.Awayteam,
    homeGoals: resultMatch ? resultMatch[1] : '',
    awayGoals: resultMatch ? resultMatch[2] : '',
    hasResult,
    venue,
    facility,
    matchUrl: `${BASE_URL}/${tournamentSlug}/match/${row.Kampnr}`,
  }
}

export function deriveTableFromMatches(matches: ProfixioMatchData[]): ProfixioTableRow[] {
  const stats = new Map<string, ProfixioTableRow>()

  for (const m of matches) {
    for (const team of [m.homeTeam, m.awayTeam]) {
      if (!stats.has(team)) {
        stats.set(team, {
          position: 0,
          team,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        })
      }
    }

    if (!m.hasResult) continue
    const hg = parseInt(m.homeGoals, 10)
    const ag = parseInt(m.awayGoals, 10)
    const home = stats.get(m.homeTeam)
    const away = stats.get(m.awayTeam)
    if (!home || !away) continue
    home.played++
    away.played++
    home.goalsFor += hg
    home.goalsAgainst += ag
    away.goalsFor += ag
    away.goalsAgainst += hg
    if (hg > ag) {
      home.won++
      home.points += 2
      away.lost++
    } else if (hg < ag) {
      away.won++
      away.points += 2
      home.lost++
    } else {
      home.drawn++
      away.drawn++
      home.points++
      away.points++
    }
  }

  const rows = Array.from(stats.values())
  rows.sort(
    (a, b) => b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst)
  )
  rows.forEach((r, i) => {
    r.position = i + 1
    r.goalDifference = r.goalsFor - r.goalsAgainst
  })
  return rows
}

export class ProfixioScraper {
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

  private async downloadExcel(page: Page, url: string): Promise<ProfixioExcelRow[]> {
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-cy="excelexport"]', { timeout: 10000 })
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-cy="excelexport"]')
    const download = await downloadPromise
    const filePath = await download.path()
    if (!filePath) throw new Error('Excel-nedlasting feilet: ingen filsti')
    const buffer = fs.readFileSync(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawRows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
      header: 1,
    })
    if (rawRows.length < 2) return []
    return rawRows.slice(1).map((r) => ({
      Kampnr: Number(r[0]),
      Dag: String(r[1] || ''),
      Dato: r[2] instanceof Date ? r[2] : String(r[2] || ''),
      Tid: String(r[3] || ''),
      League: String(r[4] || ''),
      Hometeam: String(r[5] || ''),
      Resultat: r[6] != null ? String(r[6]) : null,
      Awayteam: String(r[7] || ''),
      Venue: String(r[8] || ''),
      'Match name': r[9] != null ? String(r[9]) : null,
    }))
  }

  async scrapeGroupPage(
    cupConfig: CupConfig
  ): Promise<{ matches: ProfixioMatchData[]; table: ProfixioTableRow[] }> {
    const browser = await this.getBrowser()
    const page = await browser.newPage()
    const url = `${BASE_URL}/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/group/${cupConfig.groupId}`

    try {
      console.log(`  Henter gruppe: ${url}`)
      const excelRows = await this.downloadExcel(page, url)
      const matches = excelRows.map((r) => excelRowToMatchData(r, cupConfig.tournamentSlug))
      const table = deriveTableFromMatches(matches)
      console.log(`  Fant ${matches.length} kamper, ${table.length} lag i tabell`)
      return { matches, table }
    } finally {
      await page.close()
    }
  }

  async scrapePlayoffPages(cupConfig: CupConfig): Promise<ProfixioMatchData[]> {
    const browser = await this.getBrowser()
    const results: ProfixioMatchData[][] = []

    for (const playoffId of cupConfig.playoffIds) {
      const page = await browser.newPage()
      const url = `${BASE_URL}/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/playoff/${playoffId}`

      try {
        console.log(`  Henter sluttspill ${playoffId}: ${url}`)
        const excelRows = await this.downloadExcel(page, url)
        const matches = excelRows.map((r) => excelRowToMatchData(r, cupConfig.tournamentSlug))
        console.log(`  Fant ${matches.length} kamper i sluttspill ${playoffId}`)
        results.push(matches)
      } finally {
        await page.close()
      }
    }

    return results.flat()
  }
}
