interface LeagueTableRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

export interface LeagueTable {
  tournamentName: string
  tournamentUrl: string
  rows: LeagueTableRow[]
}

interface LeagueTableCardProps {
  table: LeagueTable
  showExternalLink?: boolean
}

export function LeagueTableCard({ table, showExternalLink = true }: LeagueTableCardProps) {
  const shortName = table.tournamentName.split(',')[0].replace('Regionserien ', '')

  return (
    <div className="table-card">
      <div className="table-card-header">
        <h4>{shortName}</h4>
        {showExternalLink && (
          <a
            href={table.tournamentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="table-link"
            aria-label="Se på handball.no"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
      <table className="league-table">
        <thead>
          <tr>
            <th className="col-pos">#</th>
            <th className="col-team">Lag</th>
            <th className="col-num">K</th>
            <th className="col-num col-win">S</th>
            <th className="col-num col-draw">U</th>
            <th className="col-num col-loss">T</th>
            <th className="col-num">+/-</th>
            <th className="col-num col-points">P</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            const isFjellhammer = row.team.toLowerCase().includes('fjellhammer')
            const goalDiff = row.goalsFor - row.goalsAgainst
            return (
              <tr key={row.position} className={isFjellhammer ? 'row-highlight' : ''}>
                <td className="col-pos">
                  <span className={`position-badge position-${row.position}`}>
                    {row.position}
                  </span>
                </td>
                <td className="col-team">
                  {isFjellhammer && <span className="team-marker">●</span>}
                  {row.team}
                </td>
                <td className="col-num">{row.played}</td>
                <td className="col-num col-win">{row.won}</td>
                <td className="col-num col-draw">{row.drawn}</td>
                <td className="col-num col-loss">{row.lost}</td>
                <td className={`col-num ${goalDiff > 0 ? 'positive' : goalDiff < 0 ? 'negative' : ''}`}>
                  {goalDiff > 0 ? '+' : ''}{goalDiff}
                </td>
                <td className="col-num col-points">{row.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
