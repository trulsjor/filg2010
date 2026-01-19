import { useMemo, useCallback } from 'react'
import { Link, useParams, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header'
import configData from '../../config.json'
import statsData from '../../data/player-stats.json'
import terminlisteData from '../../data/terminliste.json'
import type { Config } from '../types'
import type { PlayerStatsData } from '../types/player-stats'
import { TeamStatsAggregate, type TerminlisteMatch } from '../team-stats/TeamStatsAggregate'

const typedStatsData: PlayerStatsData = statsData
const typedConfig: Config = configData
const typedTerminlisteData: TerminlisteMatch[] = terminlisteData
const CHART_MIN_MAX_GOALS = 1

export function LagDetaljPage() {
  const params = useParams<{ lagId: string }>()
  const lagId = params.lagId
  const [searchParams] = useSearchParams()
  const tournamentFilter = searchParams.get('turnering')
  const navigate = useNavigate()
  const ourTeamIds = useMemo(() => TeamStatsAggregate.createOurTeamIds(typedConfig), [])

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const allTournaments = useMemo(() => {
    if (!lagId) return []
    return TeamStatsAggregate.findTeamTournaments(lagId, typedStatsData)
  }, [lagId])

  const teamData = useMemo(() => {
    if (!lagId) return null
    return TeamStatsAggregate.buildTeamDetailData(
      lagId,
      typedStatsData,
      typedTerminlisteData,
      ourTeamIds,
      tournamentFilter
    )
  }, [lagId, ourTeamIds, tournamentFilter])

  if (!teamData) {
    return <Navigate to="/" replace />
  }

  const reversed = [...teamData.matches].reverse()
  const maxGoals = Math.max(
    ...reversed.map((m) => m.goalsScored),
    ...reversed.map((m) => m.goalsConceded),
    CHART_MIN_MAX_GOALS
  )

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
          <div className="team-detail-header">
            <h1>{teamData.teamName}</h1>
            {teamData.isOurTeam && <span className="our-team-badge">Vårt lag</span>}
          </div>
        </div>

        {allTournaments.length > 1 && (
          <div className="team-chip-filter">
            <Link
              to={`/lag/${lagId}`}
              className={`team-chip ${!tournamentFilter ? 'team-chip-active' : ''}`}
            >
              Alle turneringer
            </Link>
            {allTournaments.map((tournament) => (
              <Link
                key={tournament}
                to={`/lag/${lagId}?turnering=${encodeURIComponent(tournament)}`}
                className={`team-chip ${tournamentFilter === tournament ? 'team-chip-active' : ''}`}
              >
                {tournament}
              </Link>
            ))}
          </div>
        )}

        <div className="player-detail-stats">
          <div className="player-stat-card">
            <div className="player-stat-value">{teamData.stats.matchCount}</div>
            <div className="player-stat-label">Kamper</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{teamData.stats.wins}</div>
            <div className="player-stat-label">Seire</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{teamData.stats.draws}</div>
            <div className="player-stat-label">Uavgjort</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">{teamData.stats.losses}</div>
            <div className="player-stat-label">Tap</div>
          </div>
          <div className="player-stat-card">
            <div className="player-stat-value">
              {teamData.stats.goalsScored}–{teamData.stats.goalsConceded}
            </div>
            <div className="player-stat-label">Mål</div>
          </div>
          <div className="player-stat-card">
            <div
              className={`player-stat-value ${teamData.stats.goalDiff > 0 ? 'positive' : teamData.stats.goalDiff < 0 ? 'negative' : ''}`}
            >
              {teamData.stats.goalDiff > 0 ? '+' : ''}
              {teamData.stats.goalDiff}
            </div>
            <div className="player-stat-label">Målforskjell</div>
          </div>
        </div>

        <div className="player-charts-section">
          <h2>Form</h2>
          <div className="player-chart-card">
            <h3>Mål scoret / sluppet inn</h3>
            <div className="goals-diverging-container">
              <div className="goals-diverging-y-axis">
                <span className="goals-y-label">+{maxGoals}</span>
                <span className="goals-y-label">+{Math.round(maxGoals / 2)}</span>
                <span className="goals-y-label goals-y-label-zero">0</span>
                <span className="goals-y-label">−{Math.round(maxGoals / 2)}</span>
                <span className="goals-y-label">−{maxGoals}</span>
              </div>
              <div className="goals-diverging-chart">
                <div className="goals-diverging-bars">
                  {reversed.map((match) => {
                    const resultClass = match.resultType
                    const resultLetter = match.result.getDisplayLetter()
                    return (
                      <div key={match.matchId} className="goals-diverging-bar-wrapper">
                        <div className="goals-diverging-positive">
                          <div
                            className={`goals-bar goals-bar-${resultClass}`}
                            style={{
                              height: `${(match.goalsScored / maxGoals) * 100}%`,
                              minHeight: match.goalsScored > 0 ? '4px' : '0',
                            }}
                          />
                        </div>
                        <div className="goals-diverging-negative">
                          <div
                            className={`goals-bar goals-bar-conceded goals-bar-${resultClass}`}
                            style={{
                              height: `${(match.goalsConceded / maxGoals) * 100}%`,
                              minHeight: match.goalsConceded > 0 ? '4px' : '0',
                            }}
                          />
                        </div>
                        <div className="goals-bar-tooltip">
                          <div className="tooltip-result">
                            {match.goalsScored}–{match.goalsConceded}
                          </div>
                          <div className="tooltip-teams">
                            {match.isHome ? teamData.teamName : match.opponent} –{' '}
                            {match.isHome ? match.opponent : teamData.teamName}
                          </div>
                          <div className="tooltip-date">{match.matchDate}</div>
                        </div>
                        <div className={`goals-bar-label goals-bar-result-${resultClass}`}>
                          <span className="goals-bar-date">{match.matchDate.slice(0, 5)}</span>
                          <span className="goals-bar-result">{resultLetter}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="goals-diverging-zero-line" />
              </div>
            </div>
          </div>
        </div>

        <div className="player-match-history">
          <h2>Kamphistorikk ({teamData.matches.length} kamper)</h2>
          <div className="player-match-list">
            {teamData.matches.map((match) => {
              const resultClass = match.resultType

              const homeTeamLink = match.isHome
                ? `/lag/${lagId}?turnering=${encodeURIComponent(match.tournament)}`
                : `/lag/${match.opponentId}?turnering=${encodeURIComponent(match.tournament)}`
              const awayTeamLink = match.isHome
                ? `/lag/${match.opponentId}?turnering=${encodeURIComponent(match.tournament)}`
                : `/lag/${lagId}?turnering=${encodeURIComponent(match.tournament)}`

              const cardContent = (
                <>
                  <div className="player-match-info">
                    <div className="player-match-teams">
                      <Link
                        to={homeTeamLink}
                        className={`player-match-team-link ${match.isHome ? 'player-match-team-ours' : ''}`}
                      >
                        {match.isHome ? teamData.teamName : match.opponent}
                      </Link>
                      <span className="player-match-vs">–</span>
                      <Link
                        to={awayTeamLink}
                        className={`player-match-team-link ${!match.isHome ? 'player-match-team-ours' : ''}`}
                      >
                        {match.isHome ? match.opponent : teamData.teamName}
                      </Link>
                      <span className={`result-badge ${resultClass}`}>
                        {match.goalsScored}–{match.goalsConceded}
                      </span>
                    </div>
                    <div className="player-match-meta">
                      {match.matchDate} &middot; {match.tournament}
                    </div>
                  </div>
                </>
              )

              return (
                <div key={match.matchId} className={`player-match-card ${resultClass}-card`}>
                  {cardContent}
                  {match.matchUrl && (
                    <a
                      href={match.matchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="player-match-link-icon"
                      aria-label="Se kampdetaljer"
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

        {teamData.players.length > 0 && (
          <div className="team-players-section">
            <h2>Spillere ({teamData.players.length})</h2>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th className="col-rank">#</th>
                    <th className="col-player">Spiller</th>
                    <th className="col-stat">Mål</th>
                    <th className="col-stat">7m</th>
                    <th className="col-stat">2m</th>
                    <th className="col-stat">K</th>
                  </tr>
                </thead>
                <tbody>
                  {teamData.players.map((player, idx) => (
                    <tr key={player.playerId}>
                      <td className="col-rank">{idx + 1}</td>
                      <td className="col-player">
                        <Link to={`/spillere/${player.playerId}`} className="player-name-link">
                          {player.jerseyNumber !== undefined && (
                            <span className="jersey-number">{player.jerseyNumber}</span>
                          )}
                          {player.playerName}
                        </Link>
                      </td>
                      <td className="col-stat col-goals">{player.goals}</td>
                      <td className="col-stat">{player.penaltyGoals}</td>
                      <td className="col-stat">{player.twoMinutes}</td>
                      <td className="col-stat">{player.matches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
