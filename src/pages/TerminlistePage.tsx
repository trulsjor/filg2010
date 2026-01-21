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
import statsData from '../../data/player-stats.json'

import { TeamStatsAggregate } from '../team-stats/TeamStatsAggregate'
import type { Match, Config } from '../types'
import type { PlayerStatsData } from '../types/player-stats'

export function TerminlistePage() {
  const matches = matchesData as Match[]
  const config = configData as Config
  const tables = tablesData as LeagueTable[]
  const playerStats = statsData as PlayerStatsData
  const location = useLocation()

  const [overlayTournament, setOverlayTournament] = useState<string | null>(null)

  const teamNameToId = useMemo(
    () => TeamStatsAggregate.buildTeamNameToIdMap(playerStats, matches),
    [playerStats, matches]
  )

  const { filteredMatches, filters, nextMatch, setFilters } = useMatches(matches)
  const { teams, getTeamColor } = useTeams(config.teams)

  const hasMultipleTeams = teams.length > 1
  const teamNames = teams.map((t) => t.name)

  const findTableByPartialTournamentName = useCallback(
    (tournamentName: string): LeagueTable | undefined => {
      return tables.find((table) =>
        table.tournamentName.toLowerCase().includes(tournamentName.toLowerCase())
      )
    },
    [tables]
  )

  const overlayTables = useMemo(() => {
    if (!overlayTournament) return []
    const table = findTableByPartialTournamentName(overlayTournament)
    return table ? [table] : []
  }, [overlayTournament, findTableByPartialTournamentName])

  const handleOpenTable = useCallback((_teamName: string, tournamentName: string) => {
    setOverlayTournament(tournamentName)
  }, [])

  const handleCloseOverlay = useCallback(() => {
    setOverlayTournament(null)
  }, [])

  const scrollToNextMatch = useCallback(() => {
    const nextMatchElement =
      document.getElementById('next-match-card') ?? document.getElementById('next-match-row')

    if (!nextMatchElement) return

    const header = document.querySelector('.page-header')
    const headerHeight = header ? header.getBoundingClientRect().height : 80
    const elementPosition = nextMatchElement.getBoundingClientRect().top + window.scrollY
    const offsetPosition = elementPosition - headerHeight - 20

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    const isInitialPageLoad = !location.key || location.key === 'default'
    const shouldScrollToNextMatch = nextMatch && (location.state?.scrollToNext || isInitialPageLoad)

    if (!shouldScrollToNextMatch) return

    const scrollAfterRenderDelay = setTimeout(scrollToNextMatch, 100)
    return () => clearTimeout(scrollAfterRenderDelay)
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
        <div className="match-grid">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.Kampnr}
              match={match}
              isNextMatch={nextMatch === match}
              hasMultipleTeams={hasMultipleTeams}
              getTeamColor={getTeamColor}
              hasTable={!!findTableByPartialTournamentName(match.Turnering || '')}
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
          teamNameToId={teamNameToId}
        />
      )}
    </div>
  )
}
