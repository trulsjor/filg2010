import { useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { LeagueTableCard, type LeagueTable } from '../components/LeagueTableCard'
import { TeamStatsAggregate } from '../team-stats/TeamStatsAggregate'

import tablesData from '../../data/tables.json'
import configData from '../../config.json'
import statsData from '../../data/player-stats.json'

import type { Config } from '../types'
import type { PlayerStatsData } from '../types/player-stats'

type ConfigTeamName = string
type TeamLeagueTablesMap = Record<ConfigTeamName, LeagueTable[]>

const typedTables: LeagueTable[] = tablesData
const typedConfig: Config = configData
const typedStatsData: PlayerStatsData = statsData

export function TabellPage() {
  const navigate = useNavigate()
  const teamNameToId = useMemo(() => TeamStatsAggregate.buildTeamNameToIdMap(typedStatsData), [])

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const tablesByTeam = useMemo(() => {
    const grouped: TeamLeagueTablesMap = {}

    typedConfig.teams.forEach((team) => {
      grouped[team.name] = []
    })

    const teamsSortedBySpecificity = TeamStatsAggregate.sortTeamsByNameLengthDescending(
      typedConfig.teams
    )

    typedTables.forEach((table) => {
      const matchingTeam = TeamStatsAggregate.findConfigTeamInTable(
        table.rows,
        teamsSortedBySpecificity
      )
      if (matchingTeam) {
        grouped[matchingTeam.name].push(table)
      }
    })

    return grouped
  }, [])

  return (
    <div className="app">
      <Header onScrollToNext={handleScrollToNext} />
      <div className="container">
        <div className="stats-page-header">
          <Link to="/" className="back-link" aria-label="Tilbake til terminliste">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Tilbake
          </Link>
          <div className="stats-page-title">
            <h1>Tabeller</h1>
            <p className="stats-subtitle">Serietabeller for Fjellhammer G2010</p>
          </div>
        </div>

        {typedTables.length > 0 && (
          <section className="league-tables-section">
            {typedConfig.teams.map((team) => {
              const teamTables = tablesByTeam[team.name]
              if (!teamTables || teamTables.length === 0) return null

              return (
                <div
                  key={team.name}
                  className="team-tables-group"
                  id={`tabell-${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="team-tables-header">
                    <span
                      className="team-color-indicator"
                      style={{ backgroundColor: team.color }}
                    />
                    <h3>{team.name}</h3>
                  </div>
                  <div className="tables-grid">
                    {teamTables.map((table) => (
                      <LeagueTableCard
                        key={table.tournamentUrl}
                        table={table}
                        teamNameToId={teamNameToId}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
