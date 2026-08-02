import { describe, it, expect } from 'vitest'
import {
  profixioMatchToMatch,
  filterTeamMatches,
  formatProfixioDate,
  type ProfixioMatchData,
} from './profixio-parser'
import type { CupConfig } from '../types/index'

// Oslo-midnatt på kampdagen, uttrykt som UTC (kilden til off-by-one-buggen):
// om sommeren er Norge CEST (+2), så midnatt = 22:00 UTC dagen før.
const osloMidnight = (y: number, m: number, d: number, utcHourDayBefore: number): number =>
  Math.floor(Date.UTC(y, m, d, utcHourDayBefore) / 1000)

const noonUtc = (y: number, m: number, d: number): number =>
  Math.floor(Date.UTC(y, m, d, 12) / 1000)

const cupConfig: CupConfig = {
  name: 'Peter Wessel Cup 2026',
  source: 'profixio',
  tournamentSlug: 'pwcup_2026',
  categoryId: '1179353',
  groupId: '3400161',
  groupName: 'Gruppe G',
  playoffIds: [1, 2],
  teamName: 'Fjellhammer IL',
  teamTag: 'Fjellhammer G15 1',
  color: '#fbbf24',
}

describe('formatProfixioDate', () => {
  it('viser riktig dag for en sommer-midnattskamp (off-by-one-buggen)', () => {
    // lør 8. aug 2026 00:00 norsk tid = fre 7. aug 22:00 UTC
    expect(formatProfixioDate(osloMidnight(2026, 7, 7, 22))).toBe('08.08.2026')
  })

  it('viser riktig dag for en vinter-midnattskamp', () => {
    // 10. jan 2026 00:00 norsk tid (CET, +1) = 9. jan 23:00 UTC
    expect(formatProfixioDate(osloMidnight(2026, 0, 9, 23))).toBe('10.01.2026')
  })

  it('formaterer et vanlig dagtidstidsstempel', () => {
    expect(formatProfixioDate(noonUtc(2026, 2, 28))).toBe('28.03.2026')
  })

  it('gir tom streng når tidsstempel mangler', () => {
    expect(formatProfixioDate(0)).toBe('')
  })
})

describe('profixioMatchToMatch', () => {
  it('converts a Profixio match without result to Match', () => {
    const raw: ProfixioMatchData = {
      matchId: '32583264',
      matchNumber: '48',
      timestamp: noonUtc(2026, 2, 28),
      time: '08:00',
      homeTeam: 'Fjellhammer IL',
      awayTeam: 'Herkules Håndball',
      homeGoals: '',
      awayGoals: '',
      hasResult: false,
      venue: 'Runar 1',
      facility: 'Runarhallen',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/32583264',
    }

    const match = profixioMatchToMatch(raw, cupConfig)

    expect(match.Lag).toBe('Fjellhammer G15 1')
    expect(match.Dato).toBe('28.03.2026')
    expect(match.Tid).toBe('08:00')
    expect(match.Kampnr).toBe('pwcup-48')
    expect(match.Hjemmelag).toBe('Fjellhammer IL')
    expect(match.Bortelag).toBe('Herkules Håndball')
    expect(match['H-B']).toBe('-')
    expect(match.Bane).toBe('Runar 1, Runarhallen')
    expect(match.Arrangør).toBe('Peter Wessel Cup')
    expect(match.Turnering).toBe('Peter Wessel Cup 2026')
    expect(match['Kamp URL']).toBe('https://www.profixio.com/app/pwcup_2026/match/32583264')
    expect(match['Turnering URL']).toBe('https://www.profixio.com/app/pwcup_2026')
  })

  it('converts a Profixio match with result to Match', () => {
    const raw: ProfixioMatchData = {
      matchId: '32085114',
      matchNumber: '229',
      timestamp: noonUtc(2025, 3, 12),
      time: '15:20',
      homeTeam: 'Fana IL',
      awayTeam: 'Fjellhammer IL',
      homeGoals: '16',
      awayGoals: '10',
      hasResult: true,
      venue: '',
      facility: '',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/32085114',
    }

    const match = profixioMatchToMatch(raw, cupConfig)

    expect(match['H-B']).toBe('16-10')
    expect(match.Dato).toBe('12.04.2025')
  })
})

describe('filterTeamMatches', () => {
  const base = {
    time: '10:00',
    homeGoals: '',
    awayGoals: '',
    hasResult: false,
    venue: 'Runar 1',
    facility: 'Runarhallen',
  }
  const allGroupMatches: ProfixioMatchData[] = [
    {
      ...base,
      matchId: '1',
      matchNumber: '21',
      timestamp: noonUtc(2026, 2, 27),
      homeTeam: 'Vikhammer HK',
      awayTeam: 'Bjarg, IL',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/1',
    },
    {
      ...base,
      matchId: '2',
      matchNumber: '48',
      timestamp: noonUtc(2026, 2, 28),
      homeTeam: 'Fjellhammer IL',
      awayTeam: 'Herkules Håndball',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/2',
    },
    {
      ...base,
      matchId: '3',
      matchNumber: '208',
      timestamp: noonUtc(2026, 2, 28),
      homeTeam: 'Bjarg, IL',
      awayTeam: 'Fjellhammer IL',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/3',
    },
    {
      ...base,
      matchId: '4',
      matchNumber: '127',
      timestamp: noonUtc(2026, 2, 28),
      homeTeam: 'Bjarg, IL',
      awayTeam: 'Øyestad IF',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/4',
    },
  ]

  it('filters matches where the configured team is home or away', () => {
    const filtered = filterTeamMatches(allGroupMatches, cupConfig)

    expect(filtered).toHaveLength(2)
    expect(filtered[0].matchNumber).toBe('48')
    expect(filtered[1].matchNumber).toBe('208')
  })

  it('returns empty array when team has no matches', () => {
    const config = { ...cupConfig, teamName: 'Nonexistent FC' }
    const filtered = filterTeamMatches(allGroupMatches, config)

    expect(filtered).toHaveLength(0)
  })
})
