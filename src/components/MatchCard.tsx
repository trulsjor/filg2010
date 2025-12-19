import { Link } from 'react-router-dom'
import type { Match } from '../types'
import { getMapsUrl } from '../utils/maps'

interface MatchCardProps {
  match: Match
  isNextMatch: boolean
  hasMultipleTeams: boolean
  getTeamColor: (teamName?: string) => string
}

export function MatchCard({
  match,
  isNextMatch,
  hasMultipleTeams,
  getTeamColor,
}: MatchCardProps) {
  const isHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
  const hasResult = match['H-B'] && match['H-B'].trim() !== '' && match['H-B'] !== '-'

  const getMatchResult = (): 'win' | 'loss' | 'draw' | null => {
    const score = match['H-B']
    if (!score || score.trim() === '' || score === '-') return null

    const [homeScore, awayScore] = score.split('-').map((s) => parseInt(s.trim()))
    if (isNaN(homeScore) || isNaN(awayScore)) return null

    const fjellhammerIsHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
    const fjellhammerIsAway = match.Bortelag?.toLowerCase().includes('fjellhammer')

    if (homeScore === awayScore) return 'draw'

    if (fjellhammerIsHome && homeScore > awayScore) return 'win'
    if (fjellhammerIsAway && awayScore > homeScore) return 'win'

    if (fjellhammerIsHome && homeScore < awayScore) return 'loss'
    if (fjellhammerIsAway && awayScore < homeScore) return 'loss'

    return null
  }

  const result = getMatchResult()
  const classNames = [
    'match-card',
    result === 'win' ? 'win-card' : '',
    result === 'loss' ? 'loss-card' : '',
    result === 'draw' ? 'draw-card' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classNames}
      id={isNextMatch ? 'next-match-card' : undefined}
      data-team={match.Lag}
      data-location={isHome ? 'home' : 'away'}
      data-status={hasResult ? 'played' : 'upcoming'}
    >
      <div className="card-header">
        <div className="card-date-time">
          <span className="card-date">{match.Dato}</span>
          <span className="card-time">{match.Tid}</span>
        </div>
        {match.Turnering && (
          <span className="card-tournament-name">{match.Turnering}</span>
        )}
      </div>

      <div className="card-match">
        <div className="card-teams">
          {isHome ? (
            <span className="card-team-name card-team-ours">
              {hasMultipleTeams && (
                <span
                  className="card-team-dot"
                  style={{ backgroundColor: getTeamColor(match.Lag) }}
                />
              )}
              {match.Hjemmelag}
            </span>
          ) : match['Hjemmelag URL'] ? (
            <a href={match['Hjemmelag URL']} target="_blank" rel="noopener noreferrer">
              {match.Hjemmelag}
            </a>
          ) : (
            <span>{match.Hjemmelag}</span>
          )}
          <span className="card-teams-separator">-</span>
          {!isHome ? (
            <span className="card-team-name card-team-ours">
              {hasMultipleTeams && (
                <span
                  className="card-team-dot"
                  style={{ backgroundColor: getTeamColor(match.Lag) }}
                />
              )}
              {match.Bortelag}
            </span>
          ) : match['Bortelag URL'] ? (
            <a href={match['Bortelag URL']} target="_blank" rel="noopener noreferrer">
              {match.Bortelag}
            </a>
          ) : (
            <span>{match.Bortelag}</span>
          )}
        </div>
        <div className="card-score">
          {match['H-B'] && match['H-B'].trim() !== '' && match['H-B'] !== '-'
            ? match['H-B']
            : '-'}
        </div>
      </div>

      {(match.Bane || match.Tilskuere) && (
        <div className="card-meta">
          {match.Bane && <span className="card-meta-item">{match.Bane}</span>}
          {match.Bane && match.Tilskuere && <span className="card-meta-dot">·</span>}
          {match.Tilskuere && <span className="card-meta-item">{match.Tilskuere} tilskuere</span>}
        </div>
      )}

      <div className="card-actions">
        <Link
          to={`/tabeller#tabell-${match.Lag?.toLowerCase().replace(/\s+/g, '-')}`}
          className="card-action card-action-secondary"
        >
          Tabell
        </Link>
        {match.Bane && (
          <a
            href={getMapsUrl(match.Bane)}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action card-action-secondary"
          >
            Kart
          </a>
        )}
        {match['Kamp URL'] && (
          <a
            href={match['Kamp URL']}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action card-action-primary"
          >
            Detaljer
          </a>
        )}
      </div>
    </div>
  )
}
