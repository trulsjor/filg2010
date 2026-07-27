import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { currentSeasonSlug, defaultSquadId } from './SeasonDataLoader'

export function useSquadPath() {
  const { squadId, season } = useParams<{ squadId: string; season: string }>()
  const activeSquadId = squadId ?? defaultSquadId
  const activeSeason = season ?? currentSeasonSlug

  const squadPath = useCallback(
    (subPath = ''): string => {
      const base = season === undefined ? `/${activeSquadId}` : `/${activeSquadId}/${season}`
      return subPath === '' ? base : `${base}/${subPath}`
    },
    [activeSquadId, season]
  )

  return { squadId: activeSquadId, season: activeSeason, squadPath }
}
