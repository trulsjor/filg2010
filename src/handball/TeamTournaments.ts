import {
  optionalBoolean,
  requireArray,
  requireNumber,
  requireRecord,
  requireString,
} from './HandballPayloadReader.js'

export interface TeamTournament {
  tournamentId: string
  name: string
  seasonId: string
  seasonName: string
  url: string
  hasPublicTable: boolean
}

export function parseTeamTournaments(payload: unknown): TeamTournament[] {
  const entries = requireArray(payload, 'turneringer')
  return entries.map((entry, index) => parseTournament(entry, `turneringer[${index}]`))
}

export function selectSeason(tournaments: TeamTournament[], seasonId: string): TeamTournament[] {
  return tournaments.filter((tournament) => tournament.seasonId === seasonId)
}

function parseTournament(entry: unknown, context: string): TeamTournament {
  const record = requireRecord(entry, context)
  const tournament = requireRecord(record.tournament, `${context}.tournament`)

  return {
    tournamentId: String(requireNumber(tournament, 'id', `${context}.tournament`)),
    name: requireString(tournament, 'name', `${context}.tournament`).trim(),
    seasonId: String(requireNumber(tournament, 'seasonId', `${context}.tournament`)),
    seasonName: requireString(tournament, 'seasonName', `${context}.tournament`).trim(),
    url: requireString(record, 'tournamentLink', context),
    hasPublicTable: optionalBoolean(tournament, 'publicTable') === true,
  }
}
