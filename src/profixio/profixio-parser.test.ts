import { describe, it, expect } from 'vitest'
import { profixioMatchToMatch, filterTeamMatches, type ProfixioMatchData } from './profixio-parser'
import type { CupConfig } from '../types/index'

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

describe('profixioMatchToMatch', () => {
  it('converts a Profixio match without result to Match', () => {
    const raw: ProfixioMatchData = {
      matchId: '32583264',
      matchNumber: '48',
      date: '28. mar',
      time: '08:00',
      year: 2026,
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
      date: '12. apr',
      time: '15:20',
      year: 2025,
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
  const allGroupMatches: ProfixioMatchData[] = [
    {
      matchId: '1',
      matchNumber: '21',
      date: '27. mar',
      time: '20:15',
      year: 2026,
      homeTeam: 'Vikhammer HK',
      awayTeam: 'Bjarg, IL',
      homeGoals: '',
      awayGoals: '',
      hasResult: false,
      venue: 'Fram',
      facility: 'Framhallen',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/1',
    },
    {
      matchId: '2',
      matchNumber: '48',
      date: '28. mar',
      time: '08:00',
      year: 2026,
      homeTeam: 'Fjellhammer IL',
      awayTeam: 'Herkules Håndball',
      homeGoals: '',
      awayGoals: '',
      hasResult: false,
      venue: 'Runar 1',
      facility: 'Runarhallen',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/2',
    },
    {
      matchId: '3',
      matchNumber: '208',
      date: '28. mar',
      time: '13:20',
      year: 2026,
      homeTeam: 'Bjarg, IL',
      awayTeam: 'Fjellhammer IL',
      homeGoals: '',
      awayGoals: '',
      hasResult: false,
      venue: 'Runar 2',
      facility: 'Runarhallen',
      matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/3',
    },
    {
      matchId: '4',
      matchNumber: '127',
      date: '28. mar',
      time: '10:40',
      year: 2026,
      homeTeam: 'Bjarg, IL',
      awayTeam: 'Øyestad IF',
      homeGoals: '',
      awayGoals: '',
      hasResult: false,
      venue: 'Runar 1',
      facility: 'Runarhallen',
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
