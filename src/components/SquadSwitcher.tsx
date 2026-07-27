import { useNavigate } from 'react-router-dom'
import { squads, seasonsForSquad } from '../squads/SeasonDataLoader'
import { seasonPath, useSquadPath } from '../squads/useSquadPath'
import { seasonOptionLabel } from '../squads/SeasonLabels'

export function SquadSwitcher() {
  const { squadId, season } = useSquadPath()
  const navigate = useNavigate()

  const seasons = seasonsForSquad(squadId)
  const hasArchive = seasons.length > 1

  const goToSquad = (nextSquadId: string): void => {
    navigate(`/${nextSquadId}`)
  }

  const goToSeason = (nextSeason: string): void => {
    navigate(seasonPath(squadId, nextSeason))
  }

  return (
    <div className="squad-switcher">
      <div className="squad-tabs" role="group" aria-label="Velg kull">
        {squads.map((squad) => (
          <button
            key={squad.id}
            type="button"
            className={`squad-tab ${squad.id === squadId ? 'active' : ''}`}
            aria-pressed={squad.id === squadId}
            onClick={() => goToSquad(squad.id)}
          >
            {squad.id.toUpperCase()}
          </button>
        ))}
      </div>

      {hasArchive && (
        <select
          className="season-select"
          aria-label="Velg sesong"
          value={season}
          onChange={(event) => goToSeason(event.target.value)}
        >
          {seasons.map((choice) => (
            <option key={choice.slug} value={choice.slug}>
              {seasonOptionLabel(choice.name, choice.isArchived)}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
