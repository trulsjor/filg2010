import { useCallback, useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from '../components/Header'
import { MatchCard } from '../components/MatchCard'
import { TableOverlay } from '../components/TableOverlay'
import { type LeagueTable } from '../components/LeagueTableCard'
import { useMatches } from '../hooks/useMatches'
import { useTeams } from '../hooks/useTeams'

import matchesData from '../../data/terminliste.json'
import configData from '../../config.json'
import tablesData from '../../data/tables.json'

import type { Match, Config } from '../types'

export function TerminlistePage() {
  const matches = matchesData as Match[]
  const config = configData as Config
  const tables = tablesData as LeagueTable[]
  const location = useLocation()

  const [overlayTournament, setOverlayTournament] = useState<string | null>(null)

  const { filteredMatches, filters, nextMatch, setFilters } = useMatches(matches)
  const { teams, getTeamColor } = useTeams(config.teams)

  const hasMultipleTeams = teams.length > 1
  const teamNames = teams.map((t) => t.name)

  // Get table for a specific tournament
  const getTableForTournament = useCallback(
    (tournamentName: string): LeagueTable | undefined => {
      // Match tournament name - tables have full name like "Regionserien Gutter 15 - avd 42, Håndballsesongen 2025/2026"
      // Match data has short name like "Regionserien Gutter 15 - avd 42"
      return tables.find((table) =>
        table.tournamentName.toLowerCase().includes(tournamentName.toLowerCase())
      )
    },
    [tables]
  )

  const overlayTables = useMemo(() => {
    if (!overlayTournament) return []
    const table = getTableForTournament(overlayTournament)
    return table ? [table] : []
  }, [overlayTournament, getTableForTournament])

  const handleOpenTable = useCallback((_teamName: string, tournamentName: string) => {
    setOverlayTournament(tournamentName)
  }, [])

  const handleCloseOverlay = useCallback(() => {
    setOverlayTournament(null)
  }, [])

  const scrollToNextMatch = useCallback(() => {
    // Try mobile card first, then desktop row
    const element =
      document.getElementById('next-match-card') ?? document.getElementById('next-match-row')

    if (element) {
      // Get header height to offset scroll
      const header = document.querySelector('.page-header')
      const headerHeight = header?.getBoundingClientRect().height ?? 80
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerHeight - 20

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
  }, [])

  // Auto-scroll to next match on page load or when navigating with scrollToNext state
  useEffect(() => {
    const shouldScroll =
      nextMatch && (location.state?.scrollToNext || !location.key || location.key === 'default')
    if (shouldScroll) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        scrollToNextMatch()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [nextMatch, scrollToNextMatch, location.state, location.key])

  const handleFilterChange = useCallback(
    (newFilters: Parameters<typeof setFilters>[0]) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  return (
    <div className="app">
      <Header
        onScrollToNext={scrollToNextMatch}
        teamNames={teamNames}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
      <div className="container">
        {/* Card grid - responsive for all screen sizes */}
        <div className="match-grid">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.Kampnr}
              match={match}
              isNextMatch={nextMatch === match}
              hasMultipleTeams={hasMultipleTeams}
              getTeamColor={getTeamColor}
              hasTable={!!getTableForTournament(match.Turnering || '')}
              onOpenTable={handleOpenTable}
            />
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="no-matches">
            <p>Ingen kamper funnet med valgte filtre.</p>
          </div>
        )}
      </div>

      {overlayTournament && overlayTables.length > 0 && (
        <TableOverlay
          tables={overlayTables}
          teamName={overlayTournament}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  )
}
