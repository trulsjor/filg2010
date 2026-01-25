import { describe, it, expect } from 'vitest'
import { PlayerStatsService } from './PlayerStatsAggregator'
import type { PlayerStatsData, MatchPlayerData, PlayerMatchStats } from '../types/player-stats.js'

const createPlayerStats = (overrides: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 'player-1',
  playerName: 'Test Spiller',
  jerseyNumber: 10,
  goals: 0,
  penaltyGoals: 0,
  twoMinutes: 0,
  yellowCards: 0,
  redCards: 0,
  ...overrides,
})

const createMatch = (overrides: Partial<MatchPlayerData> = {}): MatchPlayerData => ({
  matchId: 'match-1',
  matchDate: '01.01.2025',
  homeTeamId: 'team-1',
  homeTeamName: 'Hjemmelag',
  awayTeamId: 'team-2',
  awayTeamName: 'Bortelag',
  homeScore: 25,
  awayScore: 20,
  tournament: 'Regionserien',
  homeTeamStats: [],
  awayTeamStats: [],
  scrapedAt: '2025-01-01T12:00:00Z',
  ...overrides,
})

const createTestData = (matchStats: MatchPlayerData[]): PlayerStatsData => ({
  players: [],
  matchStats,
  matchesWithoutStats: [],
  lastUpdated: '2025-01-01T12:00:00Z',
})

