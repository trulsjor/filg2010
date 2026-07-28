import {
  optionalNumber,
  optionalString,
  optionalBoolean,
  requireArray,
  requireNumber,
  requireRecord,
  requireString,
} from './HandballPayloadReader.js'

export interface ScheduledMatch {
  matchId: string
  matchNo: string
  tournamentId: string
  tournamentName: string
  homeTeamId: string
  homeTeamName: string
  awayTeamId: string
  awayTeamName: string
  date: string
  time: string
  result: string
  venue: string
  organizer: string
  spectators: number | null
  round: string
}

export function parseTeamSchedule(payload: unknown): ScheduledMatch[] {
  const root = requireRecord(payload, 'terminliste')
  const matches = requireArray(root.matches, 'terminliste.matches')
  return matches.map((entry, index) => parseScheduledMatch(entry, `terminliste.matches[${index}]`))
}

function parseScheduledMatch(entry: unknown, context: string): ScheduledMatch {
  const record = requireRecord(entry, context)

  return {
    matchId: String(requireNumber(record, 'matchId', context)),
    matchNo: requireString(record, 'matchNo', context).trim(),
    tournamentId: String(requireNumber(record, 'tournamentId', context)),
    tournamentName: requireString(record, 'tournamentName', context).trim(),
    homeTeamId: String(requireNumber(record, 'homeTeamId', context)),
    homeTeamName: requireString(record, 'homeTeamDisplayName', context),
    awayTeamId: String(requireNumber(record, 'awayTeamId', context)),
    awayTeamName: requireString(record, 'awayTeamDisplayName', context),
    date: formatMatchDate(optionalString(record, 'matchDate')),
    time: formatMatchTime(optionalNumber(record, 'matchStartTime')),
    result: formatResult(record),
    venue: readVenue(record),
    organizer: readOrganizer(record),
    spectators: optionalNumber(record, 'spectators'),
    round: readRound(record),
  }
}

export function formatMatchDate(isoDate: string | null): string {
  if (isoDate === null) return ''
  const datePart = isoDate.split('T')[0]
  const [year, month, day] = datePart.split('-')
  if (year === undefined || month === undefined || day === undefined) return ''
  if (year === '0001') return ''
  return `${day}.${month}.${year}`
}

export function formatMatchTime(startTime: number | null): string {
  if (startTime === null) return ''
  const padded = String(startTime).padStart(4, '0')
  return `${padded.slice(0, 2)}:${padded.slice(2)}`
}

function formatResult(record: Record<string, unknown>): string {
  const isPast = optionalBoolean(record, 'isPast')
  const publicResult = optionalBoolean(record, 'publicResult')
  if (isPast !== true || publicResult !== true) return ''

  const goalsHome = optionalNumber(record, 'goalsHome')
  const goalsAway = optionalNumber(record, 'goalsAway')
  if (goalsHome === null || goalsAway === null) return ''
  if (goalsHome === 0 && goalsAway === 0) return ''

  return `${goalsHome}-${goalsAway}`
}

function readVenue(record: Record<string, unknown>): string {
  const activityArea = optionalString(record, 'activityAreaName')
  if (activityArea !== null) return activityArea
  const venueUnit = optionalString(record, 'venueUnitName')
  return venueUnit === null ? '' : venueUnit
}

function readOrganizer(record: Record<string, unknown>): string {
  const organizer = optionalString(record, 'arrOrgName')
  return organizer === null ? '' : organizer
}

function readRound(record: Record<string, unknown>): string {
  const round = optionalString(record, 'roundName')
  return round === null ? '' : round
}
