import { describe, it, expect } from 'vitest'
import { mergeCupMatches } from './merge-cup-matches'
import type { Match } from '../types/index'

function makeMatch(overrides: Partial<Match>): Match {
  return {
    Lag: 'Fjellhammer G15 1',
    Dato: '1.1.2026',
    Tid: '10:00',
    Kampnr: '123',
    Hjemmelag: 'Team A',
    Bortelag: 'Team B',
    'H-B': '-',
    Bane: 'Hall 1',
    Arrangør: 'NHF',
    Turnering: 'Serie',
    ...overrides,
  }
}

describe('mergeCupMatches', () => {
  it('adds cup matches to empty terminliste', () => {
    const cupMatches = [makeMatch({ Kampnr: 'pwcup-48', Turnering: 'Peter Wessel Cup 2026' })]
    const result = mergeCupMatches([], cupMatches, 'Peter Wessel Cup 2026')

    expect(result).toHaveLength(1)
    expect(result[0].Kampnr).toBe('pwcup-48')
  })

  it('merges cup matches with existing serie matches sorted by date', () => {
    const existing = [
      makeMatch({ Kampnr: '100', Dato: '20.3.2026', Tid: '18:00' }),
      makeMatch({ Kampnr: '200', Dato: '5.4.2026', Tid: '14:00' }),
    ]
    const cupMatches = [
      makeMatch({
        Kampnr: 'pwcup-48',
        Dato: '28.3.2026',
        Tid: '08:00',
        Turnering: 'Peter Wessel Cup 2026',
      }),
    ]

    const result = mergeCupMatches(existing, cupMatches, 'Peter Wessel Cup 2026')

    expect(result).toHaveLength(3)
    expect(result[0].Kampnr).toBe('100')
    expect(result[1].Kampnr).toBe('pwcup-48')
    expect(result[2].Kampnr).toBe('200')
  })

  it('replaces old cup matches with new ones (idempotent)', () => {
    const existing = [
      makeMatch({ Kampnr: '100', Dato: '20.3.2026' }),
      makeMatch({
        Kampnr: 'pwcup-48',
        Dato: '28.3.2026',
        Turnering: 'Peter Wessel Cup 2026',
        'H-B': '-',
      }),
    ]
    const cupMatches = [
      makeMatch({
        Kampnr: 'pwcup-48',
        Dato: '28.3.2026',
        Turnering: 'Peter Wessel Cup 2026',
        'H-B': '23-19',
      }),
    ]

    const result = mergeCupMatches(existing, cupMatches, 'Peter Wessel Cup 2026')

    expect(result).toHaveLength(2)
    expect(result.find((m) => m.Kampnr === 'pwcup-48')?.['H-B']).toBe('23-19')
  })

  it('does not remove non-cup matches', () => {
    const existing = [
      makeMatch({ Kampnr: '100', Turnering: 'Regionserien' }),
      makeMatch({ Kampnr: '200', Turnering: 'Regionserien' }),
    ]

    const result = mergeCupMatches(existing, [], 'Peter Wessel Cup 2026')

    expect(result).toHaveLength(2)
  })
})
