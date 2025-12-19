import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import matchesData from '../../data/terminliste.json'
import tablesData from '../../data/tables.json'
import configData from '../../config.json'

import type { Match, Config } from '../types'

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

interface TeamStats {
  name: string
  played: number
  wins: number
  losses: number
  draws: number
  goalsFor: number
  goalsAgainst: number
}

function parseResult(result: string): { home: number; away: number } | null {
  if (!result || result === '-') return null
  const parts = result.split('-').map((s) => parseInt(s.trim(), 10))
  if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null
  return { home: parts[0], away: parts[1] }
}

export function StatistikkPage() {
  const matches = matchesData as Match[]
  const tables = tablesData as LeagueTable[]
  const config = configData as Config

  const teamStats = useMemo(() => {
    const stats: Record<string, TeamStats> = {}

    config.teams.forEach((team) => {
      stats[team.name] = {
        name: team.name,
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      }
    })

    matches.forEach((match) => {
      const result = parseResult(match['H-B'])
      if (!result) return

      const teamName = match.Lag
      if (!stats[teamName]) return

      const isHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
      const ourGoals = isHome ? result.home : result.away
      const theirGoals = isHome ? result.away : result.home

      stats[teamName].played++
      stats[teamName].goalsFor += ourGoals
      stats[teamName].goalsAgainst += theirGoals

      if (ourGoals > theirGoals) {
        stats[teamName].wins++
      } else if (ourGoals < theirGoals) {
        stats[teamName].losses++
      } else {
        stats[teamName].draws++
      }
    })

    return Object.values(stats)
  }, [matches, config.teams])

  const totalStats = useMemo(() => {
    return teamStats.reduce(
      (acc, team) => ({
        played: acc.played + team.played,
        wins: acc.wins + team.wins,
        losses: acc.losses + team.losses,
        draws: acc.draws + team.draws,
        goalsFor: acc.goalsFor + team.goalsFor,
        goalsAgainst: acc.goalsAgainst + team.goalsAgainst,
      }),
      { played: 0, wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0 }
    )
  }, [teamStats])

  const winPercentage = totalStats.played > 0
    ? Math.round((totalStats.wins / totalStats.played) * 100)
    : 0

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="stats-page-header">
          <Link to="/" className="back-link" aria-label="Tilbake til terminliste">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Tilbake
          </Link>
          <div className="stats-page-title">
            <h1>Statistikk</h1>
            <p className="stats-subtitle">Sesongoversikt for Fjellhammer G2010</p>
          </div>
        </header>

        {/* Hero Stats */}
        <section className="stats-hero">
          <div className="hero-stat hero-stat--primary">
            <div className="hero-stat-ring">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${winPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="hero-stat-value">{winPercentage}%</span>
            </div>
            <span className="hero-stat-label">Vinnprosent</span>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="quick-stats">
          <div className="stat-card">
            <span className="stat-icon">🏟️</span>
            <span className="stat-value">{totalStats.played}</span>
            <span className="stat-label">Kamper spilt</span>
          </div>
          <div className="stat-card stat-card--success">
            <span className="stat-icon">🏆</span>
            <span className="stat-value">{totalStats.wins}</span>
            <span className="stat-label">Seire</span>
          </div>
          <div className="stat-card stat-card--warning">
            <span className="stat-icon">🤝</span>
            <span className="stat-value">{totalStats.draws}</span>
            <span className="stat-label">Uavgjort</span>
          </div>
          <div className="stat-card stat-card--danger">
            <span className="stat-icon">📉</span>
            <span className="stat-value">{totalStats.losses}</span>
            <span className="stat-label">Tap</span>
          </div>
        </section>

        {/* Goals Summary */}
        <section className="goals-section">
          <div className="goals-card">
            <div className="goals-header">
              <h2>Målstatistikk</h2>
            </div>
            <div className="goals-content">
              <div className="goals-stat">
                <span className="goals-for">{totalStats.goalsFor}</span>
                <span className="goals-label">Scoret</span>
              </div>
              <div className="goals-divider">
                <span className="goals-diff">
                  {totalStats.goalsFor - totalStats.goalsAgainst >= 0 ? '+' : ''}
                  {totalStats.goalsFor - totalStats.goalsAgainst}
                </span>
              </div>
              <div className="goals-stat">
                <span className="goals-against">{totalStats.goalsAgainst}</span>
                <span className="goals-label">Sluppet inn</span>
              </div>
            </div>
          </div>
        </section>

        {/* Per Team Stats */}
        {teamStats.length > 1 && (
          <section className="team-breakdown">
            <h2>Per lag</h2>
            <div className="team-cards">
              {teamStats.map((team) => (
                <div key={team.name} className="team-card">
                  <h3>{team.name}</h3>
                  <div className="team-card-stats">
                    <div className="team-stat-item">
                      <span className="team-stat-value">{team.played}</span>
                      <span className="team-stat-label">Kamper</span>
                    </div>
                    <div className="team-stat-item team-stat--success">
                      <span className="team-stat-value">{team.wins}</span>
                      <span className="team-stat-label">S</span>
                    </div>
                    <div className="team-stat-item team-stat--warning">
                      <span className="team-stat-value">{team.draws}</span>
                      <span className="team-stat-label">U</span>
                    </div>
                    <div className="team-stat-item team-stat--danger">
                      <span className="team-stat-value">{team.losses}</span>
                      <span className="team-stat-label">T</span>
                    </div>
                  </div>
                  <div className="team-goals">
                    Mål: {team.goalsFor} - {team.goalsAgainst}
                    <span className="team-goal-diff">
                      ({team.goalsFor - team.goalsAgainst >= 0 ? '+' : ''}
                      {team.goalsFor - team.goalsAgainst})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* League Tables */}
        {tables.length > 0 && (
          <section className="league-tables-section">
            <h2>Serietabeller</h2>
            <div className="tables-grid">
              {tables.map((table) => {
                const shortName = table.tournamentName.split(',')[0].replace('Regionserien ', '')
                return (
                  <div key={table.tournamentUrl} className="table-card">
                    <div className="table-card-header">
                      <h3>{shortName}</h3>
                      <a
                        href={table.tournamentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="table-link"
                        aria-label="Se på handball.no"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          </section>
        )}
      </div>
    </div>
  )
}
