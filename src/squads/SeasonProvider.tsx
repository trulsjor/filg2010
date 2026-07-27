import { useEffect, useState, type ReactNode } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { currentSeasonSlug, loadSeasonData, type SeasonData } from './SeasonDataLoader'
import { SeasonContext, rememberSquad } from './SeasonAccess'

interface SeasonProviderProps {
  children: ReactNode
}

export function SeasonProvider({ children }: SeasonProviderProps) {
  const { squadId } = useParams<{ squadId: string }>()
  const [searchParams] = useSearchParams()
  const requestedSeason = searchParams.get('sesong') ?? currentSeasonSlug

  const [season, setSeason] = useState<SeasonData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (squadId === undefined) return

    let cancelled = false
    setError(null)

    loadSeasonData(squadId, requestedSeason)
      .then((loaded) => {
        if (!cancelled) setSeason(loaded)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })

    return () => {
      cancelled = true
    }
  }, [squadId, requestedSeason])

  useEffect(() => {
    if (squadId !== undefined) rememberSquad(squadId)
  }, [squadId])

  if (error !== null) {
    return (
      <div className="app">
        <div className="container">
          <div className="no-matches">
            <p>Klarte ikke å laste data: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (season === null) {
    return (
      <div className="app">
        <div className="container">
          <div className="no-matches">
            <p>Laster …</p>
          </div>
        </div>
      </div>
    )
  }

  return <SeasonContext.Provider value={season}>{children}</SeasonContext.Provider>
}
