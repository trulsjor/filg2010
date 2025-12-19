import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useTeams } from './useTeams'
import type { Team } from '../types'

const mockTeams: Team[] = [
  {
    name: 'Fjellhammer',
    lagid: '123',
    seasonId: '2024',
    color: '#fbbf24',
  },
  {
    name: 'Fjellhammer 2',
    lagid: '456',
    seasonId: '2024',
    color: '#059669',
  },
]

describe('useTeams', () => {
  it('returns teams when provided with team data', async () => {
    const { result } = renderHook(() => useTeams(mockTeams))

    await waitFor(() => {
      expect(result.current.teams).toEqual(mockTeams)
    })
  })

  it('returns correct color for team name', async () => {
    const { result } = renderHook(() => useTeams(mockTeams))

    await waitFor(() => {
      expect(result.current.getTeamColor('Fjellhammer')).toBe('#fbbf24')
      expect(result.current.getTeamColor('Fjellhammer 2')).toBe('#059669')
    })
  })

  it('returns fallback color for unknown team', async () => {
    const { result } = renderHook(() => useTeams(mockTeams))

    await waitFor(() => {
      expect(result.current.getTeamColor('Unknown Team')).toBe('#009B3E')
      expect(result.current.getTeamColor(undefined)).toBe('#009B3E')
    })
  })
})
