import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResultFetcherService } from './result-fetcher.service'

describe('ResultFetcherService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseResultFromHtml (via fetchResult)', () => {
    it('parser resultat fra handball.no HTML-format', async () => {
      const mockHtml = `
        <div class="nameresult">
          <th class="small-4 text-center" style="background: #001E5F"><b>27</b></th>
          <th class="small-4 text-center" style="background: #001E5F"><b>22</b></th>
        </div>
      `

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      })

      const fetcher = new ResultFetcherService()
      const result = await fetcher.fetchResult('https://handball.no/kamp?matchid=12345')

      expect(result).toEqual({
        matchId: '12345',
        homeScore: 27,
        awayScore: 22,
        result: '27-22',
      })
    })

    it('returnerer null når ingen resultat i HTML', async () => {
      const mockHtml = '<div>No scores here</div>'

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      })

      const fetcher = new ResultFetcherService()
      const result = await fetcher.fetchResult('https://handball.no/kamp?matchid=12345')

      expect(result).toBeNull()
    })

    it('returnerer null ved HTTP-feil', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })

      const fetcher = new ResultFetcherService()
      const result = await fetcher.fetchResult('https://handball.no/kamp?matchid=12345')

      expect(result).toBeNull()
    })

    it('returnerer null ved ugyldig URL uten matchid', async () => {
      const fetcher = new ResultFetcherService()
      const result = await fetcher.fetchResult('https://handball.no/noe-annet')

      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('fetchMultipleResults', () => {
    it('henter flere resultater med rate-limiting', async () => {
      const mockHtml = (score1: number, score2: number) => `
        <th class="small-4 text-center"><b>${score1}</b></th>
        <th class="small-4 text-center"><b>${score2}</b></th>
      `

      let callCount = 0
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++
        const scores = callCount === 1 ? [30, 25] : [28, 22]
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockHtml(scores[0], scores[1])),
        })
      })

      const fetcher = new ResultFetcherService({ delayMs: 10 })
      const results = await fetcher.fetchMultipleResults([
        'https://handball.no/kamp?matchid=111',
        'https://handball.no/kamp?matchid=222',
      ])

      expect(results.size).toBe(2)
      expect(results.get('111')?.result).toBe('30-25')
      expect(results.get('222')?.result).toBe('28-22')
    })

    it('kaller onProgress callback', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () =>
          Promise.resolve(
            '<th class="small-4 text-center"><b>1</b></th><th class="small-4 text-center"><b>2</b></th>'
          ),
      })

      const onProgress = vi.fn()
      const fetcher = new ResultFetcherService({ delayMs: 0 })

      await fetcher.fetchMultipleResults(
        ['https://handball.no/kamp?matchid=1', 'https://handball.no/kamp?matchid=2'],
        onProgress
      )

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2)
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2)
    })
  })
})
