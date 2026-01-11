import { useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { LeagueTableCard, type LeagueTable } from '../components/LeagueTableCard'

import tablesData from '../../data/tables.json'
import configData from '../../config.json'

import type { Config } from '../types'

export function TabellPage() {
  const tables = tablesData as LeagueTable[]
  const config = configData as Config
  const navigate = useNavigate()

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

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
      // Match by extracting base name (e.g., "Fjellhammer" from "Fjellhammer G15 1")
      const teamInTable = sortedTeams.find((team) => {
        const baseName = team.name.split(' ')[0].toLowerCase()
        const teamNumber = team.name.match(/\d+$/)?.[0] // Get trailing number like "1" or "2"
        return table.rows.some((row) => {
          const rowTeam = row.team.toLowerCase()
          // Match "Fjellhammer" or "Fjellhammer 2" style names
          if (teamNumber === '1' || !teamNumber) {
            // For team 1, match exact base name without number suffix
            return (
              rowTeam === baseName || (rowTeam.startsWith(baseName + ' ') && !rowTeam.match(/\d/))
            )
          } else {
            // For team 2, 3, etc., match base name with that number
            return rowTeam.includes(baseName) && rowTeam.includes(teamNumber)
          }
        })
      })
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
      <Header onScrollToNext={handleScrollToNext} />
      <div className="container">
        {/* Page Title */}
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

        {/* League Tables - grouped by team */}
        {tables.length > 0 && (
          <section className="league-tables-section">
            {config.teams.map((team) => {
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
                      style={{ backgroundColor: getTeamColor(team.name) }}
                    />
                    <h3>{team.name}</h3>
                  </div>
                  <div className="tables-grid">
                    {teamTables.map((table) => (
                      <LeagueTableCard key={table.tournamentUrl} table={table} />
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
