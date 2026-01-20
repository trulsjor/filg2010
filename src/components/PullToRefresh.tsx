import type { ReactNode } from 'react'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { useMetadata } from '../hooks/useMetadata'
import type { Metadata } from '../types'
import metadataData from '../../data/metadata.json'

const metadata = metadataData as Metadata

interface PullToRefreshProps {
  children: ReactNode
}

export function PullToRefresh({ children }: PullToRefreshProps) {
  const { pullDistance, isTriggered } = usePullToRefresh()
  const { formattedLastUpdated } = useMetadata(metadata)
  const isVisible = pullDistance > 10

  function getPullText(): string {
    if (isTriggered) return 'Slipp for å oppdatere'
    if (formattedLastUpdated) return `Sist oppdatert: ${formattedLastUpdated}`
    return 'Dra ned for å oppdatere'
  }

  return (
    <div className="pull-to-refresh-container">
      <div
        className={`pull-to-refresh-indicator ${isVisible ? 'visible' : ''} ${isTriggered ? 'triggered' : ''}`}
        style={{ height: isVisible ? `${Math.min(pullDistance, 60)}px` : 0 }}
      >
        <div className="pull-to-refresh-content">
          {isTriggered ? (
            <svg
              className="pull-to-refresh-spinner"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              className="pull-to-refresh-arrow"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
          <span className="pull-to-refresh-text">{getPullText()}</span>
        </div>
      </div>
      {children}
    </div>
  )
}
