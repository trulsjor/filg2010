import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateResults } from './updateResults'
import type { Match } from '../types/index.js'
import type { MatchResult } from '../handball/result-scraper.service.js'

interface MockFileService {
  loadMatches: () => Match[]
  saveMatches: ReturnType<typeof vi.fn>
  saveMetadata: ReturnType<typeof vi.fn>
}

interface MockScraperService {
  fetchMultipleResults: ReturnType<typeof vi.fn>
}

const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
  Dato: '01.01.2025',
  Tid: '18:00',
  Kampnr: '1',
  Hjemmelag: 'Fjellhammer',
  Bortelag: 'Motstander',
  'H-B': '-',
  Bane: 'Fjellhammerhallen',
  Tilskuere: 0,
  Arrangør: 'Test',
  Turnering: 'Regionserien',
  'Turnering URL': 'https://handball.no/turnering/123',
  Lag: 'Fjellhammer',
  'Kamp URL': 'https://handball.no/kamp?matchid=12345',
  'Hjemmelag URL': 'https://handball.no/lag/1',
  'Bortelag URL': 'https://handball.no/lag/2',
  ...overrides,
})

describe('updateResults', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('når ingen kamper trenger oppdatering', () => {
    it('returnerer tomt affectedTournaments map', async () => {
      const matchWithResult = createMockMatch({ 'H-B': '25-20' })

      const mockFileService: MockFileService = {
        loadMatches: () => [matchWithResult],
        saveMatches: vi.fn(),
        saveMetadata: vi.fn(),
      }

      const result = await updateResults({
        fileService: mockFileService,
        logger: mockLogger,
        now: () => new Date('2025-01-15'),
      })

      expect(result.updated).toBe(0)
      expect(result.affectedTournaments.size).toBe(0)
    })

    it('kaller ikke saveMatches når ingen oppdateringer', async () => {
      const matchWithResult = createMockMatch({ 'H-B': '25-20' })

      const mockFileService: MockFileService = {
        loadMatches: () => [matchWithResult],
        saveMatches: vi.fn(),
        saveMetadata: vi.fn(),
      }

      await updateResults({
        fileService: mockFileService,
        logger: mockLogger,
        now: () => new Date('2025-01-15'),
      })

      expect(mockFileService.saveMatches).not.toHaveBeenCalled()
    })
  })

  describe('når kamper blir oppdatert', () => {
    it('returnerer berørte turneringer i affectedTournaments', async () => {
      const matchNeedingUpdate = createMockMatch({
        Dato: '01.01.2025',
        'H-B': '-',
        Turnering: 'Regionserien Gutter 15',
        'Turnering URL': 'https://handball.no/turnering/456',
      })

      const mockFileService: MockFileService = {
        loadMatches: () => [matchNeedingUpdate],
        saveMatches: vi.fn(),
        saveMetadata: vi.fn(),
      }

      const mockScraperService: MockScraperService = {
        fetchMultipleResults: vi
          .fn()
          .mockResolvedValue(
            new Map([['12345', { matchId: '12345', result: '30-25' } as MatchResult]])
          ),
      }

      const result = await updateResults({
        fileService: mockFileService,
        scraperService: mockScraperService,
        logger: mockLogger,
        now: () => new Date('2025-01-15'),
      })

      expect(result.updated).toBe(1)
      expect(result.affectedTournaments.size).toBe(1)
      expect(result.affectedTournaments.get('https://handball.no/turnering/456')).toBe(
        'Regionserien Gutter 15'
      )
    })

    it('ekskluderer cup-turneringer fra affectedTournaments', async () => {
      const cupMatch = createMockMatch({
        Dato: '01.01.2025',
        'H-B': '-',
        Turnering: 'Regionscup Gutter 15',
        'Turnering URL': 'https://handball.no/turnering/789',
      })

      const mockFileService: MockFileService = {
        loadMatches: () => [cupMatch],
        saveMatches: vi.fn(),
        saveMetadata: vi.fn(),
      }

      const mockScraperService: MockScraperService = {
        fetchMultipleResults: vi
          .fn()
          .mockResolvedValue(
            new Map([['12345', { matchId: '12345', result: '30-25' } as MatchResult]])
          ),
      }

      const result = await updateResults({
        fileService: mockFileService,
        scraperService: mockScraperService,
        logger: mockLogger,
        now: () => new Date('2025-01-15'),
      })

      expect(result.updated).toBe(1)
      expect(result.affectedTournaments.size).toBe(0)
    })

    it('samler unike turneringer når flere kamper oppdateres', async () => {
      const match1 = createMockMatch({
        Dato: '01.01.2025',
        'H-B': '-',
        'Kamp URL': 'https://handball.no/kamp?matchid=111',
        Turnering: 'Regionserien',
        'Turnering URL': 'https://handball.no/turnering/A',
      })
      const match2 = createMockMatch({
        Dato: '02.01.2025',
        'H-B': '-',
        'Kamp URL': 'https://handball.no/kamp?matchid=222',
        Turnering: 'Regionserien',
        'Turnering URL': 'https://handball.no/turnering/A',
      })
      const match3 = createMockMatch({
        Dato: '03.01.2025',
        'H-B': '-',
        'Kamp URL': 'https://handball.no/kamp?matchid=333',
        Turnering: 'Sluttspill',
        'Turnering URL': 'https://handball.no/turnering/B',
      })

      const mockFileService: MockFileService = {
        loadMatches: () => [match1, match2, match3],
        saveMatches: vi.fn(),
        saveMetadata: vi.fn(),
      }

      const mockScraperService: MockScraperService = {
        fetchMultipleResults: vi.fn().mockResolvedValue(
          new Map([
            ['111', { matchId: '111', result: '30-25' } as MatchResult],
            ['222', { matchId: '222', result: '28-22' } as MatchResult],
            ['333', { matchId: '333', result: '35-30' } as MatchResult],
          ])
        ),
      }

      const result = await updateResults({
        fileService: mockFileService,
        scraperService: mockScraperService,
        logger: mockLogger,
        now: () => new Date('2025-01-15'),
      })

      expect(result.updated).toBe(3)
      expect(result.affectedTournaments.size).toBe(2)
      expect(result.affectedTournaments.has('https://handball.no/turnering/A')).toBe(true)
      expect(result.affectedTournaments.has('https://handball.no/turnering/B')).toBe(true)
    })
  })
})
