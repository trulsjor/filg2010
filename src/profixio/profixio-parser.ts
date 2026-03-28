import type { Match, CupConfig } from '../types/index.js'

export interface ProfixioMatchData {
  matchId: string
  matchNumber: string
  date: string
  time: string
  year: number
  homeTeam: string
  awayTeam: string
  homeGoals: string
  awayGoals: string
  hasResult: boolean
  venue: string
  facility: string
  matchUrl: string
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  okt: 10,
  nov: 11,
  des: 12,
}

export function parseProfixioDate(dateStr: string, year: number): string {
  const match = dateStr.match(/(\d+)\.\s*(\w+)/)
  if (!match) return ''
  const day = parseInt(match[1], 10)
  const month = MONTH_MAP[match[2].toLowerCase()]
  if (!month) return ''
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
}

export function filterTeamMatches(
  matches: ProfixioMatchData[],
  cupConfig: CupConfig
): ProfixioMatchData[] {
  const team = cupConfig.teamName.toLowerCase()
  return matches.filter(
    (m) => m.homeTeam.toLowerCase().includes(team) || m.awayTeam.toLowerCase().includes(team)
  )
}

export function profixioMatchToMatch(raw: ProfixioMatchData, cupConfig: CupConfig): Match {
  const result = raw.hasResult ? `${raw.homeGoals}-${raw.awayGoals}` : '-'
  const bane = [raw.venue, raw.facility].filter(Boolean).join(', ')

  return {
    Lag: cupConfig.teamTag,
    Dato: parseProfixioDate(raw.date, raw.year),
    Tid: raw.time,
    Kampnr: `pwcup-${raw.matchNumber}`,
    Hjemmelag: raw.homeTeam,
    Bortelag: raw.awayTeam,
    'H-B': result,
    Bane: bane,
    Arrangør: cupConfig.name.replace(/\s+\d{4}$/, ''),
    Turnering: cupConfig.name,
    'Kamp URL': raw.matchUrl,
    'Turnering URL': `https://www.profixio.com/app/${cupConfig.tournamentSlug}`,
  }
}
