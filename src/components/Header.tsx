import { Link } from 'react-router-dom'
import { ThemeSelector } from './ThemeSelector'

interface HeaderProps {
  onScrollToNext?: () => void
  showScrollButton?: boolean
}

export function Header({ onScrollToNext, showScrollButton = true }: HeaderProps) {
  return (
    <header className="page-header">
      <div className="container">
        <div className="header-brand">
          <Link to="/">
            <img
              src="/fjellhammer-logo.svg"
              alt="Fjellhammer logo"
              className="header-logo"
            />
          </Link>
          <div className="header-text">
            <span>Fjellhammer IL</span>
            <h1>Terminliste G2010</h1>
          </div>
        </div>

        <div className="header-buttons">
          {showScrollButton && onScrollToNext && (
            <button
              className="next-match-btn"
              aria-label="Gå til neste kamp"
              onClick={onScrollToNext}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>Neste kamp</span>
            </button>
          )}

          <Link
            to="/tabeller"
            className="tables-btn"
            aria-label="Tabeller"
            title="Se serietabeller"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
            </svg>
            <span>Tabeller</span>
          </Link>

          <Link
            to="/statistikk"
            className="stats-btn"
            aria-label="Statistikk"
            title="Kampstatistikk"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Statistikk</span>
          </Link>

          <ThemeSelector />
        </div>
      </div>
    </header>
  )
}
