import type { DataManifest, Match, Metadata, SeasonManifestEntry } from '../types/index.js'
import type { LeagueTable } from './LeagueTable.js'
import type { PlayerAggregatesData, PlayerStatsData } from '../types/player-stats.js'

export class SeasonDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SeasonDataError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasStringKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false
  return keys.every((key) => typeof value[key] === 'string')
}

export function isMatchArray(value: unknown): value is Match[] {
  if (!Array.isArray(value)) return false
  return value.every((entry) => hasStringKeys(entry, ['Kampnr', 'Hjemmelag', 'Bortelag']))
}

export function isLeagueTableArray(value: unknown): value is LeagueTable[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (entry) => hasStringKeys(entry, ['tournamentName']) && Array.isArray(entry.rows)
  )
}

export function isPlayerStatsData(value: unknown): value is PlayerStatsData {
  if (!isRecord(value)) return false
  if (!Array.isArray(value.matchStats)) return false
  if (!Array.isArray(value.players)) return false
  return Array.isArray(value.matchesWithoutStats)
}

export function isPlayerAggregatesData(value: unknown): value is PlayerAggregatesData {
  if (!isRecord(value)) return false
  return Array.isArray(value.aggregates)
}

export function isMetadata(value: unknown): value is Metadata {
  if (!isRecord(value)) return false
  if (typeof value.lastUpdated !== 'string') return false
  return typeof value.matchesCount === 'number' && typeof value.teamsCount === 'number'
}

export function isSeasonManifestEntry(value: unknown): value is SeasonManifestEntry {
  if (!hasStringKeys(value, ['squadId', 'squadName', 'seasonId', 'seasonName', 'slug'])) {
    return false
  }
  if (!Array.isArray(value.teams)) return false
  return value.status === 'aktiv' || value.status === 'arkivert'
}

export function isDataManifest(value: unknown): value is DataManifest {
  if (!isRecord(value)) return false
  if (typeof value.currentSeasonSlug !== 'string') return false
  if (!Array.isArray(value.seasons)) return false
  return value.seasons.every(isSeasonManifestEntry)
}

export function requireShape<T>(
  value: unknown,
  guard: (candidate: unknown) => candidate is T,
  description: string
): T {
  if (!guard(value)) {
    throw new SeasonDataError(`${description} har ugyldig innhold`)
  }
  return value
}
