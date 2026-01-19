import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import configData from '../../config.json'
import aggregatesData from '../../data/player-aggregates.json'
import type { Config } from '../types'
import type { PlayerAggregatesData } from '../types/player-stats'

export function SpillerePage() {
  const config = configData as Config
  const aggregates = aggregatesData as PlayerAggregatesData
  const ourTeamIds = new Set(config.teams.map((t) => t.lagid))
  const navigate = useNavigate()

  const [filter, setFilter] = useState<'our' | 'all'>('our')
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [sortBy, setSortBy] = useState<'goals' | 'penalty' | 'twoMin' | 'matches' | 'avg'>('goals')
  const [sortDesc, setSortDesc] = useState(true)

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const tournaments = useMemo(() => {
    const set = new Set<string>()
    const players =
      filter === 'our'
        ? aggregates.aggregates.filter(
            (p) => p.teamIds?.some((id) => ourTeamIds.has(id)) ?? ourTeamIds.has(p.teamId)
          )
        : aggregates.aggregates
    for (const p of players) {
      for (const t of p.byTournament) {
        set.add(t.tournament)
      }
    }
    return Array.from(set).sort()
  }, [aggregates, filter, ourTeamIds])

  const filteredPlayers = useMemo(() => {
    let players = aggregates.aggregates

    if (filter === 'our') {
      players = players.filter(
        (p) => p.teamIds?.some((id) => ourTeamIds.has(id)) ?? ourTeamIds.has(p.teamId)
      )
    }

    if (tournamentFilter) {
      players = players
        .filter((p) => p.byTournament.some((t) => t.tournament === tournamentFilter))
        .map((p) => {
          const ts = p.byTournament.find((t) => t.tournament === tournamentFilter)
          if (!ts) return p
          return {
            ...p,
            totalGoals: ts.goals,
            totalPenaltyGoals: ts.penaltyGoals,
            totalTwoMinutes: ts.twoMinutes,
            totalYellowCards: ts.yellowCards,
            totalRedCards: ts.redCards,
            matchesPlayed: ts.matches,
            goalsPerMatch: ts.matches > 0 ? Math.round((ts.goals / ts.matches) * 100) / 100 : 0,
          }
        })
    }

    const sorted = [...players].sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortBy) {
        case 'goals':
          aVal = a.totalGoals
          bVal = b.totalGoals
          break
        case 'penalty':
          aVal = a.totalPenaltyGoals
          bVal = b.totalPenaltyGoals
          break
        case 'twoMin':
          aVal = a.totalTwoMinutes
          bVal = b.totalTwoMinutes
          break
        case 'matches':
          aVal = a.matchesPlayed
          bVal = b.matchesPlayed
          break
        case 'avg':
          aVal = a.goalsPerMatch
          bVal = b.goalsPerMatch
          break
      }
      return sortDesc ? bVal - aVal : aVal - bVal
    })

    return sorted
  }, [aggregates, filter, tournamentFilter, sortBy, sortDesc, ourTeamIds])

  const totals = useMemo(() => {
    return filteredPlayers.reduce(
      (acc, p) => ({
        goals: acc.goals + p.totalGoals,
        penalties: acc.penalties + p.totalPenaltyGoals,
        twoMin: acc.twoMin + p.totalTwoMinutes,
      }),
      { goals: 0, penalties: 0, twoMin: 0 }
    )
  }, [filteredPlayers])

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(col)
      setSortDesc(true)
    }
  }

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
            <h1>Spillerstatistikk</h1>
            <p className="stats-subtitle">Toppscorere og statistikk for Fjellhammer G2010</p>
          </div>
        </div>

        {/* Filters */}
        <div className="player-filters">
          <button
            onClick={() => {
              setFilter('our')
              setTournamentFilter('')
            }}
            className={`player-filter-btn ${filter === 'our' ? 'active' : ''}`}
          >
            Fjellhammer
          </button>
          <button
            onClick={() => {
              setFilter('all')
              setTournamentFilter('')
            }}
            className={`player-filter-btn ${filter === 'all' ? 'active' : ''}`}
          >
            Alle spillere
          </button>
          <select
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            className="player-filter-select"
          >
            <option value="">Alle turneringer</option>
            {tournaments.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="player-stats-summary">
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredPlayers.length}</div>
            <div className="player-stat-label">Spillere</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{totals.goals}</div>
            <div className="player-stat-label">Totalt mål</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{totals.penalties}</div>
            <div className="player-stat-label">7m-mål</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{totals.twoMin}</div>
            <div className="player-stat-label">2 min</div>
          </div>
        </div>

        {/* Table */}
        <div className="player-table-container">
          <div className="player-table-header">
            Toppscorere <span className="player-count">({filteredPlayers.length} spillere)</span>
          </div>
          <div className="player-table-wrapper">
            <table className="player-table">
              <thead>
                <tr>
                  <th className="col-rank">#</th>
                  <th className="col-player">Spiller</th>
                  <th className="col-team">Lag</th>
                  <th
                    className={`col-stat sortable ${sortBy === 'goals' ? 'sorted' : ''}`}
                    onClick={() => handleSort('goals')}
                  >
                    Mål {sortBy === 'goals' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-stat sortable ${sortBy === 'penalty' ? 'sorted' : ''}`}
                    onClick={() => handleSort('penalty')}
                  >
                    7m {sortBy === 'penalty' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-stat sortable ${sortBy === 'twoMin' ? 'sorted' : ''}`}
                    onClick={() => handleSort('twoMin')}
                  >
                    2m {sortBy === 'twoMin' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-stat sortable ${sortBy === 'matches' ? 'sorted' : ''}`}
                    onClick={() => handleSort('matches')}
                  >
                    K {sortBy === 'matches' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-stat col-avg sortable ${sortBy === 'avg' ? 'sorted' : ''}`}
                    onClick={() => handleSort('avg')}
                  >
                    Snitt {sortBy === 'avg' && (sortDesc ? '▼' : '▲')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player, idx) => {
                  const isOurPlayer =
                    player.teamIds?.some((id) => ourTeamIds.has(id)) ??
                    ourTeamIds.has(player.teamId)
                  return (
                    <tr key={player.playerId} className={isOurPlayer ? 'our-player' : ''}>
                      <td className="col-rank">{idx + 1}</td>
                      <td className="col-player">
                        <Link to={`/spillere/${player.playerId}`} className="player-name-link">
                          <span className="jersey-number">{player.jerseyNumber ?? ''}</span>
                          {player.playerName}
                        </Link>
                      </td>
                      <td className="col-team">{player.teamName}</td>
                      <td className="col-stat col-goals">{player.totalGoals}</td>
                      <td className="col-stat">{player.totalPenaltyGoals}</td>
                      <td className="col-stat">{player.totalTwoMinutes}</td>
                      <td className="col-stat">{player.matchesPlayed}</td>
                      <td className="col-stat col-avg">{player.goalsPerMatch.toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
