import { useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { defaultSquadId } from './SeasonDataLoader'

export function useSquadPath() {
  const { squadId } = useParams<{ squadId: string }>()
  const [searchParams] = useSearchParams()
  const activeSquadId = squadId ?? defaultSquadId
  const season = searchParams.get('sesong')

  const squadPath = useCallback(
    (subPath = ''): string => {
      const base = subPath === '' ? `/${activeSquadId}` : `/${activeSquadId}/${subPath}`
      if (season === null) return base
      const separator = base.includes('?') ? '&' : '?'
      return `${base}${separator}sesong=${encodeURIComponent(season)}`
    },
    [activeSquadId, season]
  )

  return { squadId: activeSquadId, season, squadPath }
}
