import { Link } from 'react-router-dom'
import { useSeason } from '../squads/SeasonAccess'
import { currentSeasonSlug } from '../squads/SeasonDataLoader'
import { pathToSeason } from '../squads/SeasonNavigation'
import { shortSeasonName } from '../squads/SeasonLabels'

export function ArchiveBanner() {
  const { squad, seasonName, isArchived } = useSeason()

  if (!isArchived) return null

  return (
    <div className="archive-banner" role="status">
      <span className="archive-banner-text">Du ser på sesongen {shortSeasonName(seasonName)}</span>
      <Link to={pathToSeason(squad.id, currentSeasonSlug)} className="archive-banner-exit">
        Tilbake til inneværende sesong
      </Link>
    </div>
  )
}
