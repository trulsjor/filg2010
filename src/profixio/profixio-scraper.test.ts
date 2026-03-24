import { describe, it, expect } from 'vitest'
import { deriveTableFromMatches } from './profixio-scraper'
import type { ProfixioMatchData } from './profixio-parser'

function makeMatch(overrides: Partial<ProfixioMatchData> = {}): ProfixioMatchData {
  return {
    matchId: '1',
    matchNumber: '1',
    date: '28. mar',
    time: '08:00',
    year: 2026,
    homeTeam: 'Lag A',
    awayTeam: 'Lag B',
    homeGoals: '',
    awayGoals: '',
    hasResult: false,
    venue: '',
    facility: '',
    matchUrl: 'https://www.profixio.com/app/pwcup_2026/match/12345678',
    ...overrides,
  }
}

describe('deriveTableFromMatches', () => {
  it('creates table entries for all teams even without results', () => {
    const matches = [makeMatch()]
    const table = deriveTableFromMatches(matches)

    expect(table).toHaveLength(2)
    expect(table.map((r) => r.team).sort()).toEqual(['Lag A', 'Lag B'])
    expect(table[0].played).toBe(0)
    expect(table[0].points).toBe(0)
  })

  it('awards 2 points for a win', () => {
    const matches = [makeMatch({ homeGoals: '10', awayGoals: '5', hasResult: true })]
    const table = deriveTableFromMatches(matches)

    const winner = table.find((r) => r.team === 'Lag A')!
    const loser = table.find((r) => r.team === 'Lag B')!

    expect(winner.played).toBe(1)
    expect(winner.won).toBe(1)
    expect(winner.points).toBe(2)
    expect(loser.played).toBe(1)
    expect(loser.lost).toBe(1)
    expect(loser.points).toBe(0)
  })

  it('awards 1 point each for a draw', () => {
    const matches = [makeMatch({ homeGoals: '8', awayGoals: '8', hasResult: true })]
    const table = deriveTableFromMatches(matches)

    for (const row of table) {
      expect(row.drawn).toBe(1)
      expect(row.points).toBe(1)
    }
  })

  it('tracks goals for and against', () => {
    const matches = [makeMatch({ homeGoals: '10', awayGoals: '5', hasResult: true })]
    const table = deriveTableFromMatches(matches)

    const home = table.find((r) => r.team === 'Lag A')!
    expect(home.goalsFor).toBe(10)
    expect(home.goalsAgainst).toBe(5)
    expect(home.goalDifference).toBe(5)

    const away = table.find((r) => r.team === 'Lag B')!
    expect(away.goalsFor).toBe(5)
    expect(away.goalsAgainst).toBe(10)
    expect(away.goalDifference).toBe(-5)
  })

  it('sorts by points then goal difference', () => {
    const matches = [
      makeMatch({
        matchId: '1',
        homeTeam: 'Lag A',
        awayTeam: 'Lag B',
        homeGoals: '10',
        awayGoals: '5',
        hasResult: true,
      }),
      makeMatch({
        matchId: '2',
        homeTeam: 'Lag C',
        awayTeam: 'Lag D',
        homeGoals: '20',
        awayGoals: '1',
        hasResult: true,
      }),
    ]
    const table = deriveTableFromMatches(matches)

    expect(table[0].team).toBe('Lag C')
    expect(table[1].team).toBe('Lag A')
    expect(table[0].position).toBe(1)
    expect(table[1].position).toBe(2)
  })

  it('assigns correct positions', () => {
    const matches = [
      makeMatch({
        matchId: '1',
        homeTeam: 'Lag A',
        awayTeam: 'Lag B',
        homeGoals: '10',
        awayGoals: '5',
        hasResult: true,
      }),
      makeMatch({
        matchId: '2',
        homeTeam: 'Lag A',
        awayTeam: 'Lag C',
        homeGoals: '8',
        awayGoals: '8',
        hasResult: true,
      }),
    ]
    const table = deriveTableFromMatches(matches)

    expect(table[0].position).toBe(1)
    expect(table[0].team).toBe('Lag A')
    expect(table[0].points).toBe(3)
  })
})
