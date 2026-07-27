import manifestData from '../../data/index.json'
import configData from '../../config.json'
import type { Config, DataManifest, Match, Metadata, Squad, Team } from '../types'
import type { PlayerStatsData, PlayerAggregatesData } from '../types/player-stats'
import type { LeagueTable } from '../components/LeagueTableCard'
import {
  isDataManifest,
  isLeagueTableArray,
  isMatchArray,
  isMetadata,
  isPlayerAggregatesData,
  isPlayerStatsData,
  requireShape,
} from '../handball/SeasonDataFiles'

export interface SeasonData {
  squad: Squad
  teams: Team[]
  seasonSlug: string
  seasonName: string
  isArchived: boolean
  matches: Match[]
  tables: LeagueTable[]
  playerStats: PlayerStatsData
  aggregates: PlayerAggregatesData
  metadata: Metadata
}

export interface SeasonChoice {
  slug: string
  name: string
  isArchived: boolean
  teams: Team[]
}

const config: Config = configData
const manifest: DataManifest = requireShape(manifestData, isDataManifest, 'data/index.json')

const seasonFiles = import.meta.glob<{ default: unknown }>('../../data/*/*/*.json')

export const squads: Squad[] = config.squads
export const defaultSquadId: string = config.squads[0].id
export const currentSeasonSlug: string = manifest.currentSeasonSlug

export function isKnownSquad(squadId: string): boolean {
  return config.squads.some((squad) => squad.id === squadId)
}

export function seasonsForSquad(squadId: string): SeasonChoice[] {
  return manifest.seasons
    .filter((season) => season.squadId === squadId)
    .map((season) => ({
      slug: season.slug,
      name: season.seasonName,
      isArchived: season.status === 'arkivert',
      teams: season.teams,
    }))
}

function findSquad(squadId: string): Squad {
  const squad = config.squads.find((candidate) => candidate.id === squadId)
  if (squad === undefined) throw new Error(`Ukjent kull: ${squadId}`)
  return squad
}

function findSeason(squadId: string, slug: string): SeasonChoice {
  const season = seasonsForSquad(squadId).find((candidate) => candidate.slug === slug)
  if (season === undefined) throw new Error(`Ukjent sesong for ${squadId}: ${slug}`)
  return season
}

async function readFile(squadId: string, slug: string, fileName: string): Promise<unknown> {
  const loadFile = seasonFiles[`../../data/${squadId}/${slug}/${fileName}`]
  if (loadFile === undefined) {
    throw new Error(`Fant ikke data/${squadId}/${slug}/${fileName}`)
  }
  const loaded = await loadFile()
  return loaded.default
}

export async function loadSeasonData(squadId: string, slug: string): Promise<SeasonData> {
  const squad = findSquad(squadId)
  const season = findSeason(squadId, slug)
  const where = (fileName: string): string => `${squadId}/${slug}/${fileName}`

  const [matches, tables, playerStats, aggregates, metadata] = await Promise.all([
    readFile(squadId, slug, 'terminliste.json'),
    readFile(squadId, slug, 'tables.json'),
    readFile(squadId, slug, 'player-stats.json'),
    readFile(squadId, slug, 'player-aggregates.json'),
    readFile(squadId, slug, 'metadata.json'),
  ])

  return {
    squad,
    teams: season.teams,
    seasonSlug: slug,
    seasonName: season.name,
    isArchived: season.isArchived,
    matches: requireShape(matches, isMatchArray, where('terminliste.json')),
    tables: requireShape(tables, isLeagueTableArray, where('tables.json')),
    playerStats: requireShape(playerStats, isPlayerStatsData, where('player-stats.json')),
    aggregates: requireShape(aggregates, isPlayerAggregatesData, where('player-aggregates.json')),
    metadata: requireShape(metadata, isMetadata, where('metadata.json')),
  }
}
