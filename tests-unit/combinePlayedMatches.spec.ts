import { describe, expect, it } from 'vitest'
import { combinePlayedMatches } from '../src/update/combine-matches.js'

interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
}

describe('combinePlayedMatches', () => {
  it('inkluderer kamper fra terminliste med resultat og URL', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'Kamp URL': 'https://handball.no/match?matchid=12345', 'H-B': '25-20' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(1)
    expect(result[0].matchId).toBe('12345')
    expect(result[0].matchUrl).toBe('https://handball.no/match?matchid=12345')
  })

  it('inkluderer kamper fra turnering', () => {
    const tournamentMatches = [
      { matchId: '67890', matchUrl: 'https://handball.no/match?matchid=67890' },
    ]
    const terminlisteMatches: TerminlisteMatch[] = []

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(1)
    expect(result[0].matchId).toBe('67890')
  })

  it('dedupliserer når kamp finnes begge steder', () => {
    const tournamentMatches = [
      { matchId: '12345', matchUrl: 'https://handball.no/match?matchid=12345' },
    ]
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'Kamp URL': 'https://handball.no/match?matchid=12345', 'H-B': '25-20' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(1)
    expect(result[0].matchId).toBe('12345')
  })

  it('foretrekker turnering-URL ved konflikt', () => {
    const tournamentMatches = [
      { matchId: '12345', matchUrl: 'https://handball.no/tournament?matchid=12345' },
    ]
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'Kamp URL': 'https://handball.no/old?matchid=12345', 'H-B': '25-20' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(1)
    expect(result[0].matchUrl).toBe('https://handball.no/tournament?matchid=12345')
  })

  it('ignorerer kamper uten URL', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'H-B': '25-20' }, // No URL
      { Kampnr: '67890', 'Kamp URL': '', 'H-B': '30-25' }, // Empty URL
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(0)
  })

  it('ignorerer kamper med H-B = "-"', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'Kamp URL': 'https://handball.no/match?matchid=12345', 'H-B': '-' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(0)
  })

  it('ignorerer kamper uten H-B verdi', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '12345', 'Kamp URL': 'https://handball.no/match?matchid=12345' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(0)
  })

  it('kombinerer kamper fra begge kilder uten duplikater', () => {
    const tournamentMatches = [
      { matchId: '11111', matchUrl: 'https://handball.no/match?matchid=11111' },
      { matchId: '22222', matchUrl: 'https://handball.no/match?matchid=22222' },
    ]
    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '22222', 'Kamp URL': 'https://handball.no/match?matchid=22222', 'H-B': '25-20' },
      { Kampnr: '33333', 'Kamp URL': 'https://handball.no/match?matchid=33333', 'H-B': '30-25' },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(3)
    const matchIds = result.map((m) => m.matchId).sort()
    expect(matchIds).toEqual(['11111', '22222', '33333'])
  })

  it('håndterer tomme arrays', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = []

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(0)
  })

  it('trimmer kampnr fra terminliste', () => {
    const tournamentMatches: Array<{ matchId: string; matchUrl: string }> = []
    const terminlisteMatches: TerminlisteMatch[] = [
      {
        Kampnr: '  12345  ',
        'Kamp URL': 'https://handball.no/match?matchid=12345',
        'H-B': '25-20',
      },
    ]

    const result = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(result).toHaveLength(1)
    expect(result[0].matchId).toBe('12345')
  })
})
