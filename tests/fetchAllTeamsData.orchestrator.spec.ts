import { test, expect } from '@playwright/test'
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
  tournamentCalls: Team[][] = []
  matchCalls: string[] = []
  constructor(
    private readonly tournamentMap: Map<string, string>,
    private readonly linkMaps: Record<string, Map<string, MatchLink>>
  ) {}

  async scrapeTournamentLinks(teams: Team[]) {
    this.tournamentCalls.push(teams)
    return this.tournamentMap
  }

  async scrapeMatchLinks(lagid: string) {
    this.matchCalls.push(lagid)
    return this.linkMaps[lagid] ?? new Map()
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

test.describe('runFetchPipeline', () => {
  test('orchestrates services and saves sorted matches with metadata', async () => {
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

    expect(fileService.ensureDataDirectoryCalled).toBe(1)
    expect(scraperService.tournamentCalls).toHaveLength(1)
    expect(scraperService.tournamentCalls[0]).toEqual(teams)
    expect(scraperService.matchCalls).toEqual(['A1', 'B2'])
    expect(apiService.fetchCalls).toEqual(teams)

    expect(sortCalls).toHaveLength(1)
    expect(sortCalls[0]).toHaveLength(2)

    expect(fileService.savedMatches).toHaveLength(2)
    expect(fileService.savedMatches[0].Kampnr).toBe('456')
    expect(fileService.savedMatches[0]['Kamp URL']).toBe('https://kamp2')
    expect(fileService.savedMatches[0]['Turnering URL']).toBe('https://seriespill')
    expect(fileService.savedMatches[1].Lag).toBe('Team A')
    expect(fileService.savedMatches[1].Kampnr).toBe('123')
    expect(fileService.savedMatches[1]['Kamp URL']).toBe('https://kamp1')

    expect(fileService.savedMetadata).not.toBeNull()
    expect(fileService.savedMetadata?.matchesCount).toBe(2)
    expect(fileService.savedMetadata?.teamsCount).toBe(2)
    expect(fileService.savedMetadata?.lastUpdated).toBe('2024-12-24T14:00:00.000Z')
  })

  test('continues processing other teams when one fails', async () => {
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

    expect(errorMessages.some((msg) => msg.includes('B2'))).toBeTruthy()
    expect(fileService.savedMatches).toHaveLength(1)
    expect(fileService.savedMatches[0].Lag).toBe('Team A')
    expect(fileService.savedMetadata?.matchesCount).toBe(1)
  })

  test('respects team concurrency limit', async () => {
    const teams: Team[] = [
      { name: 'Team A', lagid: 'A1', seasonId: '2025', color: '#fff000' },
      { name: 'Team B', lagid: 'B2', seasonId: '2025', color: '#000fff' },
      { name: 'Team C', lagid: 'C3', seasonId: '2025', color: '#ff00ff' },
    ]

    const apiData: Record<string, Partial<RawMatchData>[]> = {
      A1: [{ Kampnr: '111', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Cup' }],
      B2: [{ Kampnr: '222', Dato: '15.09.2025', Tid: '12:00', Turnering: 'Cup' }],
      C3: [{ Kampnr: '333', Dato: '16.09.2025', Tid: '14:00', Turnering: 'Cup' }],
    }

    class ConcurrencyTrackingApiService extends MockHandballApiService {
      inFlight = 0
      maxInFlight = 0

      async fetchTeamSchedule(team: Team) {
        this.inFlight += 1
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight)
        await delay(20)
        const result = await super.fetchTeamSchedule(team)
        this.inFlight -= 1
        return result
      }
    }

    const tournamentMap = new Map<string, string>([['Cup', 'https://cup']])
    const matchLinks: Record<string, Map<string, MatchLink>> = {
      A1: new Map([['111', { kampnr: '111', kampUrl: 'https://kamp111' }]]),
      B2: new Map([['222', { kampnr: '222', kampUrl: 'https://kamp222' }]]),
      C3: new Map([['333', { kampnr: '333', kampUrl: 'https://kamp333' }]]),
    }

    const fileService = new MockFileService(teams)
    const scraperService = new MockScraperService(tournamentMap, matchLinks)
    const apiService = new ConcurrencyTrackingApiService(apiData)

    await runFetchPipeline({
      fileService,
      scraperService,
      apiService,
      sortMatches: (matches) => matches,
      teamConcurrency: 2,
      logger: { info: () => {}, error: () => {} },
    })

    expect(apiService.maxInFlight).toBe(2)
    expect(fileService.savedMatches).toHaveLength(3)
  })
})

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
