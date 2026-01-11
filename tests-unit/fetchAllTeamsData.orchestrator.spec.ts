import { describe, it, expect } from 'vitest'
import type { Match, MatchLink, Team, RawMatchData } from '../src/types/index.js'
import { runFetchPipeline } from '../src/scripts/fetchAllTeamsData.js'

type SavedMetadata = {
  lastUpdated: string
  teamsCount: number
  matchesCount: number
}

class MockFileService {
  ensureDataDirectoryCalled = 0
  savedMatches: Match[] = []
  savedMetadata: SavedMetadata | null = null
  constructor(private readonly teams: Team[]) {}

  ensureDataDirectory() {
    this.ensureDataDirectoryCalled += 1
  }

  loadConfig() {
    return { teams: this.teams }
  }

  saveMatches(matches: Match[]) {
    this.savedMatches = matches
  }

  saveMetadata(metadata: SavedMetadata) {
    this.savedMetadata = metadata
  }

  getMatchesPath() {
    return '/tmp/terminliste.json'
  }
}

class MockScraperService {
  scrapeAllTeamsCalls: Team[][] = []
  closeCalled = false
  constructor(
    private readonly tournamentMap: Map<string, string>,
    private readonly linkMaps: Record<string, Map<string, MatchLink>>
  ) {}

  async scrapeAllTeams(teams: Team[]) {
    this.scrapeAllTeamsCalls.push(teams)
    const matchLinksPerTeam = new Map<string, Map<string, MatchLink>>()
    for (const team of teams) {
      matchLinksPerTeam.set(team.lagid, this.linkMaps[team.lagid] ?? new Map())
    }
    return {
      matchLinksPerTeam,
      allTournamentLinks: this.tournamentMap,
    }
  }

  async close() {
    this.closeCalled = true
  }
}

class MockHandballApiService {
  fetchCalls: Team[] = []
  constructor(private readonly data: Record<string, Partial<RawMatchData>[]>) {}

  async fetchTeamSchedule(team: Team) {
    this.fetchCalls.push(team)
    return this.data[team.lagid] ?? []
  }
}

