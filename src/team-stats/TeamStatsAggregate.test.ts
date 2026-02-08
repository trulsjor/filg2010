import { describe, it, expect } from 'vitest'
import { TeamStatsAggregate } from './TeamStatsAggregate'
import type { PlayerStatsData, MatchPlayerData } from '../types/player-stats'

function createMatch(overrides: Partial<MatchPlayerData>): MatchPlayerData {
  return {
    matchId: 'default-id',
    matchDate: '01.01.2026',
    matchUrl: 'https://example.com',
    homeTeamId: '1',
    homeTeamName: 'Home',
    awayTeamId: '2',
    awayTeamName: 'Away',
    homeScore: 20,
    awayScore: 15,
    tournament: 'Default Tournament',
    homeTeamStats: [],
    awayTeamStats: [],
    scrapedAt: new Date().toISOString(),
    ...overrides,
  }
}

function createStatsData(matchStats: MatchPlayerData[]): PlayerStatsData {
  return {
    players: [],
    matchStats,
    matchesWithoutStats: [],
    lastUpdated: new Date().toISOString(),
  }
}

describe('TeamStatsAggregate.buildTeamDetailData', () => {
  const ourTeamIds = new Set(['531500'])

  it('finds match when team is home team with tournament filter', () => {
    const match = createMatch({
      matchId: '41031506007',
      matchDate: '31.01.2026',
      homeTeamId: '428829',
      homeTeamName: 'Bækkelaget',
      awayTeamId: '531500',
      awayTeamName: 'Fjellhammer',
      homeScore: 31,
      awayScore: 26,
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const statsData = createStatsData([match])
    const result = TeamStatsAggregate.buildTeamDetailData(
      '428829',
      statsData,
      [],
      ourTeamIds,
      'Gutter 15 Nivå 1 - A Sluttspill'
    )

    expect(result).not.toBeNull()
    expect(result!.matches).toHaveLength(1)
    expect(result!.matches[0].matchId).toBe('41031506007')
  })

  it('finds match when team is away team with tournament filter', () => {
    const match = createMatch({
      matchId: '41031506007',
      homeTeamId: '428829',
      homeTeamName: 'Bækkelaget',
      awayTeamId: '531500',
      awayTeamName: 'Fjellhammer',
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const statsData = createStatsData([match])
    const result = TeamStatsAggregate.buildTeamDetailData(
      '531500',
      statsData,
      [],
      ourTeamIds,
      'Gutter 15 Nivå 1 - A Sluttspill'
    )

    expect(result).not.toBeNull()
    expect(result!.matches).toHaveLength(1)
  })

  it('uses terminliste score over scraped score', () => {
    const match = createMatch({
      matchId: '41031506007',
      homeTeamId: '428829',
      homeTeamName: 'Bækkelaget',
      awayTeamId: '531500',
      awayTeamName: 'Fjellhammer',
      homeScore: 18,
      awayScore: 15,
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const terminliste = [
      { Kampnr: '41031506007', 'Kamp URL': 'https://example.com', 'H-B': '31-26' },
    ]

    const statsData = createStatsData([match])
    const result = TeamStatsAggregate.buildTeamDetailData(
      '428829',
      statsData,
      terminliste,
      ourTeamIds,
      'Gutter 15 Nivå 1 - A Sluttspill'
    )

    expect(result).not.toBeNull()
    expect(result!.matches[0].goalsScored).toBe(31)
    expect(result!.matches[0].goalsConceded).toBe(26)
  })

  it('shows both matches for Bækkelaget in sluttspill with real data structure', () => {
    const match1 = createMatch({
      matchId: '41031506002',
      matchDate: '25.01.2026',
      homeTeamId: '999999',
      homeTeamName: 'Kråkerøy',
      awayTeamId: '428829',
      awayTeamName: 'Bækkelaget',
      homeScore: 36,
      awayScore: 26,
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const match2 = createMatch({
      matchId: '41031506007',
      matchDate: '31.01.2026',
      homeTeamId: '428829',
      homeTeamName: 'Bækkelaget',
      awayTeamId: '531500',
      awayTeamName: 'Fjellhammer',
      homeScore: 18,
      awayScore: 15,
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const otherMatch = createMatch({
      matchId: 'other',
      homeTeamId: '111',
      awayTeamId: '222',
      tournament: 'Gutter 15 Nivå 1 - A Sluttspill',
    })

    const statsData = createStatsData([match1, match2, otherMatch])
    const result = TeamStatsAggregate.buildTeamDetailData(
      '428829',
      statsData,
      [],
      ourTeamIds,
      'Gutter 15 Nivå 1 - A Sluttspill'
    )

    expect(result).not.toBeNull()
    expect(result!.matches).toHaveLength(2)
    expect(result!.teamName).toBe('Bækkelaget')
    expect(result!.stats.matchCount).toBe(2)
    expect(result!.stats.losses).toBe(1)
    expect(result!.stats.wins).toBe(1)
  })

  it('works with real player-stats.json data', async () => {
    const statsData: PlayerStatsData = await import('../../data/player-stats.json')
    const terminliste = await import('../../data/terminliste.json')

    const result = TeamStatsAggregate.buildTeamDetailData(
      '428829',
      statsData,
      terminliste.default ?? terminliste,
      ourTeamIds,
      'Gutter 15 Nivå 1 - A Sluttspill'
    )

    expect(result).not.toBeNull()
    expect(result!.teamName).toBe('Bækkelaget')
    expect(result!.matches.length).toBeGreaterThanOrEqual(1)

    const fjellhammerMatch = result!.matches.find((m) => m.matchId === '41031506007')
    expect(fjellhammerMatch).toBeDefined()
    expect(fjellhammerMatch!.opponent).toBe('Fjellhammer')
    expect(fjellhammerMatch!.goalsScored).toBe(31)
    expect(fjellhammerMatch!.goalsConceded).toBe(26)
  })
})
