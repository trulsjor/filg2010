import { useState, useMemo, useCallback } from 'react'
import type { Match } from '../types'

export interface FilterState {
  team?: string
  location?: 'home' | 'away'
  status?: 'played' | 'upcoming'
}

export interface UseMatchesOptions {
  now?: () => Date
}

export const isFjellhammerTeam = (teamName?: string): boolean =>
  teamName?.toLowerCase().includes('fjellhammer') ?? false

export const isValidScore = (score?: string): boolean =>
  !!score && score.trim() !== '' && score !== '-'

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

function matchesFilter(match: Match, filters: FilterState): boolean {
  if (filters.team && match.Lag !== filters.team) {
    return false
  }

  if (filters.location) {
    const isHome = isFjellhammerTeam(match.Hjemmelag)
    if ((filters.location === 'home') !== isHome) return false
  }

  if (filters.status) {
    const hasResult = isValidScore(match['H-B'])
    if ((filters.status === 'played') !== hasResult) return false
  }

  return true
}

export function useMatches(matches: Match[], options: UseMatchesOptions = {}) {
  const [filters, setFilters] = useState<FilterState>({})
  const getNow = useCallback(options.now ?? (() => new Date()), [options.now])

  const filteredMatches = useMemo(
    () => matches.filter((match) => matchesFilter(match, filters)),
    [matches, filters]
  )

  const nextMatch = useMemo(() => {
    const now = getNow()
    return (
      matches.find((match) => {
        const matchDate = parseMatchDate(match)
        return matchDate && matchDate >= now
      }) ?? null
    )
  }, [matches, getNow])

  return {
    matches,
    filteredMatches,
    filters,
    nextMatch,
    setFilters,
  }
}
