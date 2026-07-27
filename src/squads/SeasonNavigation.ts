import { currentSeasonSlug, seasonsForSquad, type SeasonChoice } from './SeasonDataLoader'

export function pathToSeason(squadId: string, seasonSlug: string): string {
  return seasonSlug === currentSeasonSlug ? `/${squadId}` : `/${squadId}/${seasonSlug}`
}

export function pathToSquad(nextSquadId: string, seasonSlug: string): string {
  const hasSameSeason = seasonsForSquad(nextSquadId).some((choice) => choice.slug === seasonSlug)
  return pathToSeason(nextSquadId, hasSameSeason ? seasonSlug : currentSeasonSlug)
}

export function previousSeasons(squadId: string): SeasonChoice[] {
  return seasonsForSquad(squadId).filter((choice) => choice.isArchived)
}
