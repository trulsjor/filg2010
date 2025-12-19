import { useCallback, useRef } from 'react'
import { Header } from './components/Header'
import { FilterBar } from './components/FilterBar'
import { MatchCard } from './components/MatchCard'
import { MatchTable } from './components/MatchTable'
import { useMatches } from './hooks/useMatches'
import { useTeams } from './hooks/useTeams'
import { useMetadata } from './hooks/useMetadata'

// Import data - these will be replaced with API calls later
import matchesData from '../data/terminliste.json'
import metadataData from '../data/metadata.json'
import configData from '../config.json'

import type { Match, Metadata, Config } from './types'

export function App() {
  const matches = matchesData as Match[]
  const metadata = metadataData as Metadata
  const config = configData as Config

  const nextMatchRef = useRef<HTMLDivElement>(null)

  const { filteredMatches, nextMatch, setFilters } = useMatches(matches)
  const { teams, getTeamColor } = useTeams(config.teams)
  const { formattedLastUpdated } = useMetadata(metadata)

  const hasMultipleTeams = teams.length > 1
  const teamNames = teams.map((t) => t.name)

  const handleScrollToNext = useCallback(() => {
    const element = document.getElementById('next-match-card')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handleFilterChange = useCallback(
    (newFilters: Parameters<typeof setFilters>[0]) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  return (
    <div className="app">
      <div className="container">
        <Header onScrollToNext={handleScrollToNext} />

        <FilterBar
          teamNames={teamNames}
          filters={{}}
          onFilterChange={handleFilterChange}
        />

        {formattedLastUpdated && (
          <p className="last-updated">
            Sist oppdatert: {formattedLastUpdated}
          </p>
        )}

        {/* Desktop table view */}
        <div className="desktop-view">
          <MatchTable
            matches={filteredMatches}
            hasMultipleTeams={hasMultipleTeams}
            getTeamColor={getTeamColor}
          />
        </div>

        {/* Mobile card view */}
        <div className="mobile-view" ref={nextMatchRef}>
          {filteredMatches.map((match, index) => (
            <MatchCard
              key={`${match.Dato}-${match.Tid}-${index}`}
              match={match}
              isNextMatch={nextMatch === match}
              hasMultipleTeams={hasMultipleTeams}
              getTeamColor={getTeamColor}
            />
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="no-matches">
            <p>Ingen kamper funnet med valgte filtre.</p>
          </div>
        )}
      </div>
    </div>
  )
}
