import { describe, expect, it } from 'vitest'
import { rebuildPlayerCatalog } from '../src/handball/player-catalog.js'
import type { MatchPlayerData, PlayerStats } from '../src/types/player-stats.js'

function createPlayerStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    playerId: '1',
    playerName: 'Test Player',
    jerseyNumber: 10,
    goals: 5,
    assists: 3,
    saves: 0,
    yellowCards: 0,
    redCards: 0,
    twoMinutes: 0,
    ...overrides,
  }
}

function createMatchPlayerData(overrides: Partial<MatchPlayerData> = {}): MatchPlayerData {
  return {
    matchId: '12345',
    matchDate: '01.01.2025',
    homeTeamId: 'team1',
    homeTeamName: 'Team A',
    awayTeamId: 'team2',
    awayTeamName: 'Team B',
    homeScore: 25,
    awayScore: 20,
    homeTeamStats: [],
    awayTeamStats: [],
    ...overrides,
  }
}

describe('rebuildPlayerCatalog', () => {
  it('returnerer tom liste for tom input', () => {
    const result = rebuildPlayerCatalog([])

    expect(result).toEqual([])
  })

  it('bygger spillerliste fra matchStats', () => {
    const matchStats = [
      createMatchPlayerData({
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player One' })],
        awayTeamStats: [createPlayerStats({ playerId: 'p2', playerName: 'Player Two' })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name).sort()).toEqual(['Player One', 'Player Two'])
  })

  it('setter primaryTeam basert på flest kamper', () => {
    const matchStats = [
      createMatchPlayerData({
        homeTeamId: 'teamA',
        homeTeamName: 'Team A',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
      createMatchPlayerData({
        homeTeamId: 'teamB',
        homeTeamName: 'Team B',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
      createMatchPlayerData({
        homeTeamId: 'teamB',
        homeTeamName: 'Team B',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(1)
    expect(result[0].primaryTeamId).toBe('teamB')
    expect(result[0].primaryTeamName).toBe('Team B')
  })

  it('samler alle teamIds', () => {
    const matchStats = [
      createMatchPlayerData({
        homeTeamId: 'teamA',
        homeTeamName: 'Team A',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
      createMatchPlayerData({
        awayTeamId: 'teamB',
        awayTeamName: 'Team B',
        awayTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(1)
    expect(result[0].teamIds.sort()).toEqual(['teamA', 'teamB'])
    expect(result[0].teamNames.sort()).toEqual(['Team A', 'Team B'])
  })

  it('bruker nyeste jerseyNumber', () => {
    const matchStats = [
      createMatchPlayerData({
        matchId: '1',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', jerseyNumber: 5 })],
      }),
      createMatchPlayerData({
        matchId: '2',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', jerseyNumber: 10 })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(1)
    expect(result[0].jerseyNumber).toBe(10)
  })

  it('håndterer spiller på flere lag', () => {
    const matchStats = [
      createMatchPlayerData({
        homeTeamId: 'teamA',
        homeTeamName: 'Team A',
        homeTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
      createMatchPlayerData({
        awayTeamId: 'teamB',
        awayTeamName: 'Team B',
        awayTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
      createMatchPlayerData({
        awayTeamId: 'teamC',
        awayTeamName: 'Team C',
        awayTeamStats: [createPlayerStats({ playerId: 'p1', playerName: 'Player' })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(1)
    expect(result[0].teamIds).toHaveLength(3)
  })

  it('håndterer undefined jerseyNumber', () => {
    const matchStats = [
      createMatchPlayerData({
        homeTeamStats: [createPlayerStats({ playerId: 'p1', jerseyNumber: undefined })],
      }),
    ]

    const result = rebuildPlayerCatalog(matchStats)

    expect(result).toHaveLength(1)
    expect(result[0].jerseyNumber).toBeUndefined()
  })
})
