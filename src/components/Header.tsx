import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThemeSelector } from './ThemeSelector'
import type { FilterState } from '../hooks/useMatches'

interface HeaderProps {
  onScrollToNext?: () => void
  showScrollButton?: boolean
  teamNames?: string[]
  filters?: FilterState
  onFilterChange?: (filters: FilterState) => void
}

export function Header({
  onScrollToNext,
  showScrollButton = true,
  teamNames = [],
  filters,
  onFilterChange,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showFilters = filters && onFilterChange

  const activeCount = [filters?.team, filters?.location, filters?.status].filter(Boolean).length

  const toggle = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    if (!filters || !onFilterChange) return
    onFilterChange({ ...filters, [key]: filters[key] === value ? undefined : value })
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <header className="page-header">
      <div className="container">
        <div className="header-main">
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
            {showFilters && (
              <div className="filter-dropdown" ref={dropdownRef}>
                <button
                  className={`filter-toggle ${activeCount > 0 ? 'has-filters' : ''}`}
                  onClick={() => setIsOpen(!isOpen)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span className="btn-label">Filter</span>
                  {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
                </button>

                {isOpen && (
                  <div className="filter-menu">
                    {teamNames.length > 1 && (
                      <div className="filter-section">
                        <span className="filter-section-label">Lag</span>
                        {teamNames.map((name) => (
                          <button
                            key={name}
                            className={`filter-option ${filters.team === name ? 'active' : ''}`}
                            onClick={() => toggle('team', name)}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="filter-section">
                      <span className="filter-section-label">Sted</span>
                      <button
                        className={`filter-option ${filters.location === 'home' ? 'active' : ''}`}
                        onClick={() => toggle('location', 'home')}
                      >
                        Hjemme
                      </button>
                      <button
                        className={`filter-option ${filters.location === 'away' ? 'active' : ''}`}
                        onClick={() => toggle('location', 'away')}
                      >
                        Borte
                      </button>
                    </div>

                    <div className="filter-section">
                      <span className="filter-section-label">Status</span>
                      <button
                        className={`filter-option ${filters.status === 'upcoming' ? 'active' : ''}`}
                        onClick={() => toggle('status', 'upcoming')}
                      >
                        Kommende
                      </button>
                      <button
                        className={`filter-option ${filters.status === 'played' ? 'active' : ''}`}
                        onClick={() => toggle('status', 'played')}
                      >
                        Spilte
                      </button>
                    </div>

                    {activeCount > 0 && (
                      <button
                        className="filter-reset"
                        onClick={() => {
                          onFilterChange({})
                          setIsOpen(false)
                        }}
                      >
                        Nullstill alle
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {showScrollButton && onScrollToNext && (
              <button
                className="next-match-btn"
                aria-label="Gå til neste kamp"
                onClick={onScrollToNext}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="btn-label">Neste kamp</span>
              </button>
            )}

            <Link
              to="/tabeller"
              className="tables-btn"
              aria-label="Tabell"
              title="Se serietabell"
              data-testid="tabell-link"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="10" y1="6" x2="21" y2="6" />
                <line x1="10" y1="12" x2="21" y2="12" />
                <line x1="10" y1="18" x2="21" y2="18" />
                <path d="M4 6h1v1H4zM4 11h1v2H4zM4 17h1v2H4z" fill="currentColor" />
              </svg>
              <span className="btn-label">Tabell</span>
            </Link>

            <ThemeSelector />
          </div>
        </div>
      </div>
    </header>
  )
}
