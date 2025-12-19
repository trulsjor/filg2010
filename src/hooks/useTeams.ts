import { useMemo, useCallback } from 'react'
import type { Team } from '../types'

const FALLBACK_COLOR = '#009B3E'

export function useTeams(teams: Team[]) {
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    teams.forEach((team) => {
      map.set(team.name, team.color)
    })
    return map
  }, [teams])

  const getTeamColor = useCallback(
    (teamName?: string): string => {
      if (!teamName) return FALLBACK_COLOR
      return colorMap.get(teamName) ?? FALLBACK_COLOR
    },
    [colorMap]
  )

  return {
    teams,
    getTeamColor,
  }
}
