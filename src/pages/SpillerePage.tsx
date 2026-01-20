import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import configData from '../../config.json'
import aggregatesData from '../../data/player-aggregates.json'

type SortField =
  | 'jerseyNumber'
  | 'playerName'
  | 'club'
  | 'goals'
  | 'penalty'
  | 'twoMin'
  | 'matches'
  | 'avg'

function extractClubName(teamName: string): string {
  return teamName.replace(/\s*\d+$/, '').trim()
}

export function SpillerePage() {
  const config = configData
  const aggregates = aggregatesData
  const ourTeamIds = new Set(config.teams.map((t) => t.lagid))
  const navigate = useNavigate()

  const [filter, setFilter] = useState<'our' | 'all'>('our')
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('goals')
  const [sortDesc, setSortDesc] = useState(true)

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const tournaments = useMemo(() => {
    const set = new Set<string>()
    const players =
      filter === 'our'
        ? aggregates.aggregates.filter((p) => p.teamIds.some((id) => ourTeamIds.has(id)))
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
      players = players.filter((p) => p.teamIds.some((id) => ourTeamIds.has(id)))
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
      if (sortBy === 'playerName') {
        const cmp = a.playerName.localeCompare(b.playerName, 'nb')
        return sortDesc ? -cmp : cmp
      }
      if (sortBy === 'club') {
        const aClub = extractClubName(a.teamName)
        const bClub = extractClubName(b.teamName)
        const cmp = aClub.localeCompare(bClub, 'nb')
        return sortDesc ? -cmp : cmp
      }
      if (sortBy === 'jerseyNumber') {
        const aNum = a.jerseyNumber
        const bNum = b.jerseyNumber
        if (aNum !== undefined && bNum === undefined) return sortDesc ? 1 : -1
        if (aNum === undefined && bNum !== undefined) return sortDesc ? -1 : 1
        if (aNum === undefined || bNum === undefined) return 0
        const diff = aNum - bNum
        return sortDesc ? -diff : diff
      }
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
          <button
            onClick={() => {
              window.scrollTo(0, 0)
              navigate(-1)
            }}
            className="back-link"
            aria-label="Tilbake"
          >
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
          </button>
          <div className="stats-page-title">
            <h1>Spillerstatistikk</h1>
            <p className="stats-subtitle">Toppscorere og statistikk for Fjellhammer G2010</p>
          </div>
        </div>

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

        <div className="player-table-container">
          <div className="player-table-header">
            Toppscorere <span className="player-count">({filteredPlayers.length} spillere)</span>
          </div>
          <div className="player-table-wrapper">
            <table className="player-table">
              <thead>
                <tr>
                  <th
                    className={`col-rank sortable ${sortBy === 'jerseyNumber' ? 'sorted' : ''}`}
                    onClick={() => handleSort('jerseyNumber')}
                  >
                    # {sortBy === 'jerseyNumber' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-player sortable ${sortBy === 'playerName' ? 'sorted' : ''}`}
                    onClick={() => handleSort('playerName')}
                  >
                    Spiller {sortBy === 'playerName' && (sortDesc ? '▼' : '▲')}
                  </th>
                  <th
                    className={`col-club sortable ${sortBy === 'club' ? 'sorted' : ''}`}
                    onClick={() => handleSort('club')}
                  >
                    Klubb {sortBy === 'club' && (sortDesc ? '▼' : '▲')}
                  </th>
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
                {filteredPlayers.map((player) => {
                  const isOurPlayer = player.teamIds.some((id) => ourTeamIds.has(id))
                  const clubName = extractClubName(player.teamName)
                  return (
                    <tr key={player.playerId} className={isOurPlayer ? 'our-player' : ''}>
                      <td className="col-rank">{player.jerseyNumber}</td>
                      <td className="col-player">
                        <Link to={`/spillere/${player.playerId}`} className="player-name-link">
                          {player.playerName}
                        </Link>
                      </td>
                      <td className="col-club">{clubName}</td>
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
