import type { Match, Team } from '../types/index.js'
import { HandballEndpoints } from './HandballEndpoints.js'
import type { ScheduledMatch } from './TeamSchedule.js'
import type { TeamTournament } from './TeamTournaments.js'

const endpoints = new HandballEndpoints()

export function toMatch(
  scheduled: ScheduledMatch,
  team: Team,
  tournamentUrl: string | undefined
): Match {
  const match: Match = {
    Lag: team.name,
    Dato: scheduled.date,
    Tid: scheduled.time,
    Kampnr: scheduled.matchNo,
    Hjemmelag: scheduled.homeTeamName,
    Bortelag: scheduled.awayTeamName,
    'H-B': scheduled.result,
    Bane: scheduled.venue,
    Arrangør: scheduled.organizer,
    Turnering: scheduled.tournamentName,
    'Kamp URL': endpoints.matchPage(scheduled.matchId),
    'Hjemmelag URL': endpoints.teamPage(scheduled.homeTeamId),
    'Bortelag URL': endpoints.teamPage(scheduled.awayTeamId),
    'Turnering URL': tournamentUrl,
  }

  if (scheduled.spectators !== null) {
    match.Tilskuere = scheduled.spectators
  }
  return match
}

export function buildTournamentUrlLookup(tournaments: TeamTournament[]): Map<string, string> {
  const byName = new Map<string, string>()
  for (const tournament of tournaments) {
    if (!byName.has(tournament.name)) byName.set(tournament.name, tournament.url)
  }
  return byName
}

export function toMatches(
  scheduled: ScheduledMatch[],
  team: Team,
  tournamentUrls: Map<string, string>
): Match[] {
  return scheduled.map((match) => toMatch(match, team, tournamentUrls.get(match.tournamentName)))
}
