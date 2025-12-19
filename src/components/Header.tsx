import { Link } from 'react-router-dom'

interface HeaderProps {
  onScrollToNext?: () => void
}

export function Header({ onScrollToNext }: HeaderProps) {
  return (
    <header className="page-header">
      <img
        src="/fjellhammer-logo.svg"
        alt="Fjellhammer logo"
        width={120}
        height={120}
        loading="lazy"
        className="header-logo"
      />
      <div className="header-text">
        <span>Fjellhammer IL</span>
        <h1>Terminliste G2010</h1>
      </div>
      <div className="header-buttons">
        <button
          className="next-match-btn"
          aria-label="Gå til neste kamp"
          onClick={onScrollToNext}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span>Neste kamp</span>
        </button>
        <a
          href="/calendar.ics"
          className="calendar-btn"
          aria-label="Abonner på kalender"
          title="Legg til i kalender"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Kalender</span>
        </a>
        <Link
          to="/statistikk"
          className="calendar-btn"
          aria-label="Statistikk"
          title="Kampstatistikk"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span>Statistikk</span>
        </Link>
      </div>
    </header>
  )
}
