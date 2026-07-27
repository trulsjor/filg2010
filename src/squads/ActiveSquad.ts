import configData from '../../config.json'
import type { Config, Match, Metadata, Squad, Team } from '../types'
import type { PlayerStatsData, PlayerAggregatesData } from '../types/player-stats'
import type { LeagueTable } from '../components/LeagueTableCard'

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

const config: Config = configData

const dataBySquadId: Record<string, Omit<SquadData, 'squad' | 'teams'>> = {
  g2010: {
    matches: g2010Matches as Match[],
    tables: g2010Tables as LeagueTable[],
    playerStats: g2010Stats as PlayerStatsData,
    aggregates: g2010Aggregates as PlayerAggregatesData,
    metadata: g2010Metadata as Metadata,
  },
  j2010: {
    matches: j2010Matches as Match[],
    tables: j2010Tables as LeagueTable[],
    playerStats: j2010Stats as PlayerStatsData,
    aggregates: j2010Aggregates as PlayerAggregatesData,
    metadata: j2010Metadata as Metadata,
  },
}

export const squads: Squad[] = config.squads

export function squadData(squadId: string): SquadData {
  const squad = config.squads.find((candidate) => candidate.id === squadId)
  const data = dataBySquadId[squadId]
  if (squad === undefined || data === undefined) {
    throw new Error(`Ukjent kull: ${squadId}`)
  }
  return { squad, teams: squad.teams, ...data }
}

export const defaultSquadId = config.squads[0].id

export function activeSquadData(): SquadData {
  return squadData(defaultSquadId)
}
