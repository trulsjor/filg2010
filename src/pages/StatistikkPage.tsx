import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import matchesData from '../../data/terminliste.json'
import configData from '../../config.json'

import type { Match, Config } from '../types'

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
  const config = configData as Config

  const teamStats = useMemo(() => {
    const stats: Record<string, TeamStats> = {}

    // Initialize stats for each configured team
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

    // Calculate stats from matches
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

  return (
    <div className="app">
      <div className="container">
        <header className="stats-header">
          <Link to="/" className="ds-button ds-button--secondary ds-button--sm">
            &larr; Tilbake
          </Link>
          <h1>Statistikk</h1>
        </header>

        <section className="stats-overview">
          <h2>Totalt</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{totalStats.played}</span>
              <span className="stat-label">Kamper spilt</span>
            </div>
            <div className="stat-card stat-card--win">
              <span className="stat-value">{totalStats.wins}</span>
              <span className="stat-label">Seire</span>
            </div>
            <div className="stat-card stat-card--draw">
              <span className="stat-value">{totalStats.draws}</span>
              <span className="stat-label">Uavgjort</span>
            </div>
            <div className="stat-card stat-card--loss">
              <span className="stat-value">{totalStats.losses}</span>
              <span className="stat-label">Tap</span>
            </div>
          </div>

          <div className="goals-summary">
            <span>Mål: {totalStats.goalsFor} - {totalStats.goalsAgainst}</span>
            <span className="goal-diff">
              ({totalStats.goalsFor - totalStats.goalsAgainst >= 0 ? '+' : ''}
              {totalStats.goalsFor - totalStats.goalsAgainst})
            </span>
          </div>
        </section>

        {teamStats.length > 1 && (
          <section className="team-stats">
            <h2>Per lag</h2>
            {teamStats.map((team) => (
              <div key={team.name} className="team-stat-row">
                <h3>{team.name}</h3>
                <div className="stats-mini-grid">
                  <span>{team.played} kamper</span>
                  <span className="text-success">{team.wins} S</span>
                  <span className="text-warning">{team.draws} U</span>
                  <span className="text-danger">{team.losses} T</span>
                  <span>Mål: {team.goalsFor}-{team.goalsAgainst}</span>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
