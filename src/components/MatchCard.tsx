import type { Match } from '../types'

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

  const isFjellhammerWin = (): boolean => {
    const score = match['H-B']
    if (!score || score.trim() === '' || score === '-') return false

    const [homeScore, awayScore] = score.split('-').map((s) => parseInt(s.trim()))
    if (isNaN(homeScore) || isNaN(awayScore)) return false

    const fjellhammerIsHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
    const fjellhammerIsAway = match.Bortelag?.toLowerCase().includes('fjellhammer')

    if (fjellhammerIsHome && homeScore > awayScore) return true
    if (fjellhammerIsAway && awayScore > homeScore) return true

    return false
  }

  const classNames = ['match-card', isFjellhammerWin() ? 'win-card' : '']
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
        {hasMultipleTeams && (
          <div className="card-team-indicator">
            <span
              className="card-team-dot"
              style={{ backgroundColor: getTeamColor(match.Lag) }}
            />
            <span>{match.Lag}</span>
          </div>
        )}
      </div>

      <div className="card-match">
        <div className="card-teams">
          {match['Hjemmelag URL'] ? (
            <a href={match['Hjemmelag URL']} target="_blank" rel="noopener noreferrer">
              {match.Hjemmelag}
            </a>
          ) : (
            <span>{match.Hjemmelag}</span>
          )}
          <span>-</span>
          {match['Bortelag URL'] ? (
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

      <div className="card-info">
        <div className="card-info-item">
          <span className="card-info-label">Bane</span>
          <span className="card-info-value">{match.Bane}</span>
        </div>
        <div className="card-info-item">
          <span className="card-info-label">Tilskuere</span>
          <span className="card-info-value">{match.Tilskuere || '-'}</span>
        </div>
      </div>

      {match['Turnering'] && (
        <div className="card-tournament">
          {match['Turnering URL'] ? (
            <a href={match['Turnering URL']} target="_blank" rel="noopener noreferrer">
              {match.Turnering}
            </a>
          ) : (
            <span>{match.Turnering}</span>
          )}
        </div>
      )}

      <div className="card-links">
        {match['Kamp URL'] && (
          <a
            href={match['Kamp URL']}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link"
          >
            Se kampdetaljer
          </a>
        )}
        {!isHome && match.Bane && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.Bane)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="card-link map-link"
            title="Finn veien"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Kart
          </a>
        )}
      </div>
    </div>
  )
}
