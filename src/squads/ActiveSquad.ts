import configData from '../../config.json'
import type { Config, Match, Metadata, Squad, Team } from '../types'
import type { PlayerStatsData, PlayerAggregatesData } from '../types/player-stats'
import type { LeagueTable } from '../components/LeagueTableCard'
import {
  isLeagueTableArray,
  isMatchArray,
  isMetadata,
  isPlayerAggregatesData,
  isPlayerStatsData,
  requireShape,
} from '../handball/SeasonDataFiles'

import g2010Matches from '../../data/g2010/2026-2027/terminliste.json'
import g2010Tables from '../../data/g2010/2026-2027/tables.json'
import g2010Stats from '../../data/g2010/2026-2027/player-stats.json'
import g2010Aggregates from '../../data/g2010/2026-2027/player-aggregates.json'
import g2010Metadata from '../../data/g2010/2026-2027/metadata.json'

import j2010Matches from '../../data/j2010/2026-2027/terminliste.json'
import j2010Tables from '../../data/j2010/2026-2027/tables.json'
import j2010Stats from '../../data/j2010/2026-2027/player-stats.json'
import j2010Aggregates from '../../data/j2010/2026-2027/player-aggregates.json'
import j2010Metadata from '../../data/j2010/2026-2027/metadata.json'

export interface SquadData {
  squad: Squad
  teams: Team[]
  matches: Match[]
  tables: LeagueTable[]
  playerStats: PlayerStatsData
  aggregates: PlayerAggregatesData
  metadata: Metadata
}

interface SeasonFiles {
  matches: unknown
  tables: unknown
  playerStats: unknown
  aggregates: unknown
  metadata: unknown
}

const config: Config = configData

const filesBySquadId: Record<string, SeasonFiles> = {
  g2010: {
    matches: g2010Matches,
    tables: g2010Tables,
    playerStats: g2010Stats,
    aggregates: g2010Aggregates,
    metadata: g2010Metadata,
  },
  j2010: {
    matches: j2010Matches,
    tables: j2010Tables,
    playerStats: j2010Stats,
    aggregates: j2010Aggregates,
    metadata: j2010Metadata,
  },
}

function readSeasonFiles(squad: Squad, files: SeasonFiles): SquadData {
  const where = (fileName: string): string => `${squad.id}/${fileName}`

  return {
    squad,
    teams: squad.teams,
    matches: requireShape(files.matches, isMatchArray, where('terminliste.json')),
    tables: requireShape(files.tables, isLeagueTableArray, where('tables.json')),
    playerStats: requireShape(files.playerStats, isPlayerStatsData, where('player-stats.json')),
    aggregates: requireShape(
      files.aggregates,
      isPlayerAggregatesData,
      where('player-aggregates.json')
    ),
    metadata: requireShape(files.metadata, isMetadata, where('metadata.json')),
  }
}

const dataBySquadId = new Map<string, SquadData>(
  config.squads.flatMap((squad) => {
    const files = filesBySquadId[squad.id]
    return files === undefined ? [] : [[squad.id, readSeasonFiles(squad, files)] as const]
  })
)

export const squads: Squad[] = config.squads

export const defaultSquadId = config.squads[0].id

export function squadData(squadId: string): SquadData {
  const data = dataBySquadId.get(squadId)
  if (data === undefined) {
    throw new Error(`Ukjent kull: ${squadId}`)
  }
  return data
}

export function activeSquadData(): SquadData {
  return squadData(defaultSquadId)
}
