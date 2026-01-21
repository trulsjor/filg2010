import { useEffect, useCallback } from 'react'
import { LeagueTableCard, type LeagueTable } from './LeagueTableCard'
import type { TeamId, TeamName } from '../types'

interface TableOverlayProps {
  tables: LeagueTable[]
  teamName: string
  onClose: () => void
  teamNameToId?: Map<TeamName, TeamId>
}

export function TableOverlay({ tables, teamName, onClose, teamNameToId }: TableOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="table-overlay-backdrop" onClick={handleBackdropClick}>
      <div
        className="table-overlay-content"
        role="dialog"
        aria-modal="true"
        aria-label={`Tabell for ${teamName}`}
      >
        <button className="table-overlay-close" onClick={onClose} aria-label="Lukk">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="table-overlay-body">
          {tables.map((table) => (
            <LeagueTableCard key={table.tournamentUrl} table={table} teamNameToId={teamNameToId} />
          ))}
        </div>
      </div>
    </div>
  )
}
