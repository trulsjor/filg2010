const SEASON_PREFIX = 'Håndballsesongen '
const CLUB_PREFIX = 'Fjellhammer '

export function shortSeasonName(seasonName: string): string {
  return seasonName.startsWith(SEASON_PREFIX) ? seasonName.slice(SEASON_PREFIX.length) : seasonName
}

export function shortSquadName(squadName: string): string {
  return squadName.startsWith(CLUB_PREFIX) ? squadName.slice(CLUB_PREFIX.length) : squadName
}

export function archiveLabel(seasonName: string): string {
  return `Arkiv ${shortSeasonName(seasonName)}`
}

export function seasonOptionLabel(seasonName: string, isArchived: boolean): string {
  const season = shortSeasonName(seasonName)
  return isArchived ? `${season} (arkiv)` : season
}

export function pageTitle(squadName: string, seasonName: string, isArchived: boolean): string {
  if (isArchived) {
    return `${squadName} ${shortSeasonName(seasonName)} (arkiv)`
  }
  return `Terminliste - ${squadName}`
}
