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

const BASE_URL = 'https://www.profixio.com/app'

const EXTRACT_MATCHES_SCRIPT = `(year) => {
  const items = document.querySelectorAll('li[wire\\\\:key^="listkamp_"]');
  const matches = [];
  for (const li of items) {
    const xDataEl = li.querySelector('[x-data]');
    if (!xDataEl) continue;
    const xDataStr = xDataEl.getAttribute('x-data') || '';
    const hm = xDataStr.match(/homegoals:\\s*'([^']*)'/);
    const am = xDataStr.match(/awaygoals:\\s*'([^']*)'/);
    const hr = xDataStr.match(/hasResult:\\s*(true|false)/);
    const tsMatch = xDataStr.match(/timestamp:\\s*(\\d+)/);
    const homegoals = hm ? hm[1] : '';
    const awaygoals = am ? am[1] : '';
    const hasResult = hr ? hr[1] === 'true' : false;

    const wireKey = li.getAttribute('wire:key') || '';
    const matchId = wireKey.replace('listkamp_', '');
    if (!matchId) continue;
    const hrefEl = li.querySelector('[href*="/match/"]');
    const matchUrl = hrefEl ? hrefEl.getAttribute('href') : '';
    if (!matchUrl) continue;

    const textXsDivs = li.querySelectorAll('.text-xs');
    let matchNumber = '';
    for (const div of textXsDivs) {
      const text = (div.textContent || '').trim();
      if (/^\\d+$/.test(text) && !div.classList.contains('text-right') && !div.classList.contains('font-bold')) {
        matchNumber = text;
        break;
      }
    }

    let date = '';
    if (tsMatch) {
      const ts = parseInt(tsMatch[1], 10) * 1000;
      const cetOffset = 60 * 60 * 1000;
      const cetDate = new Date(ts + cetOffset);
      const months = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
      date = cetDate.getUTCDate() + '. ' + months[cetDate.getUTCMonth()];
    }

    let time = '';
    const allDivs = li.querySelectorAll('div');
    for (const d of allDivs) {
      const t = (d.textContent || '').trim();
      if (/^\\d{2}:\\d{2}$/.test(t)) { time = t; break; }
    }

    const teamDivs = Array.from(li.querySelectorAll('.leading-5'))
      .filter(el => {
        const text = (el.textContent || '').trim();
        return text.length > 0 && !/^\\d+\\s*[-:]\\s*\\d+$/.test(text) && !/^\\d+$/.test(text);
      });
    const homeTeam = teamDivs[0] ? (teamDivs[0].textContent || '').trim() : '';
    const awayTeam = teamDivs[1] ? (teamDivs[1].textContent || '').trim() : '';

    let venue = '';
    let facility = '';
    if (!hasResult) {
      const rightDivs = li.querySelectorAll('.text-right');
      const venueTexts = Array.from(rightDivs).map(d => (d.textContent || '').trim()).filter(Boolean);
      venue = venueTexts[0] || '';
      facility = venueTexts[1] || '';
    }

    matches.push({
      matchId, matchNumber, date, time, year,
      homeTeam, awayTeam, homeGoals: homegoals, awayGoals: awaygoals,
      hasResult, venue, facility, matchUrl: matchUrl || '',
    });
  }
  return matches;
}`

const EXTRACT_TABLE_SCRIPT = `() => {
  const table = document.querySelector('table');
  if (!table) return [];
  const rows = table.querySelectorAll('tbody tr');
  const result = [];
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 9) continue;
    const goalsMatch = ((cells[6].textContent || '').trim()).match(/(\\d+)\\s*-\\s*(\\d+)/);
    result.push({
      position: parseInt((cells[0].textContent || '').trim() || '0', 10),
      team: (cells[1].querySelector('a')?.textContent || '').trim(),
      played: parseInt((cells[2].textContent || '').trim() || '0', 10),
      won: parseInt((cells[3].textContent || '').trim() || '0', 10),
      drawn: parseInt((cells[4].textContent || '').trim() || '0', 10),
      lost: parseInt((cells[5].textContent || '').trim() || '0', 10),
      goalsFor: goalsMatch ? parseInt(goalsMatch[1], 10) : 0,
      goalsAgainst: goalsMatch ? parseInt(goalsMatch[2], 10) : 0,
      goalDifference: parseInt((cells[7].textContent || '').trim() || '0', 10),
      points: parseInt((cells[8].textContent || '').trim() || '0', 10),
    });
  }
  return result;
}`

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

  private async navigateAndWait(page: Page, url: string): Promise<void> {
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.waitForSelector('li[wire\\:key^="listkamp_"]', { timeout: 10000 }).catch(() => {})
  }

  private async extractMatches(page: Page, year: number): Promise<ProfixioMatchData[]> {
    const fn = new Function('return ' + EXTRACT_MATCHES_SCRIPT)()
    return page.evaluate(fn, year)
  }

  private async extractTable(page: Page): Promise<ProfixioTableRow[]> {
    const fn = new Function('return ' + EXTRACT_TABLE_SCRIPT)()
    return page.evaluate(fn)
  }

  async scrapeGroupPage(
    cupConfig: CupConfig
  ): Promise<{ matches: ProfixioMatchData[]; table: ProfixioTableRow[] }> {
    const browser = await this.getBrowser()
    const context = await browser.newContext({ locale: 'nb-NO' })
    const page = await context.newPage()
    const url = `${BASE_URL}/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/group/${cupConfig.groupId}`

    try {
      console.log(`  Henter gruppe: ${url}`)
      await this.navigateAndWait(page, url)
      const year = new Date().getFullYear()
      const matches = await this.extractMatches(page, year)
      const table = deriveTableFromMatches(matches)
      console.log(`  Fant ${matches.length} kamper, ${table.length} lag i tabell`)
      return { matches, table }
    } finally {
      await page.close()
      await context.close()
    }
  }

  async scrapePlayoffPages(cupConfig: CupConfig): Promise<ProfixioMatchData[]> {
    const browser = await this.getBrowser()
    const year = new Date().getFullYear()
    const results: ProfixioMatchData[][] = []

    for (const playoffId of cupConfig.playoffIds) {
      const context = await browser.newContext({ locale: 'nb-NO' })
      const page = await context.newPage()
      const url = `${BASE_URL}/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/playoff/${playoffId}`

      try {
        console.log(`  Henter sluttspill ${playoffId}: ${url}`)
        await this.navigateAndWait(page, url)
        const matches = await this.extractMatches(page, year)
        console.log(`  Fant ${matches.length} kamper i sluttspill ${playoffId}`)
        results.push(matches)
      } finally {
        await page.close()
        await context.close()
      }
    }

    return results.flat()
  }
}
