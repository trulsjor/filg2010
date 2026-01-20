import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ScraperService } from './scraper.service'

interface MockPage {
  goto: ReturnType<typeof vi.fn>
  click: ReturnType<typeof vi.fn>
  waitForTimeout: ReturnType<typeof vi.fn>
  evaluate: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

interface MockBrowser {
  newPage: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
}

function createMockPage(evaluateResult: unknown): MockPage {
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockRejectedValue(new Error('timeout')),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(evaluateResult),
    close: vi.fn().mockResolvedValue(undefined),
  }
}

function createMockBrowser(page: MockPage): MockBrowser {
  return {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }
}

const { mockLaunch } = vi.hoisted(() => ({
  mockLaunch: vi.fn<() => Promise<MockBrowser>>(),
}))

vi.mock('playwright', () => ({
  chromium: {
    launch: mockLaunch,
  },
}))

describe('ScraperService', () => {
  let scraper: ScraperService
  let mockPage: MockPage
  let mockBrowser: MockBrowser

  beforeEach(() => {
    vi.clearAllMocks()
    scraper = new ScraperService()
  })

  afterEach(async () => {
    await scraper.close()
  })

  describe('scrapeTeamPage', () => {
    it('parser kamplenker fra HTML-struktur', async () => {
      const fakeScrapedData = {
        matchLinks: [
          {
            kampnr: '123456789',
            kampUrl: 'https://handball.no/kamp/123',
            hjemmelagUrl: 'https://handball.no/lag/1',
            bortelagUrl: 'https://handball.no/lag/2',
          },
          {
            kampnr: '987654321',
            kampUrl: 'https://handball.no/kamp/456',
            hjemmelagUrl: 'https://handball.no/lag/3',
            bortelagUrl: 'https://handball.no/lag/4',
          },
        ],
        tournamentLinks: [
          { name: 'Regionserien', url: 'https://handball.no/turnering?turnid=123' },
        ],
      }

      mockPage = createMockPage(fakeScrapedData)
      mockBrowser = createMockBrowser(mockPage)
      mockLaunch.mockResolvedValue(mockBrowser)

      const result = await scraper.scrapeTeamPage({
        lagid: '12345',
        name: 'Testlag',
        seasonId: '2024',
        color: '#fff',
      })

      expect(result.matchLinks.size).toBe(2)
      expect(result.matchLinks.get('123456789')).toEqual({
        kampnr: '123456789',
        kampUrl: 'https://handball.no/kamp/123',
        hjemmelagUrl: 'https://handball.no/lag/1',
        bortelagUrl: 'https://handball.no/lag/2',
      })
      expect(result.tournamentLinks.size).toBe(1)
      expect(result.tournamentLinks.get('Regionserien')).toBe(
        'https://handball.no/turnering?turnid=123'
      )
    })

    it('håndterer tom respons', async () => {
      const fakeScrapedData = {
        matchLinks: [],
        tournamentLinks: [],
      }

      mockPage = createMockPage(fakeScrapedData)
      mockBrowser = createMockBrowser(mockPage)
      mockLaunch.mockResolvedValue(mockBrowser)

      const result = await scraper.scrapeTeamPage({
        lagid: '12345',
        name: 'Testlag',
        seasonId: '2024',
        color: '#fff',
      })

      expect(result.matchLinks.size).toBe(0)
      expect(result.tournamentLinks.size).toBe(0)
    })

    it('dedupliserer kamplenker med samme kampnr', async () => {
      const fakeScrapedData = {
        matchLinks: [
          { kampnr: '123456789', kampUrl: 'https://handball.no/kamp/123' },
          { kampnr: '123456789', kampUrl: 'https://handball.no/kamp/duplicate' },
        ],
        tournamentLinks: [],
      }

      mockPage = createMockPage(fakeScrapedData)
      mockBrowser = createMockBrowser(mockPage)
      mockLaunch.mockResolvedValue(mockBrowser)

      const result = await scraper.scrapeTeamPage({
        lagid: '12345',
        name: 'Testlag',
        seasonId: '2024',
        color: '#fff',
      })

      expect(result.matchLinks.size).toBe(1)
      expect(result.matchLinks.get('123456789')?.kampUrl).toBe('https://handball.no/kamp/123')
    })
  })

  describe('scrapeAllTeams', () => {
    it('kombinerer resultater fra flere lag', async () => {
      const fakeScrapedData1 = {
        matchLinks: [{ kampnr: '111111111', kampUrl: 'https://handball.no/kamp/1' }],
        tournamentLinks: [{ name: 'Turnering A', url: 'https://handball.no/turn/a' }],
      }

      const fakeScrapedData2 = {
        matchLinks: [{ kampnr: '222222222', kampUrl: 'https://handball.no/kamp/2' }],
        tournamentLinks: [{ name: 'Turnering B', url: 'https://handball.no/turn/b' }],
      }

      let callCount = 0
      const mockPageFactory = (): MockPage => {
        callCount++
        return createMockPage(callCount === 1 ? fakeScrapedData1 : fakeScrapedData2)
      }

      mockBrowser = {
        newPage: vi.fn().mockImplementation(mockPageFactory),
        close: vi.fn().mockResolvedValue(undefined),
      }
      mockLaunch.mockResolvedValue(mockBrowser)

      const teams = [
        { lagid: '1', name: 'Lag 1', seasonId: '2024', color: '#fff' },
        { lagid: '2', name: 'Lag 2', seasonId: '2024', color: '#000' },
      ]

      const result = await scraper.scrapeAllTeams(teams, 1)

      expect(result.matchLinksPerTeam.size).toBe(2)
      expect(result.matchLinksPerTeam.get('1')?.size).toBe(1)
      expect(result.matchLinksPerTeam.get('2')?.size).toBe(1)
      expect(result.allTournamentLinks.size).toBe(2)
    })
  })

  describe('close', () => {
    it('lukker browser', async () => {
      mockPage = createMockPage({ matchLinks: [], tournamentLinks: [] })
      mockBrowser = createMockBrowser(mockPage)
      mockLaunch.mockResolvedValue(mockBrowser)

      await scraper.scrapeTeamPage({
        lagid: '12345',
        name: 'Testlag',
        seasonId: '2024',
        color: '#fff',
      })

      await scraper.close()

      expect(mockBrowser.close).toHaveBeenCalled()
    })
  })
})
