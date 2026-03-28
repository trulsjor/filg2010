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
  const matchLinks = document.querySelectorAll('[href*="/match/"]');
  const seen = new Set();
  const matches = [];
  for (const link of matchLinks) {
    const matchUrl = link.getAttribute('href') || '';
    const urlMatch = matchUrl.match(/\\/match\\/(\\d+)/);
    if (!urlMatch) continue;
    const matchId = urlMatch[1];
    if (seen.has(matchId)) continue;
    seen.add(matchId);

    const li = link.closest('li');
    if (!li) continue;

    let homegoals = '';
    let awaygoals = '';
    let hasResult = false;
    let timestamp = null;

    const xDataEl = li.querySelector('[x-data]');
    if (xDataEl) {
      const xDataStr = xDataEl.getAttribute('x-data') || '';
      const hm = xDataStr.match(/homegoals:\\s*'([^']*)'/);
      const am = xDataStr.match(/awaygoals:\\s*'([^']*)'/);
      const hr = xDataStr.match(/hasResult:\\s*(true|false)/);
      const tsMatch = xDataStr.match(/timestamp:\\s*(\\d+)/);
      homegoals = hm ? hm[1] : '';
      awaygoals = am ? am[1] : '';
      hasResult = hr ? hr[1] === 'true' : false;
      timestamp = tsMatch ? parseInt(tsMatch[1], 10) : null;
    }

    if (!hasResult && homegoals && awaygoals) {
      hasResult = true;
    }

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
    if (timestamp) {
      const ts = timestamp * 1000;
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

    if (!homeTeam || !awayTeam) continue;

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
    await page.waitForSelector('[href*="/match/"]', { timeout: 10000 }).catch(() => {})
  }

  private async extractMatches(page: Page, year: number): Promise<ProfixioMatchData[]> {
    const fn = new Function('return ' + EXTRACT_MATCHES_SCRIPT)()
    return page.evaluate(fn, year)
  }

  async scrapeGroupPage(
    cupConfig: CupConfig
  ): Promise<{ matches: ProfixioMatchData[]; table: ProfixioTableRow[] }> {
    const browser = await this.getBrowser()
    const context = await browser.newContext({ locale: 'nb-NO' })
    const page = await context.newPage()
    const url = `${BASE_URL}/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/group/${cupConfig.groupId}`

    try {
      const year = new Date().getFullYear()

      console.log(`  Henter gruppe: ${url}`)
      await this.navigateAndWait(page, url)
      const upcomingMatches = await this.extractMatches(page, year)
      console.log(`  Fant ${upcomingMatches.length} kommende kamper`)

      const historyUrl = `${url}?segment=historikk`
      console.log(`  Henter historikk: ${historyUrl}`)
      await this.navigateAndWait(page, historyUrl)
      const playedMatches = await this.extractMatches(page, year)
      console.log(`  Fant ${playedMatches.length} spilte kamper`)

      const seen = new Set<string>()
      const matches: ProfixioMatchData[] = []
      for (const m of [...playedMatches, ...upcomingMatches]) {
        if (!seen.has(m.matchId)) {
          seen.add(m.matchId)
          matches.push(m)
        }
      }

      const table = deriveTableFromMatches(matches)
      console.log(`  Totalt ${matches.length} kamper, ${table.length} lag i tabell`)
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
