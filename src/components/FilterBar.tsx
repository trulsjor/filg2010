import type { FilterState } from '../hooks/useMatches'

interface FilterBarProps {
  teamNames: string[]
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export function FilterBar({ teamNames, filters, onFilterChange }: FilterBarProps) {
  const handleTeamClick = (team: string | undefined) => {
    onFilterChange({ ...filters, team })
  }

  const handleLocationClick = (location: 'home' | 'away' | undefined) => {
    onFilterChange({ ...filters, location })
  }

  const handleStatusClick = (status: 'played' | 'upcoming' | undefined) => {
    onFilterChange({ ...filters, status })
  }

  return (
    <nav className="filter-bar" aria-label="Filtrer kamper">
      <div className="filter-group" role="group" aria-labelledby="filter-team-label">
        <span id="filter-team-label" className="filter-group-label">Lag:</span>
        <button
          className={`filter-btn ${!filters.team ? 'active' : ''}`}
          onClick={() => handleTeamClick(undefined)}
          aria-pressed={!filters.team}
        >
          Alle
        </button>
        {teamNames.map((teamName) => (
          <button
            key={teamName}
            className={`filter-btn ${filters.team === teamName ? 'active' : ''}`}
            onClick={() => handleTeamClick(teamName)}
            aria-pressed={filters.team === teamName}
          >
            {teamName}
          </button>
        ))}
      </div>

      <div className="filter-divider" aria-hidden="true" />

      <div className="filter-group" role="group" aria-labelledby="filter-location-label">
        <span id="filter-location-label" className="filter-group-label">Type:</span>
        <button
          className={`filter-btn ${!filters.location ? 'active' : ''}`}
          onClick={() => handleLocationClick(undefined)}
          aria-pressed={!filters.location}
        >
          Alle
        </button>
        <button
          className={`filter-btn ${filters.location === 'home' ? 'active' : ''}`}
          onClick={() => handleLocationClick('home')}
          aria-pressed={filters.location === 'home'}
        >
          Hjemme
        </button>
        <button
          className={`filter-btn ${filters.location === 'away' ? 'active' : ''}`}
          onClick={() => handleLocationClick('away')}
          aria-pressed={filters.location === 'away'}
        >
          Borte
        </button>
      </div>

      <div className="filter-divider" aria-hidden="true" />

      <div className="filter-group" role="group" aria-labelledby="filter-status-label">
        <span id="filter-status-label" className="filter-group-label">Status:</span>
        <button
          className={`filter-btn ${!filters.status ? 'active' : ''}`}
          onClick={() => handleStatusClick(undefined)}
          aria-pressed={!filters.status}
        >
          Alle
        </button>
        <button
          className={`filter-btn ${filters.status === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleStatusClick('upcoming')}
          aria-pressed={filters.status === 'upcoming'}
        >
          Kommende
        </button>
        <button
          className={`filter-btn ${filters.status === 'played' ? 'active' : ''}`}
          onClick={() => handleStatusClick('played')}
          aria-pressed={filters.status === 'played'}
        >
          Spilte
        </button>
      </div>
    </nav>
  )
}