describe('PlayerStatsService', () => {
  describe('generateAggregates', () => {
    it('genererer tom liste når ingen kamper finnes', () => {
      const data = createTestData([])
      const service = new PlayerStatsService(data)

      const result = service.generateAggregates()

      expect(result.aggregates).toHaveLength(0)
      expect(result.generatedAt).toBeDefined()
    })

    it('aggregerer spillerstatistikk fra en kamp', () => {
      const match = createMatch({
        homeTeamStats: [
          createPlayerStats({
            playerId: 'player-1',
            playerName: 'Ole Hansen',
            goals: 5,
            penaltyGoals: 2,
            twoMinutes: 1,
          }),
        ],
      })

      const service = new PlayerStatsService(createTestData([match]))
      const result = service.generateAggregates()

      expect(result.aggregates).toHaveLength(1)
      expect(result.aggregates[0]).toMatchObject({
        playerId: 'player-1',
        playerName: 'Ole Hansen',
        totalGoals: 5,
        totalPenaltyGoals: 2,
        totalTwoMinutes: 1,
        matchesPlayed: 1,
      })
    })

    it('summerer statistikk fra flere kamper for samme spiller', () => {
      const match1 = createMatch({
        matchId: 'match-1',
        matchDate: '01.01.2025',
        homeTeamStats: [
          createPlayerStats({
            playerId: 'player-1',
            goals: 3,
            twoMinutes: 1,
          }),
        ],
      })

      const match2 = createMatch({
        matchId: 'match-2',
        matchDate: '08.01.2025',
        homeTeamStats: [
          createPlayerStats({
            playerId: 'player-1',
            goals: 4,
            twoMinutes: 0,
          }),
        ],
      })

      const service = new PlayerStatsService(createTestData([match1, match2]))
      const result = service.generateAggregates()

      expect(result.aggregates).toHaveLength(1)
      expect(result.aggregates[0]).toMatchObject({
        totalGoals: 7,
        totalTwoMinutes: 1,
        matchesPlayed: 2,
        goalsPerMatch: 3.5,
      })
    })

    it('sorterer spillere etter totale mål (høyest først)', () => {
      const match = createMatch({
        homeTeamStats: [
          createPlayerStats({ playerId: 'player-1', playerName: 'Lavscorer', goals: 2 }),
          createPlayerStats({ playerId: 'player-2', playerName: 'Toppscorer', goals: 10 }),
          createPlayerStats({ playerId: 'player-3', playerName: 'Midtscorer', goals: 5 }),
        ],
      })

      const service = new PlayerStatsService(createTestData([match]))
      const result = service.generateAggregates()

      expect(result.aggregates).toHaveLength(3)
      expect(result.aggregates[0].playerName).toBe('Toppscorer')
      expect(result.aggregates[1].playerName).toBe('Midtscorer')
      expect(result.aggregates[2].playerName).toBe('Lavscorer')
    })

    it('grupperer statistikk per turnering', () => {
      const serieMatch = createMatch({
        matchId: 'match-1',
        tournament: 'Regionserien',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 3 })],
      })

      const cupMatch = createMatch({
        matchId: 'match-2',
        tournament: 'NM',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 5 })],
      })

      const service = new PlayerStatsService(createTestData([serieMatch, cupMatch]))
      const result = service.generateAggregates()

      expect(result.aggregates[0].byTournament).toHaveLength(2)
      expect(result.aggregates[0].byTournament).toContainEqual(
        expect.objectContaining({ tournament: 'Regionserien', goals: 3, matches: 1 })
      )
      expect(result.aggregates[0].byTournament).toContainEqual(
        expect.objectContaining({ tournament: 'NM', goals: 5, matches: 1 })
      )
    })

    it('håndterer spiller på både hjemme- og bortelag', () => {
      const homeMatch = createMatch({
        matchId: 'match-1',
        matchDate: '01.01.2025',
        homeTeamId: 'team-A',
        homeTeamName: 'Lag A',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 2 })],
      })

      const awayMatch = createMatch({
        matchId: 'match-2',
        matchDate: '08.01.2025',
        awayTeamId: 'team-A',
        awayTeamName: 'Lag A',
        awayTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 3 })],
      })

      const service = new PlayerStatsService(createTestData([homeMatch, awayMatch]))
      const result = service.generateAggregates()

      expect(result.aggregates).toHaveLength(1)
      expect(result.aggregates[0].totalGoals).toBe(5)
      expect(result.aggregates[0].matchesPlayed).toBe(2)
    })

    it('bruker nyeste draktnummer når spiller bytter nummer', () => {
      const oldMatch = createMatch({
        matchId: 'match-1',
        matchDate: '01.01.2025',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', jerseyNumber: 7 })],
      })

      const newMatch = createMatch({
        matchId: 'match-2',
        matchDate: '15.01.2025',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', jerseyNumber: 10 })],
      })

      const service = new PlayerStatsService(createTestData([oldMatch, newMatch]))
      const result = service.generateAggregates()

      expect(result.aggregates[0].jerseyNumber).toBe(10)
    })

    it('setter primærlag basert på siste kamp', () => {
      const oldTeamMatch = createMatch({
        matchId: 'match-1',
        matchDate: '01.01.2025',
        homeTeamId: 'old-team',
        homeTeamName: 'Gammelt Lag',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1' })],
      })

      const newTeamMatch = createMatch({
        matchId: 'match-2',
        matchDate: '15.01.2025',
        awayTeamId: 'new-team',
        awayTeamName: 'Nytt Lag',
        awayTeamStats: [createPlayerStats({ playerId: 'player-1' })],
      })

      const service = new PlayerStatsService(createTestData([oldTeamMatch, newTeamMatch]))
      const result = service.generateAggregates()

      expect(result.aggregates[0].teamId).toBe('new-team')
      expect(result.aggregates[0].teamName).toBe('Nytt Lag')
      expect(result.aggregates[0].teamIds).toContain('old-team')
      expect(result.aggregates[0].teamIds).toContain('new-team')
    })

    it('beregner goalsPerMatch korrekt', () => {
      const matches = [
        createMatch({
          matchId: 'match-1',
          homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 3 })],
        }),
        createMatch({
          matchId: 'match-2',
          homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 4 })],
        }),
        createMatch({
          matchId: 'match-3',
          homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 2 })],
        }),
      ]

      const service = new PlayerStatsService(createTestData(matches))
      const result = service.generateAggregates()

      expect(result.aggregates[0].goalsPerMatch).toBe(3)
    })
  })

  describe('filterByTeams', () => {
    it('filtrerer spillere basert på lag', () => {
      const match = createMatch({
        homeTeamId: 'team-A',
        awayTeamId: 'team-B',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', playerName: 'Spiller A' })],
        awayTeamStats: [createPlayerStats({ playerId: 'player-2', playerName: 'Spiller B' })],
      })

      const service = new PlayerStatsService(createTestData([match]))
      const aggregates = service.generateAggregates()
      const filtered = service.filterByTeams(aggregates.aggregates, ['team-A'])

      expect(filtered).toHaveLength(1)
      expect(filtered[0].playerName).toBe('Spiller A')
    })
  })

  describe('filterByTournament', () => {
    it('filtrerer og returnerer kun turneringsstatistikk', () => {
      const serieMatch = createMatch({
        matchId: 'match-1',
        tournament: 'Regionserien',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 10 })],
      })

      const cupMatch = createMatch({
        matchId: 'match-2',
        tournament: 'NM',
        homeTeamStats: [createPlayerStats({ playerId: 'player-1', goals: 2 })],
      })

      const service = new PlayerStatsService(createTestData([serieMatch, cupMatch]))
      const aggregates = service.generateAggregates()
      const filtered = service.filterByTournament(aggregates.aggregates, 'Regionserien')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].totalGoals).toBe(10)
      expect(filtered[0].matchesPlayed).toBe(1)
    })
  })
})
