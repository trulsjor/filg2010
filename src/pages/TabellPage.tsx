import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'

import tablesData from '../../data/tables.json'
import configData from '../../config.json'

import type { Config } from '../types'

interface LeagueTableRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

interface LeagueTable {
  tournamentName: string
  tournamentUrl: string
  rows: LeagueTableRow[]
}

export function TabellPage() {
  const tables = tablesData as LeagueTable[]
  const config = configData as Config

  // Group tables by team - sort by name length (longest first) to match "Fjellhammer 2" before "Fjellhammer"
  const tablesByTeam = useMemo(() => {
    const grouped: Record<string, LeagueTable[]> = {}

    config.teams.forEach((team) => {
      grouped[team.name] = []
    })

    // Sort teams by name length (longest first) to match more specific names first
    const sortedTeams = [...config.teams].sort((a, b) => b.name.length - a.name.length)

    tables.forEach((table) => {
      // Find which team is in this table - check longest names first
      const teamInTable = sortedTeams.find((team) =>
        table.rows.some((row) =>
          row.team.toLowerCase().includes(team.name.toLowerCase())
        )
      )
      if (teamInTable) {
        grouped[teamInTable.name].push(table)
      }
    })

    return grouped
  }, [tables, config.teams])

  const getTeamColor = (teamName: string) => {
    const team = config.teams.find((t) => t.name === teamName)
    return team?.color ?? '#009B3E'
  }

  return (
    <div className="app">
      <Header showScrollButton={false} />
      <div className="container">
        {/* Page Title */}
        <div className="stats-page-header">
          <Link to="/" className="back-link" aria-label="Tilbake til terminliste">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Tilbake
          </Link>
          <div className="stats-page-title">
            <h1>Tabeller</h1>
            <p className="stats-subtitle">Serietabeller for Fjellhammer G2010</p>
          </div>
        </div>

        {/* League Tables - grouped by team */}
        {tables.length > 0 && (
          <section className="league-tables-section">
            {config.teams.map((team) => {
              const teamTables = tablesByTeam[team.name]
              if (!teamTables || teamTables.length === 0) return null

              return (
                <div key={team.name} className="team-tables-group" id={`tabell-${team.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="team-tables-header">
                    <span
                      className="team-color-indicator"
                      style={{ backgroundColor: getTeamColor(team.name) }}
                    />
                    <h3>{team.name}</h3>
                  </div>
                  <div className="tables-grid">
                    {teamTables.map((table) => {
                      const shortName = table.tournamentName.split(',')[0].replace('Regionserien ', '')
                      return (
                        <div key={table.tournamentUrl} className="table-card">
                          <div className="table-card-header">
                            <h4>{shortName}</h4>
                            <a
                              href={table.tournamentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="table-link"
                              aria-label="Se på handball.no"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          </div>
                          <table className="league-table">
                            <thead>
                              <tr>
                                <th className="col-pos">#</th>
                                <th className="col-team">Lag</th>
                                <th className="col-num">K</th>
                                <th className="col-num">+/-</th>
                                <th className="col-num col-points">P</th>
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows.map((row) => {
                                const isFjellhammer = row.team.toLowerCase().includes('fjellhammer')
                                const goalDiff = row.goalsFor - row.goalsAgainst
                                return (
                                  <tr key={row.position} className={isFjellhammer ? 'row-highlight' : ''}>
                                    <td className="col-pos">
                                      <span className={`position-badge position-${row.position}`}>
                                        {row.position}
                                      </span>
                                    </td>
                                    <td className="col-team">
                                      {isFjellhammer && <span className="team-marker">●</span>}
                                      {row.team}
                                    </td>
                                    <td className="col-num">{row.played}</td>
                                    <td className={`col-num ${goalDiff > 0 ? 'positive' : goalDiff < 0 ? 'negative' : ''}`}>
                                      {goalDiff > 0 ? '+' : ''}{goalDiff}
                                    </td>
                                    <td className="col-num col-points">{row.points}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
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
