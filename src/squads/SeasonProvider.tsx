import { useEffect, useState } from 'react'
import { Navigate, Outlet, useParams } from 'react-router-dom'
import {
  currentSeasonSlug,
  isKnownSquad,
  loadSeasonData,
  seasonsForSquad,
  type SeasonData,
} from './SeasonDataLoader'
import { SeasonContext, rememberSquad } from './SeasonAccess'

export function SeasonProvider() {
  const { squadId, season } = useParams<{ squadId: string; season: string }>()
  const requestedSeason = season ?? currentSeasonSlug

  const [loaded, setLoaded] = useState<SeasonData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const squadIsKnown = squadId !== undefined && isKnownSquad(squadId)
  const seasonIsKnown =
    squadIsKnown &&
    squadId !== undefined &&
    seasonsForSquad(squadId).some((choice) => choice.slug === requestedSeason)

  useEffect(() => {
    if (!seasonIsKnown || squadId === undefined) return

    let cancelled = false
    setError(null)

    loadSeasonData(squadId, requestedSeason)
      .then((data) => {
        if (!cancelled) setLoaded(data)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })

    return () => {
      cancelled = true
    }
  }, [squadId, requestedSeason, seasonIsKnown])

  useEffect(() => {
    if (squadIsKnown && squadId !== undefined) rememberSquad(squadId)
  }, [squadId, squadIsKnown])

  if (!squadIsKnown) return <Navigate to="/" replace />
  if (!seasonIsKnown) return <Navigate to={`/${squadId}`} replace />

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

  if (loaded === null) {
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

  return (
    <SeasonContext.Provider value={loaded}>
      <Outlet />
    </SeasonContext.Provider>
  )
}
