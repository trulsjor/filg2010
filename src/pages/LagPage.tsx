import { useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import configData from '../../config.json'
import statsData from '../../data/player-stats.json'
import type { Config } from '../types'
import type { PlayerStatsData } from '../types/player-stats'
import { TeamStatsAggregate } from '../team-stats/TeamStatsAggregate'

const typedStatsData: PlayerStatsData = statsData
const typedConfig: Config = configData

export function LagPage() {
  const navigate = useNavigate()
  const ourTeamIds = useMemo(() => TeamStatsAggregate.createOurTeamIds(typedConfig), [])

  const handleScrollToNext = useCallback(() => {
    navigate('/', { state: { scrollToNext: true } })
  }, [navigate])

  const tournamentTeams = useMemo(() => {
    return TeamStatsAggregate.buildTournamentTeamSummaries(typedStatsData, ourTeamIds)
  }, [ourTeamIds])

  const sortedTournaments = useMemo(() => {
    const tournaments = Array.from(tournamentTeams.keys())
    return tournaments.sort((a, b) => {
      const aHasOurTeam = tournamentTeams.get(a)?.some((t) => t.isOurTeam)
      const bHasOurTeam = tournamentTeams.get(b)?.some((t) => t.isOurTeam)
      if (aHasOurTeam !== bHasOurTeam) return aHasOurTeam ? -1 : 1
      return a.localeCompare(b, 'nb')
    })
  }, [tournamentTeams])

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
            <h1>Lagstatistikk</h1>
            <p className="stats-subtitle">Statistikk per turnering</p>
          </div>
        </div>

        {sortedTournaments.map((tournament) => {
          const teams = tournamentTeams.get(tournament)
          if (!teams) return null
          const ourTeams = teams.filter((t) => t.isOurTeam)
          const otherTeams = teams.filter((t) => !t.isOurTeam)

          return (
            <div key={tournament} className="team-list-section">
              <h2>{tournament}</h2>

              {ourTeams.length > 0 && (
                <div className="team-cards-grid">
                  {ourTeams.map((team) => (
                    <Link
                      key={team.teamId}
                      to={`/lag/${team.teamId}?turnering=${encodeURIComponent(tournament)}`}
                      className="team-card team-card-ours"
                    >
                      <div className="team-card-header">
                        <h3>{team.teamName}</h3>
                      </div>
                      <div className="team-card-stats">
                        <div className="team-card-record">
                          <span className="team-wins">{team.wins}S</span>
                          <span className="team-draws">{team.draws}U</span>
                          <span className="team-losses">{team.losses}T</span>
                        </div>
                        <div className="team-card-goals">
                          {team.goalsScored}–{team.goalsConceded}
                          <span
                            className={`team-goal-diff ${team.goalDiff > 0 ? 'positive' : team.goalDiff < 0 ? 'negative' : ''}`}
                          >
                            ({team.goalDiff > 0 ? '+' : ''}
                            {team.goalDiff})
                          </span>
                        </div>
                      </div>
                      <div className="team-card-footer">{team.matches} kamper</div>
                    </Link>
                  ))}
                </div>
              )}

              {otherTeams.length > 0 && (
                <div className="team-list-compact">
                  {otherTeams.map((team) => (
                    <Link
                      key={team.teamId}
                      to={`/lag/${team.teamId}?turnering=${encodeURIComponent(tournament)}`}
                      className="team-list-item"
                    >
                      <span className="team-list-name">{team.teamName}</span>
                      <span className="team-list-record">
                        {team.wins}S {team.draws}U {team.losses}T
                      </span>
                      <span className="team-list-matches">{team.matches} kamper</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
