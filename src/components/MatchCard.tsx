import { Link } from 'react-router-dom'
import type { Match } from '../types'
import { getMapsUrl } from '../utils/maps'
import { Countdown } from './Countdown'

const extractLagId = (url?: string): string | null => {
  if (!url) return null
  const match = url.match(/lagid=(\d+)/)
  return match ? match[1] : null
}

interface MatchCardProps {
  match: Match
  isNextMatch: boolean
  hasMultipleTeams: boolean
  getTeamColor: (teamName?: string) => string
  hasTable?: boolean
  onOpenTable?: (teamName: string, tournamentName: string) => void
}

const isFjellhammerTeam = (teamName?: string): boolean =>
  teamName?.toLowerCase().includes('fjellhammer') ?? false

const getWeekday = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('.')) return ''
  const parts = dateStr.split('.')
  if (parts.length !== 3) return ''
  const [day, month, year] = parts.map(Number)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return ''
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('nb-NO', { weekday: 'short' })
}

const isValidScore = (score?: string): boolean => !!score && score.trim() !== '' && score !== '-'

const parseScore = (score: string): { home: number; away: number } | null => {
  const parts = score.split('-')
  if (parts.length !== 2) return null

  const home = parseInt(parts[0].trim())
  const away = parseInt(parts[1].trim())

  if (isNaN(home) || isNaN(away)) return null
  return { home, away }
}

interface TeamNameProps {
  name?: string
  lagId: string | null
  tournament?: string
  hasTable: boolean
  isOurs: boolean
  showDot: boolean
  dotColor: string
  position: 'home' | 'away'
}

function TeamName({
  name,
  lagId,
  tournament,
  hasTable,
  isOurs,
  showDot,
  dotColor,
  position,
}: TeamNameProps) {
  const classNames = ['card-team-name', isOurs ? 'card-team-ours' : '', `card-team-${position}`]
    .filter(Boolean)
    .join(' ')

  const shouldFilterByTournament = hasTable && tournament
  const linkUrl = lagId
    ? `/lag/${lagId}${shouldFilterByTournament ? `?turnering=${encodeURIComponent(tournament)}` : ''}`
    : null

  const nameElement = linkUrl ? (
    <Link to={linkUrl} className="card-team-link">
      {name}
    </Link>
  ) : (
    <span className="card-team-text">{name}</span>
  )

  return (
    <span className={classNames}>
      {position === 'home' && nameElement}
      {showDot && <span className="card-team-dot" style={{ backgroundColor: dotColor }} />}
      {position === 'away' && nameElement}
    </span>
  )
}

export function MatchCard({
  match,
  isNextMatch,
  hasMultipleTeams,
  getTeamColor,
  hasTable = false,
  onOpenTable,
}: MatchCardProps) {
  const isHome = isFjellhammerTeam(match.Hjemmelag)
  const isAway = isFjellhammerTeam(match.Bortelag)
  const hasResult = isValidScore(match['H-B'])

  const getMatchResult = (): 'win' | 'loss' | 'draw' | null => {
    const score = match['H-B']
    if (!isValidScore(score)) return null

    const parsed = parseScore(score)
    if (!parsed) return null

    const { home, away } = parsed

    if (home === away) return 'draw'

    if (isHome && home > away) return 'win'
    if (isAway && away > home) return 'win'

    if (isHome && home < away) return 'loss'
    if (isAway && away < home) return 'loss'

    return null
  }

  const result = getMatchResult()
  const resultEmoji =
    result === 'win' ? '✅' : result === 'draw' ? '⚖️' : result === 'loss' ? '❌' : null
  const classNames = [
    'match-card',
    result === 'win' ? 'win-card' : '',
    result === 'loss' ? 'loss-card' : '',
    result === 'draw' ? 'draw-card' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const teamDotColor = getTeamColor(match.Lag)

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
          <span className="card-date">
            {getWeekday(match.Dato)} {match.Dato}
          </span>
          <span className="card-time">{match.Tid}</span>
        </div>
        {match.Turnering && <span className="card-tournament-name">{match.Turnering}</span>}
      </div>

      {isNextMatch && !hasResult && <Countdown date={match.Dato} time={match.Tid} />}

      <div className="card-match">
        <div className="card-match-content">
          <div className="card-teams">
            <TeamName
              name={match.Hjemmelag}
              lagId={extractLagId(match['Hjemmelag URL'])}
              tournament={match.Turnering}
              hasTable={hasTable}
              isOurs={isHome}
              showDot={isHome && hasMultipleTeams}
              dotColor={teamDotColor}
              position="home"
            />
            <span className="card-teams-separator">-</span>
            <TeamName
              name={match.Bortelag}
              lagId={extractLagId(match['Bortelag URL'])}
              tournament={match.Turnering}
              hasTable={hasTable}
              isOurs={isAway}
              position="away"
              showDot={isAway && hasMultipleTeams}
              dotColor={teamDotColor}
            />
          </div>
          <div className="card-score">{hasResult ? match['H-B'] : '-'}</div>
          {match.Bane && <div className="card-venue">{match.Bane}</div>}
          {match.Tilskuere && <div className="card-spectators">{match.Tilskuere} tilskuere</div>}
        </div>
        {resultEmoji && <span className="card-result-watermark">{resultEmoji}</span>}
      </div>

      <div className="card-actions">
        {hasTable && match.Lag && match.Turnering && (
          <button
            type="button"
            className="card-action card-action-table"
            onClick={() => onOpenTable?.(match.Lag, match.Turnering)}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 6h1v1H4zM4 11h1v2H4zM4 17h1v2H4z" fill="currentColor" />
            </svg>
            Tabell
          </button>
        )}
        {match.Bane && (
          <a
            href={getMapsUrl(match.Bane)}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action card-action-map"
          >
            <svg
              width="16"
              height="16"
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
        {match['Kamp URL'] && (
          <a
            href={match['Kamp URL']}
            target="_blank"
            rel="noopener noreferrer"
            className="card-action card-action-primary"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Detaljer
          </a>
        )}
      </div>
    </div>
  )
}
