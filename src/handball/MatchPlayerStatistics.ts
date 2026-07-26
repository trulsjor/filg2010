import {
  optionalBoolean,
  optionalNumber,
  optionalString,
  requireArray,
  requireNumber,
  requireRecord,
} from './HandballPayloadReader.js'
import { readVueProp, readVueStringProp } from './VueComponentProps.js'

export interface PlayerMatchStats {
  playerId: string
  playerName: string
  jerseyNumber?: number
  goals: number
  penaltyGoals: number
  twoMinutes: number
  yellowCards: number
  redCards: number
  hasPlayed: boolean
  teamId: string
}

export interface MatchRosters {
  homeTeamName: string
  awayTeamName: string
  homeTeamId: string
  awayTeamId: string
  homeTeamStats: PlayerMatchStats[]
  awayTeamStats: PlayerMatchStats[]
}

export function parseMatchRosters(html: string): MatchRosters {
  return {
    homeTeamName: readVueStringProp(html, 'match-info', ':home-header'),
    awayTeamName: readVueStringProp(html, 'match-info', ':away-header'),
    homeTeamId: readTeamIdFromUrl(readVueStringProp(html, 'match-info', ':home-url')),
    awayTeamId: readTeamIdFromUrl(readVueStringProp(html, 'match-info', ':away-url')),
    homeTeamStats: parsePlayers(readVueProp(html, 'match-info', ':home-players'), 'hjemmespillere'),
    awayTeamStats: parsePlayers(readVueProp(html, 'match-info', ':away-players'), 'bortespillere'),
  }
}

export function readTeamIdFromUrl(url: string): string {
  const match = url.match(/lagid=(\d+)/)
  return match === null ? '' : match[1]
}

function parsePlayers(payload: unknown, context: string): PlayerMatchStats[] {
  return requireArray(payload, context).map((entry, index) =>
    parsePlayer(entry, `${context}[${index}]`)
  )
}

function parsePlayer(entry: unknown, context: string): PlayerMatchStats {
  const record = requireRecord(entry, context)
  const jerseyNumber = optionalNumber(record, 'shirtNo')

  const stats: PlayerMatchStats = {
    playerId: String(requireNumber(record, 'personId', context)),
    playerName: readFullName(record, context),
    goals: readCount(record, 'spillerMaal'),
    penaltyGoals: readCount(record, 'sjuMeterMaal'),
    twoMinutes: readCount(record, 'toMinutter'),
    yellowCards: readCount(record, 'advarsel'),
    redCards: readCount(record, 'diskvalifikasjon'),
    hasPlayed: optionalBoolean(record, 'hasPlayed') === true,
    teamId: String(requireNumber(record, 'teamOrgId', context)),
  }

  if (jerseyNumber !== null) {
    stats.jerseyNumber = jerseyNumber
  }
  return stats
}

function readFullName(record: Record<string, unknown>, context: string): string {
  const fullName = optionalString(record, 'fullName')
  if (fullName !== null && fullName.trim().length > 0) return fullName.trim()

  const firstName = optionalString(record, 'firstName')
  const lastName = optionalString(record, 'lastName')
  const combined = [firstName, lastName]
    .filter((part) => part !== null)
    .join(' ')
    .trim()
  if (combined.length === 0) {
    throw new HandballRosterError(`${context}: spiller mangler navn`)
  }
  return combined
}

function readCount(record: Record<string, unknown>, key: string): number {
  const value = optionalNumber(record, key)
  return value === null ? 0 : value
}

export class HandballRosterError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HandballRosterError'
  }
}
