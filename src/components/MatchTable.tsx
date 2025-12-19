import type { Match } from '../types'

interface MatchTableProps {
  matches: Match[]
  hasMultipleTeams: boolean
  getTeamColor: (teamName?: string) => string
}

export function MatchTable({ matches, hasMultipleTeams, getTeamColor }: MatchTableProps) {
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
            const isHome = match.Hjemmelag?.toLowerCase().includes('fjellhammer')
            const hasResult = match['H-B'] && match['H-B'].trim() !== '' && match['H-B'] !== '-'
            return (
              <tr
                key={`${match.Dato}-${match.Tid}-${index}`}
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
                      href={match['Kamp URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="match-link"
                    >
                      Se kamp
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
