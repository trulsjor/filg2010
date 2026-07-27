import { describe, it, expect } from 'vitest'
import {
  buildTournamentUrlLookup,
  toMatch,
  toMatches,
} from '../src/handball/ScheduledMatchToMatch.js'
import type { ScheduledMatch } from '../src/handball/TeamSchedule.js'
import type { Team } from '../src/types/index.js'

const team: Team = { name: 'Fjellhammer G16 1', lagid: '558767', color: '#fbbf24' }

function scheduled(overrides: Partial<ScheduledMatch> = {}): ScheduledMatch {
  return {
    matchId: '8442922',
    matchNo: '95031612005',
    tournamentId: '449420',
    tournamentName: 'iceserien G16 - Kval Pulje 12',
    homeTeamId: '558767',
    homeTeamName: 'Fjellhammer',
    awayTeamId: '582574',
    awayTeamName: 'Kjelsås',
    date: '05.09.2026',
    time: '10:00',
    result: '',
    venue: 'Kjelsåshallen',
    organizer: 'Kjelsås IL',
    spectators: null,
    round: 'Runde 3',
    ...overrides,
  }
}

describe('toMatch', () => {
  it('bygger kampen slik nettsiden leser den', () => {
    const match = toMatch(scheduled(), team, 'https://turnering')

    expect(match).toEqual({
      Lag: 'Fjellhammer G16 1',
      Dato: '05.09.2026',
      Tid: '10:00',
      Kampnr: '95031612005',
      Hjemmelag: 'Fjellhammer',
      Bortelag: 'Kjelsås',
      'H-B': '',
      Bane: 'Kjelsåshallen',
      Arrangør: 'Kjelsås IL',
      Turnering: 'iceserien G16 - Kval Pulje 12',
      'Kamp URL': 'https://www.handball.no/system/kamper/kamp/?matchid=8442922',
      'Hjemmelag URL': 'https://www.handball.no/system/kamper/lag/?lagid=558767',
      'Bortelag URL': 'https://www.handball.no/system/kamper/lag/?lagid=582574',
      'Turnering URL': 'https://turnering',
    })
  })

  it('tar med tilskuertall når det finnes', () => {
    expect(toMatch(scheduled({ spectators: 125 }), team, undefined).Tilskuere).toBe(125)
  })

  it('utelater tilskuerfeltet når tallet mangler', () => {
    expect('Tilskuere' in toMatch(scheduled(), team, undefined)).toBe(false)
  })

  it('bruker kampnummer som Kampnr, ikke intern matchId', () => {
    const match = toMatch(scheduled(), team, undefined)

    expect(match.Kampnr).toBe('95031612005')
    expect(match['Kamp URL']).toContain('matchid=8442922')
  })
})

describe('buildTournamentUrlLookup', () => {
  it('slår opp turneringsurl på navn', () => {
    const lookup = buildTournamentUrlLookup([
      {
        tournamentId: '449420',
        name: 'iceserien G16 - Kval Pulje 12',
        seasonId: '201068',
        seasonName: 'Håndballsesongen 2026/2027',
        url: 'https://turnering/449420',
        hasPublicTable: false,
      },
    ])

    expect(lookup.get('iceserien G16 - Kval Pulje 12')).toBe('https://turnering/449420')
  })
})

describe('toMatches', () => {
  it('kobler hver kamp til turneringens url', () => {
    const urls = new Map([['iceserien G16 - Kval Pulje 12', 'https://turnering/449420']])
    const matches = toMatches([scheduled(), scheduled({ matchNo: 'B' })], team, urls)

    expect(matches).toHaveLength(2)
    expect(matches.every((m) => m['Turnering URL'] === 'https://turnering/449420')).toBe(true)
  })

  it('lar turneringsurl være tom når turneringen er ukjent', () => {
    const matches = toMatches([scheduled()], team, new Map())

    expect(matches[0]['Turnering URL']).toBeUndefined()
  })
})
