import { useState, useMemo } from 'react'
import type { Match } from '../types'

export interface FilterState {
  team?: string
  location?: 'home' | 'away'
  status?: 'played' | 'upcoming'
}

export interface UseMatchesOptions {
  now?: () => Date
}

function parseMatchDate(match: Match): Date | null {
  const [day, month, year] = (match.Dato || '').split('.')
  if (!day || !month || !year) return null
  const [hour, minute] = (match.Tid || '00:00').split(':')
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour) || 0,
    Number(minute) || 0
  )
  return isNaN(date.getTime()) ? null : date
}

export function useMatches(matches: Match[], options: UseMatchesOptions = {}) {
  const [filters, setFilters] = useState<FilterState>({})
  const getNow = options.now ?? (() => new Date())

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      // Team filter
      if (filters.team && match.Lag !== filters.team) {
        return false
      }
      // Location filter (home/away)
      if (filters.location) {
        const isHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
        if (filters.location === 'home' && !isHome) return false
        if (filters.location === 'away' && isHome) return false
      }
      // Status filter (played/upcoming)
      if (filters.status) {
        const hasResult = match['H-B'] && match['H-B'].trim() !== '' && match['H-B'] !== '-'
        if (filters.status === 'played' && !hasResult) return false
        if (filters.status === 'upcoming' && hasResult) return false
      }
      return true
    })
  }, [matches, filters])

  const nextMatch = useMemo(() => {
    const currentDate = getNow()
    return matches.find((match) => {
      const matchDate = parseMatchDate(match)
      return matchDate && matchDate >= currentDate
    }) ?? null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches])

  return {
    matches,
    filteredMatches,
    filters,
    nextMatch,
    setFilters,
  }
}
