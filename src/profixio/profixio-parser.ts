import type { Match, CupConfig } from '../types/index.js'
import { cupMatchNumber } from './CupMatchNumber.js'

export interface ProfixioMatchData {
  matchId: string
  matchNumber: string
  timestamp: number
  time: string
  homeTeam: string
  awayTeam: string
  homeGoals: string
  awayGoals: string
  hasResult: boolean
  venue: string
  facility: string
  matchUrl: string
}

// Profixios tidsstempel er kampstart som Unix-sekunder (UTC). Datoen skal vises i
// norsk lokaltid. Bruk Europe/Oslo slik at både sommertid (CEST, +2) og vintertid
// (CET, +1) håndteres riktig – en fast +1t-offset gjør at midnattskamper lander på
// dagen før om sommeren.
export function formatProfixioDate(timestampSeconds: number): string {
  if (!timestampSeconds) return ''
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date(timestampSeconds * 1000))
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}.${get('month')}.${get('year')}`
}

export function filterTeamMatches(
  matches: ProfixioMatchData[],
  cupConfig: CupConfig
): ProfixioMatchData[] {
  const team = cupConfig.teamName
  return matches.filter((m) => m.homeTeam === team || m.awayTeam === team)
}

export function profixioMatchToMatch(raw: ProfixioMatchData, cupConfig: CupConfig): Match {
  const result = raw.hasResult ? `${raw.homeGoals}-${raw.awayGoals}` : '-'
  const bane = [raw.venue, raw.facility].filter(Boolean).join(', ')

  return {
    Lag: cupConfig.teamTag,
    Dato: formatProfixioDate(raw.timestamp),
    Tid: raw.time,
    Kampnr: cupMatchNumber(raw.matchNumber),
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
