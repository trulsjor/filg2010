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

  it('matches Profixio table for PW Cup 2025 G15 Gruppe A', () => {
    const matches = [
      makeMatch({
        matchId: '32085357',
        matchNumber: '223',
        homeTeam: 'Ranheim IL',
        awayTeam: 'Kolbotn IL',
        homeGoals: '15',
        awayGoals: '15',
        hasResult: true,
      }),
      makeMatch({
        matchId: '32085358',
        matchNumber: '205',
        homeTeam: 'Viking HK 1',
        awayTeam: 'Kjelsås IL',
        homeGoals: '21',
        awayGoals: '12',
        hasResult: true,
      }),
      makeMatch({
        matchId: '32085359',
        matchNumber: '151',
        homeTeam: 'Kolbotn IL',
        awayTeam: 'Viking HK 1',
        homeGoals: '25',
        awayGoals: '15',
        hasResult: true,
      }),
      makeMatch({
        matchId: '32085360',
        matchNumber: '133',
        homeTeam: 'Ranheim IL',
        awayTeam: 'Kjelsås IL',
        homeGoals: '18',
        awayGoals: '14',
        hasResult: true,
      }),
      makeMatch({
        matchId: '32085356',
        matchNumber: '79',
        homeTeam: 'Viking HK 1',
        awayTeam: 'Ranheim IL',
        homeGoals: '20',
        awayGoals: '17',
        hasResult: true,
      }),
      makeMatch({
        matchId: '32085355',
        matchNumber: '61',
        homeTeam: 'Kjelsås IL',
        awayTeam: 'Kolbotn IL',
        homeGoals: '11',
        awayGoals: '18',
        hasResult: true,
      }),
    ]

    const table = deriveTableFromMatches(matches)

    expect(table).toHaveLength(4)

    const kolbotn = table.find((r) => r.team === 'Kolbotn IL')!
    expect(kolbotn.position).toBe(1)
    expect(kolbotn.played).toBe(3)
    expect(kolbotn.won).toBe(2)
    expect(kolbotn.drawn).toBe(1)
    expect(kolbotn.lost).toBe(0)
    expect(kolbotn.goalsFor).toBe(58)
    expect(kolbotn.goalsAgainst).toBe(41)
    expect(kolbotn.goalDifference).toBe(17)
    expect(kolbotn.points).toBe(5)

    const viking = table.find((r) => r.team === 'Viking HK 1')!
    expect(viking.position).toBe(2)
    expect(viking.played).toBe(3)
    expect(viking.won).toBe(2)
    expect(viking.drawn).toBe(0)
    expect(viking.lost).toBe(1)
    expect(viking.goalsFor).toBe(56)
    expect(viking.goalsAgainst).toBe(54)
    expect(viking.goalDifference).toBe(2)
    expect(viking.points).toBe(4)

    const ranheim = table.find((r) => r.team === 'Ranheim IL')!
    expect(ranheim.position).toBe(3)
    expect(ranheim.played).toBe(3)
    expect(ranheim.won).toBe(1)
    expect(ranheim.drawn).toBe(1)
    expect(ranheim.lost).toBe(1)
    expect(ranheim.goalsFor).toBe(50)
    expect(ranheim.goalsAgainst).toBe(49)
    expect(ranheim.goalDifference).toBe(1)
    expect(ranheim.points).toBe(3)

    const kjelsas = table.find((r) => r.team === 'Kjelsås IL')!
    expect(kjelsas.position).toBe(4)
    expect(kjelsas.played).toBe(3)
    expect(kjelsas.won).toBe(0)
    expect(kjelsas.drawn).toBe(0)
    expect(kjelsas.lost).toBe(3)
    expect(kjelsas.goalsFor).toBe(37)
    expect(kjelsas.goalsAgainst).toBe(57)
    expect(kjelsas.goalDifference).toBe(-20)
    expect(kjelsas.points).toBe(0)
  })
})
