import {
  optionalBoolean,
  requireArray,
  requireNumber,
  requireRecord,
  requireString,
} from './HandballPayloadReader.js'
import { readPageTitle, readVueProp } from './VueComponentProps.js'

export interface TableRow {
  position: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  points: number
  withdrawn: boolean
}

export interface LeagueTable {
  tournamentName: string
  tournamentUrl: string
  rows: TableRow[]
  updatedAt: string
}

export function parseTournamentName(html: string): string {
  const title = readPageTitle(html)
  const withoutSite = title.split('|')[0].trim()
  if (withoutSite.startsWith('Turnering,')) {
    return withoutSite.slice('Turnering,'.length).trim()
  }
  return withoutSite
}

export function parseLeagueTable(
  html: string,
  tournamentUrl: string,
  updatedAt: string
): LeagueTable | null {
  const data = requireRecord(readVueProp(html, 'table-main', ':data'), 'tabell')
  const teamResults = requireArray(data.teamResults, 'tabell.teamResults')
  if (teamResults.length === 0) return null

  const rows = teamResults.map((entry, index) =>
    parseTableRow(entry, index, `tabell.teamResults[${index}]`)
  )

  return {
    tournamentName: parseTournamentName(html),
    tournamentUrl,
    rows,
    updatedAt,
  }
}

function parseTableRow(entry: unknown, listIndex: number, context: string): TableRow {
  const record = requireRecord(entry, context)
  const withdrawn = optionalBoolean(record, 'isWithdrawn')
  const rankedPosition = requireNumber(record, 'position', context)
  const isUnranked = rankedPosition === 0

  return {
    position: isUnranked ? listIndex + 1 : rankedPosition,
    team: requireString(record, 'orgName', context).trim(),
    played: requireNumber(record, 'matches', context),
    won: requireNumber(record, 'victories', context),
    drawn: requireNumber(record, 'draws', context),
    lost: requireNumber(record, 'losses', context),
    goalsFor: requireNumber(record, 'goalsScored', context),
    goalsAgainst: requireNumber(record, 'goalsConceeded', context),
    points: requireNumber(record, 'totalPoints', context),
    withdrawn: withdrawn === true,
  }
}
