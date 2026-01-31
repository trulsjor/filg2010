import type { Match } from '../types'
import { isFjellhammerTeam, isValidScore } from '../hooks/useMatches'

const isOldMatch = (dateStr: string): boolean => {
  if (!dateStr || !dateStr.includes('.')) return false
  const parts = dateStr.split('.')
  if (parts.length !== 3) return false
  const [day, month, year] = parts.map(Number)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  const matchDate = new Date(year, month - 1, day)
  if (isNaN(matchDate.getTime())) return false
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  return matchDate < oneDayAgo
}

interface MatchTableProps {
  matches: Match[]
  hasMultipleTeams: boolean
  getTeamColor: (teamName?: string) => string
  nextMatch?: Match | null
}

export function MatchTable({
  matches,
  hasMultipleTeams,
  getTeamColor,
  nextMatch,
}: MatchTableProps) {
  return (
    <div className="table-container" role="region" aria-label="Kampoversikt" tabIndex={0}>
      <table aria-label="Terminliste for Fjellhammer G2010">
        <thead>
          <tr>
            {hasMultipleTeams && <th>Lag</th>}
            <th>Dato</th>
            <th>Tid</th>
            <th>Hjemmelag</th>
            <th>Bortelag</th>
            <th>H-B</th>
            <th>Bane</th>
            <th>Turnering</th>
            <th>Kamp</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match, index) => {
            const isHome = isFjellhammerTeam(match.Hjemmelag)
            const hasResult = isValidScore(match['H-B'])
            const isNextMatch = nextMatch === match
            return (
              <tr
                key={`${match.Dato}-${match.Tid}-${index}`}
                id={isNextMatch ? 'next-match-row' : undefined}
                className={isNextMatch ? 'next-match-row' : undefined}
                data-team={match.Lag}
                data-location={isHome ? 'home' : 'away'}
                data-status={hasResult ? 'played' : 'upcoming'}
              >
                {hasMultipleTeams && (
                  <td>
                    <span
                      className="team-indicator"
                      style={{ backgroundColor: getTeamColor(match.Lag) }}
                    />
                    <span className="team-name">{match.Lag}</span>
                  </td>
                )}
                <td>{match.Dato}</td>
                <td>{match.Tid}</td>
                <td>
                  {match['Hjemmelag URL'] ? (
                    <a href={match['Hjemmelag URL']} target="_blank" rel="noopener noreferrer">
                      {match.Hjemmelag}
                    </a>
                  ) : (
                    match.Hjemmelag
                  )}
                </td>
                <td>
                  {match['Bortelag URL'] ? (
                    <a href={match['Bortelag URL']} target="_blank" rel="noopener noreferrer">
                      {match.Bortelag}
                    </a>
                  ) : (
                    match.Bortelag
                  )}
                </td>
                <td>{match['H-B'] && match['H-B'].trim() !== '' ? match['H-B'] : '-'}</td>
                <td>{match.Bane}</td>
                <td>
                  {match['Turnering URL'] ? (
                    <a href={match['Turnering URL']} target="_blank" rel="noopener noreferrer">
                      {match.Turnering}
                    </a>
                  ) : (
                    match.Turnering
                  )}
                </td>
                <td>
                  {match['Kamp URL'] ? (
                    <a
                      href={
                        isOldMatch(match.Dato)
                          ? match['Kamp URL']
                          : match['Kamp URL'].replace(
                              /\/system\/kamper\/kamp\/\?matchid=/i,
                              '/system/live-kamp/?matchId='
                            )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="match-link"
                    >
                      {isOldMatch(match.Dato) ? 'Detaljer' : 'Live'}
                    </a>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
