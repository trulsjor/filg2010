import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HandballScraper } from './handball-scraper'

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

const { mockLaunch } = vi.hoisted(() => ({
  mockLaunch: vi.fn<() => Promise<MockBrowser>>(),
}))

vi.mock('playwright', () => ({
  chromium: {
    launch: mockLaunch,
  },
}))

describe('HandballScraper.scrapeTournamentPlayedMatches', () => {
  let scraper: HandballScraper
  let mockPage: MockPage
  let mockBrowser: MockBrowser

  const fakeMatches = [
    {
      matchId: '41031506009',
      matchUrl: 'https://www.handball.no/system/kamper/kamp/?matchid=8330559',
    },
    {
      matchId: '41031506007',
      matchUrl: 'https://www.handball.no/system/kamper/kamp/?matchid=8330554',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    scraper = new HandballScraper()
  })

  afterEach(async () => {
    await scraper.close()
  })

  function setupMockPage(clickBehavior: (selector: string) => boolean, evaluateResult: unknown) {
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockImplementation((selector: string) => {
        if (clickBehavior(selector)) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('timeout'))
      }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(evaluateResult),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockLaunch.mockResolvedValue(mockBrowser)
  }

  it('uses exact match selectors - "Kamper" click does not match "Alle kamper"', async () => {
    const clickedSelectors: string[] = []

    setupMockPage((selector) => {
      clickedSelectors.push(selector)
      // Simulate: "Alle kamper" tab doesn't exist, "Kamper" tab exists
      return selector === 'text="Kamper"'
    }, fakeMatches)

    await scraper.scrapeTournamentPlayedMatches('https://handball.no/turnering?turnid=123')

    // Verify exact match selectors are used (with quotes)
    expect(clickedSelectors).toContain('text="Alle kamper"')
    expect(clickedSelectors).toContain('text="Kamper"')
    // Should NOT use substring selectors (without quotes)
    expect(clickedSelectors).not.toContain('text=Alle kamper')
    expect(clickedSelectors).not.toContain('text=Kamper')
  })

  it('returns matches from "Alle kamper" tab when available', async () => {
    setupMockPage(
      (selector) => selector === 'text="Alle kamper"' || selector.includes('AKSEPTER'),
      fakeMatches
    )

    const result = await scraper.scrapeTournamentPlayedMatches(
      'https://handball.no/turnering?turnid=123'
    )

    expect(result).toEqual(fakeMatches)
    // Should not try "Kamper" since "Alle kamper" returned matches
    const clickCalls = mockPage.click.mock.calls.map((c: unknown[]) => c[0])
    expect(clickCalls).not.toContain('text="Kamper"')
  })

  it('falls back to "Kamper" tab when "Alle kamper" returns no matches', async () => {
    let evaluateCallCount = 0
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockImplementation((selector: string) => {
        if (selector === 'text="Alle kamper"' || selector === 'text="Kamper"') {
          return Promise.resolve()
        }
        return Promise.reject(new Error('timeout'))
      }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockImplementation(() => {
        evaluateCallCount++
        // First call (after "Alle kamper") returns empty, second (after "Kamper") returns matches
        return Promise.resolve(evaluateCallCount === 1 ? [] : fakeMatches)
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockLaunch.mockResolvedValue(mockBrowser)

    const result = await scraper.scrapeTournamentPlayedMatches(
      'https://handball.no/turnering?turnid=123'
    )

    expect(result).toEqual(fakeMatches)
    const clickCalls = mockPage.click.mock.calls.map((c: unknown[]) => c[0])
    expect(clickCalls).toContain('text="Alle kamper"')
    expect(clickCalls).toContain('text="Kamper"')
  })

  it('falls back to "Siste kamper" when both "Alle kamper" and "Kamper" return no matches', async () => {
    let evaluateCallCount = 0
    mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      click: vi.fn().mockImplementation((selector: string) => {
        if (
          selector === 'text="Alle kamper"' ||
          selector === 'text="Kamper"' ||
          selector === 'text="Siste kamper"'
        ) {
          return Promise.resolve()
        }
        return Promise.reject(new Error('timeout'))
      }),
      waitForTimeout: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockImplementation(() => {
        evaluateCallCount++
        // Only third call (after "Siste kamper") returns matches
        return Promise.resolve(evaluateCallCount === 3 ? fakeMatches : [])
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    }
    mockLaunch.mockResolvedValue(mockBrowser)

    const result = await scraper.scrapeTournamentPlayedMatches(
      'https://handball.no/turnering?turnid=123'
    )

    expect(result).toEqual(fakeMatches)
    const clickCalls = mockPage.click.mock.calls.map((c: unknown[]) => c[0])
    expect(clickCalls).toContain('text="Siste kamper"')
  })

  it('falls back to "Kamper" when "Alle kamper" tab does not exist', async () => {
    setupMockPage((selector) => {
      // "Alle kamper" tab doesn't exist on this page, only "Kamper"
      return selector === 'text="Kamper"'
    }, fakeMatches)

    const result = await scraper.scrapeTournamentPlayedMatches(
      'https://handball.no/turnering?turnid=123'
    )

    expect(result).toEqual(fakeMatches)
  })
})