describe('runFetchPipeline', () => {
  it('orchestrates services and saves sorted matches with metadata', async () => {
    const teams: Team[] = [
      { name: 'Team A', lagid: 'A1', seasonId: '2025', color: '#fff000' },
      { name: 'Team B', lagid: 'B2', seasonId: '2025', color: '#000fff' },
    ]

    const apiData: Record<string, Partial<RawMatchData>[]> = {
      A1: [{ Kampnr: ' 123 ', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Cup' }],
      B2: [{ Kampnr: '456', Dato: '10.09.2025', Tid: '18:00', Turnering: 'Seriespill' }],
    }

    const tournamentMap = new Map<string, string>([
      ['Cup', 'https://cup'],
      ['Seriespill', 'https://seriespill'],
    ])

    const matchLinks: Record<string, Map<string, MatchLink>> = {
      A1: new Map([['123', { kampnr: '123', kampUrl: 'https://kamp1' }]]),
      B2: new Map([
        ['456', { kampnr: '456', kampUrl: 'https://kamp2', hjemmelagUrl: 'https://lagA' }],
      ]),
    }

    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(tournamentMap, matchLinks)
    const apiService = new MockHandballApiService(apiData)

    const sortCalls: Match[][] = []
    const sortMatches = (matches: Match[]) => {
      sortCalls.push(matches)
      return matches.slice().reverse()
    }

    const now = () => new Date('2024-12-24T14:00:00.000Z')

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      sortMatches,
      now,
      logger: { info: () => {}, error: () => {} },
    })

    // Verify services were called correctly
    expect(fileService.ensureDataDirectoryCalled).toBe(1)
    expect(scraperService.scrapeAllTeamsCalls).toHaveLength(1)
    expect(scraperService.scrapeAllTeamsCalls[0]).toEqual(teams)
    expect(apiService.fetchCalls).toHaveLength(2)

    // Verify sorting was applied
    expect(sortCalls).toHaveLength(1)
    expect(sortCalls[0]).toHaveLength(2)

    // Verify saved matches have correct data
    expect(fileService.savedMatches).toHaveLength(2)
    expect(fileService.savedMatches[0].Kampnr).toBe('456')
    expect(fileService.savedMatches[0]['Kamp URL']).toBe('https://kamp2')
    expect(fileService.savedMatches[0]['Turnering URL']).toBe('https://seriespill')
    expect(fileService.savedMatches[1].Lag).toBe('Team A')
    expect(fileService.savedMatches[1].Kampnr).toBe('123')
    expect(fileService.savedMatches[1]['Kamp URL']).toBe('https://kamp1')

    // Verify metadata
    expect(fileService.savedMetadata).not.toBeNull()
    expect(fileService.savedMetadata?.matchesCount).toBe(2)
    expect(fileService.savedMetadata?.teamsCount).toBe(2)
    expect(fileService.savedMetadata?.lastUpdated).toBe('2024-12-24T14:00:00.000Z')
  })

  it('continues processing other teams when API fails for one team', async () => {
    const teams: Team[] = [
      { name: 'Team A', lagid: 'A1', seasonId: '2025', color: '#fff000' },
      { name: 'Team B', lagid: 'B2', seasonId: '2025', color: '#000fff' },
    ]

    const apiData: Record<string, Partial<RawMatchData>[]> = {
      A1: [{ Kampnr: ' 123 ', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Cup' }],
    }

    class PartiallyFailingApiService extends MockHandballApiService {
      async fetchTeamSchedule(team: Team) {
        if (team.lagid === 'B2') {
          throw new Error('Failed to fetch B2')
        }
        return super.fetchTeamSchedule(team)
      }
    }

    const tournamentMap = new Map<string, string>([['Cup', 'https://cup']])
    const matchLinks: Record<string, Map<string, MatchLink>> = {
      A1: new Map([['123', { kampnr: '123', kampUrl: 'https://kamp1' }]]),
      B2: new Map(),
    }

    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(tournamentMap, matchLinks)
    const apiService = new PartiallyFailingApiService(apiData)

    const errorMessages: string[] = []

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      logger: {
        info: () => {},
        error: (message) => {
          errorMessages.push(String(message))
        },
      },
    })

    // Should log error for failed team (uses team.name, not lagid)
    expect(errorMessages.some((msg) => msg.includes('Team B'))).toBeTruthy()

    // Should still save successful team's matches
    expect(fileService.savedMatches).toHaveLength(1)
    expect(fileService.savedMatches[0].Lag).toBe('Team A')
    expect(fileService.savedMetadata?.matchesCount).toBe(1)
  })

  it('handles empty teams list', async () => {
    const teams: Team[] = []
    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(new Map(), {})
    const apiService = new MockHandballApiService({})

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      logger: { info: () => {}, error: () => {} },
    })

    expect(fileService.savedMatches).toHaveLength(0)
    expect(fileService.savedMetadata?.matchesCount).toBe(0)
    expect(fileService.savedMetadata?.teamsCount).toBe(0)
  })

  it('trims kampnr whitespace when matching links', async () => {
    const teams: Team[] = [{ name: 'Team A', lagid: 'A1', seasonId: '2025', color: '#fff000' }]

    // API returns kampnr with whitespace
    const apiData: Record<string, Partial<RawMatchData>[]> = {
      A1: [{ Kampnr: '  999  ', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Cup' }],
    }

    // Links are stored with trimmed kampnr
    const matchLinks: Record<string, Map<string, MatchLink>> = {
      A1: new Map([['999', { kampnr: '999', kampUrl: 'https://kamp999' }]]),
    }

    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(new Map([['Cup', 'https://cup']]), matchLinks)
    const apiService = new MockHandballApiService(apiData)

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      logger: { info: () => {}, error: () => {} },
    })

    // Should match despite whitespace
    expect(fileService.savedMatches[0].Kampnr).toBe('999')
    expect(fileService.savedMatches[0]['Kamp URL']).toBe('https://kamp999')
  })

  it('matches tournament URLs by name', async () => {
    const teams: Team[] = [{ name: 'Team A', lagid: 'A1', seasonId: '2025', color: '#fff000' }]

    const apiData: Record<string, Partial<RawMatchData>[]> = {
      A1: [{ Kampnr: '111', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Regionserien G15' }],
    }

    const tournamentMap = new Map([['Regionserien G15', 'https://regionserien-g15']])

    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(tournamentMap, { A1: new Map() })
    const apiService = new MockHandballApiService(apiData)

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      logger: { info: () => {}, error: () => {} },
    })

    expect(fileService.savedMatches[0]['Turnering URL']).toBe('https://regionserien-g15')
  })
})
