import { useMemo, useCallback, useState } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import aggregatesData from '../../data/player-aggregates.json'
import statsData from '../../data/player-stats.json'
import terminlisteData from '../../data/terminliste.json'
import type { PlayerAggregatesData, PlayerStatsData } from '../types/player-stats'
import type { PlayerId } from '../types'
import {
  PlayerMatchHistory,
  formatJerseyNumber,
  getResultClass,
  type TerminlisteKamp,
} from '../player-match-records/PlayerMatchHistory'
import { TeamSelection } from '../player-match-records/TeamSelection'

const typedAggregatesData: PlayerAggregatesData = aggregatesData
const typedStatsData: PlayerStatsData = statsData
const typedTerminlisteData: TerminlisteKamp[] = terminlisteData

export function SpillerDetaljPage() {
  const { id } = useParams<{ id?: PlayerId }>()
  const navigate = useNavigate()

  const aggregates = typedAggregatesData
  const stats = typedStatsData
  const terminliste = typedTerminlisteData

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const player = useMemo(() => {
    if (!id) return undefined
    return aggregates.aggregates.find((p) => p.playerId === id)
  }, [aggregates, id])

  const matchHistory = useMemo(() => {
    if (!id) return PlayerMatchHistory.empty()
    return PlayerMatchHistory.build(id, stats, terminliste)
  }, [stats, id, terminliste])

  const teamStats = useMemo(() => matchHistory.aggregateTeamStats(), [matchHistory])

  const [teamSelection, setTeamSelection] = useState<TeamSelection>(() => new TeamSelection())

  const toggleTeam = useCallback((teamId: string) => {
    setTeamSelection((prev) => prev.toggle(teamId))
  }, [])

  const clearSelection = useCallback(() => {
    setTeamSelection((prev) => prev.clear())
  }, [])

  const filteredMatchHistory = useMemo(
    () => matchHistory.filterByTeams(teamSelection),
    [matchHistory, teamSelection]
  )

  const filteredStats = useMemo(() => filteredMatchHistory.calculateStats(), [filteredMatchHistory])

  if (!player) {
    return <Navigate to="/spillere" replace />
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
          <div className="player-detail-header">
            <div className="player-jersey-badge">{formatJerseyNumber(player)}</div>
            <div className="player-detail-info">
              <h1>{player.playerName}</h1>
            </div>
          </div>
        </div>

        {teamStats.length > 1 && (
          <div className="team-chip-filter">
            <button
              className={`team-chip ${teamSelection.isEmpty() ? 'team-chip-active' : ''}`}
              onClick={clearSelection}
            >
              Alle lag
              <span className="team-chip-count">{matchHistory.count()}</span>
            </button>
            {teamStats.map((team) => {
              const isSelected = teamSelection.hasTeam(team.teamId)
              return (
                <button
                  key={team.teamId}
                  className={`team-chip ${isSelected ? 'team-chip-active' : ''}`}
                  onClick={() => toggleTeam(team.teamId)}
                >
                  {team.teamName}
                  <span className="team-chip-count">{team.matches}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="player-detail-stats">
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredStats.totalGoals}</div>
            <div className="player-stat-label">Mål totalt</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredStats.totalPenaltyGoals}</div>
            <div className="player-stat-label">7m-mål</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredStats.totalTwoMinutes}</div>
            <div className="player-stat-label">2 min</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredStats.matchCount}</div>
            <div className="player-stat-label">Kamper</div>
          </div>
          {filteredStats.goalsPerMatch !== null && (
            <div className="player-stat-card">
              <div className="player-stat-value">{filteredStats.goalsPerMatch.toFixed(1)}</div>
              <div className="player-stat-label">Mål/kamp</div>
            </div>
          )}
          <div className="player-stat-card">
            <div className="player-stat-value">{filteredStats.totalYellowCards}</div>
            <div className="player-stat-label">Advarsler</div>
          </div>
        </div>

        {!filteredMatchHistory.isEmpty() && (
          <div className="player-charts-section">
            <h2>Statistikk</h2>
            <div className="player-charts-grid">
              <div className="player-chart-card">
                <h3>Mål per kamp ({filteredStats.matchCount} kamper)</h3>
                {(() => {
                  const reversed = filteredMatchHistory.reverse()
                  const goalValues = reversed.map((m) => m.goals)
                  const maxGoals = goalValues.length > 0 ? Math.max(...goalValues) : 1
                  return (
                    <div className="goals-timeline-container">
                      <div className="goals-y-axis">
                        <span className="goals-y-label">{maxGoals}</span>
                        <span className="goals-y-label">{Math.round(maxGoals / 2)}</span>
                        <span className="goals-y-label">0</span>
                      </div>
                      <div className="goals-timeline">
                        {reversed.map((match) => {
                          const resultClass = getResultClass(match)
                          const resultLetter = match.draw ? 'U' : match.won ? 'S' : 'T'
                          return (
                            <div key={match.matchId} className="goals-bar-wrapper">
                              <div
                                className={`goals-bar goals-bar-${resultClass}`}
                                style={{
                                  height: `${(match.goals / maxGoals) * 100}%`,
                                  minHeight: match.goals > 0 ? '8px' : '2px',
                                }}
                              >
                                <div className="goals-bar-tooltip">
                                  <strong>{player.playerName}</strong>: {match.goals} mål
                                  <br />
                                  {match.homeTeam} – {match.awayTeam}
                                  <br />
                                  {match.result} ({resultLetter})
                                  {match.penaltyGoals > 0 && (
                                    <>
                                      <br />
                                      {match.penaltyGoals} 7m
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className={`goals-bar-label goals-bar-result-${resultClass}`}>
                                <span className="goals-bar-date">
                                  {match.matchDate.slice(0, 5)}
                                </span>
                                <span className="goals-bar-result">{resultLetter}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="player-chart-card">
                <h3>Målfordeling</h3>
                <div className="goals-breakdown">
                  {(() => {
                    const {
                      regularGoals,
                      totalPenaltyGoals: penaltyGoals,
                      totalGoals: total,
                    } = filteredStats
                    const regularPct = total > 0 ? (regularGoals / total) * 100 : 0
                    const penaltyPct = total > 0 ? (penaltyGoals / total) * 100 : 0
                    const regularDash = (regularPct / 100) * 283
                    const penaltyDash = (penaltyPct / 100) * 283

                    return (
                      <>
                        <div className="pie-chart-container">
                          <svg className="pie-chart" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke="var(--ds-color-border-default)"
                              strokeWidth="10"
                            />
                            {total > 0 && (
                              <>
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="45"
                                  fill="none"
                                  stroke="var(--ds-color-accent-base)"
                                  strokeWidth="10"
                                  strokeDasharray={`${regularDash} 283`}
                                  strokeLinecap="round"
                                />
                                {penaltyGoals > 0 && (
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="var(--ds-color-palette-3)"
                                    strokeWidth="10"
                                    strokeDasharray={`${penaltyDash} 283`}
                                    strokeDashoffset={-regularDash}
                                    strokeLinecap="round"
                                  />
                                )}
                              </>
                            )}
                          </svg>
                          <div className="pie-chart-center">
                            <div className="pie-chart-total">{total}</div>
                            <div className="pie-chart-label">Mål</div>
                          </div>
                        </div>
                        <div className="pie-chart-legend">
                          <div className="legend-item">
                            <span className="legend-color legend-color-regular"></span>
                            <span>Fra spill</span>
                            <span className="legend-value">{regularGoals}</span>
                          </div>
                          <div className="legend-item">
                            <span className="legend-color legend-color-penalty"></span>
                            <span>Straffe (7m)</span>
                            <span className="legend-value">{penaltyGoals}</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="player-match-history">
          <h2>
            Kamphistorikk ({filteredMatchHistory.count()} kamper)
            {!teamSelection.isEmpty() && (
              <button className="clear-filter-btn" onClick={clearSelection}>
                Vis alle
              </button>
            )}
          </h2>
          <div className="player-match-list">
            {filteredMatchHistory.getItems().map((match) => {
              const resultClass = getResultClass(match)
              const homeTeamLink = `/lag/${match.homeTeamId}?turnering=${encodeURIComponent(match.tournament)}`
              const awayTeamLink = `/lag/${match.awayTeamId}?turnering=${encodeURIComponent(match.tournament)}`

              return (
                <div key={match.matchId} className={`player-match-card ${resultClass}-card`}>
                  <div className="player-match-info">
                    <div className="player-match-teams">
                      <Link
                        to={homeTeamLink}
                        className={`player-match-team-link ${match.isHome ? 'player-match-team-ours' : ''}`}
                      >
                        {match.homeTeam}
                      </Link>
                      <span className="player-match-vs">–</span>
                      <Link
                        to={awayTeamLink}
                        className={`player-match-team-link ${!match.isHome ? 'player-match-team-ours' : ''}`}
                      >
                        {match.awayTeam}
                      </Link>
                    </div>
                    <div className="player-match-result">
                      <span className={`result-badge ${resultClass}`}>{match.result}</span>
                    </div>
                    <div className="player-match-meta">
                      {match.matchDate} &middot; {match.tournament}
                    </div>
                  </div>
                  <div className="player-match-stats">
                    <span className="stat-pill stat-pill-goals">
                      {match.goals} <span className="stat-pill-label">mål</span>
                    </span>
                    <span className="stat-pill stat-pill-7m">
                      {match.penaltyGoals} <span className="stat-pill-label">7m</span>
                    </span>
                    <span className="stat-pill stat-pill-2m">
                      {match.twoMinutes} <span className="stat-pill-label">2min</span>
                    </span>
                  </div>
                  {match.matchUrl && (
                    <a
                      href={match.matchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="player-match-link-icon"
                      aria-label="Se kampdetaljer på handball.no"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
