import { describe, it, expect } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMatches } from './useMatches'
import type { Match } from '../types'

const mockMatches: Match[] = [
  {
    Lag: 'Fjellhammer',
    Dato: '15.01.2025',
    Tid: '18:00',
    Kampnr: '12345',
    Hjemmelag: 'Fjellhammer',
    Bortelag: 'Opponent',
    'H-B': '25-20',
    Bane: 'Fjellhammerhallen',
    Tilskuere: 100,
    Arrangør: 'Fjellhammer',
    Turnering: 'Serie',
    'Kamp URL': 'https://example.com/match/12345',
    'Hjemmelag URL': 'https://example.com/team/fjellhammer',
    'Bortelag URL': 'https://example.com/team/opponent',
    'Turnering URL': 'https://example.com/tournament/serie',
  },
  {
    Lag: 'Fjellhammer',
    Dato: '22.01.2025',
    Tid: '19:00',
    Kampnr: '12346',
    Hjemmelag: 'Opponent2',
    Bortelag: 'Fjellhammer',
    'H-B': '',
    Bane: 'Bortebane',
    Tilskuere: 0,
    Arrangør: 'Test',
    Turnering: 'Serie',
    'Kamp URL': 'https://example.com/match/12346',
    'Hjemmelag URL': 'https://example.com/team/opponent2',
    'Bortelag URL': 'https://example.com/team/fjellhammer',
    'Turnering URL': 'https://example.com/tournament/serie',
  },
]

describe('useMatches', () => {
  it('returns matches when provided with match data', async () => {
    const { result } = renderHook(() => useMatches(mockMatches))

    await waitFor(() => {
      expect(result.current.matches).toEqual(mockMatches)
    })
  })

  it('returns the next upcoming match', async () => {
    // Mock current date to be between the two matches
    const now = new Date('2025-01-20T12:00:00')

    const { result } = renderHook(() => useMatches(mockMatches, { now: () => now }))

    await waitFor(() => {
      expect(result.current.nextMatch).not.toBeNull()
      expect(result.current.nextMatch?.Kampnr).toBe('12346')
    })
  })

  it('filters matches by location (home/away)', async () => {
    const { result } = renderHook(() => useMatches(mockMatches))

    // Filter for home matches (Fjellhammer is home team)
    act(() => {
      result.current.setFilters({ location: 'home' })
    })

    await waitFor(() => {
      expect(result.current.filteredMatches).toHaveLength(1)
      expect(result.current.filteredMatches[0].Hjemmelag).toContain('Fjellhammer')
    })
  })

  it('filters matches by status (played/upcoming)', async () => {
    const { result } = renderHook(() => useMatches(mockMatches))

    // Filter for played matches (has H-B result)
    act(() => {
      result.current.setFilters({ status: 'played' })
    })

    await waitFor(() => {
      expect(result.current.filteredMatches).toHaveLength(1)
      expect(result.current.filteredMatches[0]['H-B']).toBe('25-20')
    })
  })

  it('filters matches by team name', async () => {
    const multiTeamMatches: Match[] = [
      ...mockMatches,
      {
        Lag: 'Fjellhammer 2',
        Dato: '29.01.2025',
        Tid: '17:00',
        Kampnr: '12347',
        Hjemmelag: 'Fjellhammer 2',
        Bortelag: 'Opponent3',
        'H-B': '',
        Bane: 'Fjellhammerhallen',
        Tilskuere: 0,
        Arrangør: 'Test',
        Turnering: 'Serie',
        'Kamp URL': '',
        'Hjemmelag URL': '',
        'Bortelag URL': '',
        'Turnering URL': '',
      },
    ]

    const { result } = renderHook(() => useMatches(multiTeamMatches))

    // Set filter to "Fjellhammer 2"
    act(() => {
      result.current.setFilters({ team: 'Fjellhammer 2' })
    })

    await waitFor(() => {
      expect(result.current.filteredMatches).toHaveLength(1)
      expect(result.current.filteredMatches[0].Lag).toBe('Fjellhammer 2')
    })
  })
})
