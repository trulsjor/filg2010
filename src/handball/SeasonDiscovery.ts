import { HandballEndpoints } from './HandballEndpoints.js'
import { HandballHttpClient } from './HandballHttpClient.js'
import { parseLeagueTable, type LeagueTable } from './LeagueTable.js'
import { parseTeamSchedule, type ScheduledMatch } from './TeamSchedule.js'
import { parseTeamTournaments, selectSeason, type TeamTournament } from './TeamTournaments.js'
import { parseTournamentTeams, type TournamentTeam } from './TournamentTeams.js'

export interface DiscoveryProgress {
  (step: string, detail: string): void
}

export interface SeasonDiscoveryResult {
  tournaments: TeamTournament[]
  tables: LeagueTable[]
  ownMatches: ScheduledMatch[]
  allMatches: ScheduledMatch[]
}

export class SeasonDiscovery {
  private readonly endpoints = new HandballEndpoints()

  constructor(
    private readonly http: HandballHttpClient,
    private readonly onProgress: DiscoveryProgress = () => {}
  ) {}

  async discoverSeason(ownTeamIds: string[], seasonId: string): Promise<SeasonDiscoveryResult> {
    const tournaments = await this.discoverTournaments(ownTeamIds, seasonId)
    this.onProgress('turneringer', `${tournaments.length} turneringer`)

    const ownMatches = await this.fetchSchedules(ownTeamIds, seasonId)
    this.onProgress('egne kamper', `${ownMatches.length} kamper`)

    const opponentIds = await this.discoverParticipants(tournaments, ownTeamIds)
    this.onProgress('lag', `${opponentIds.length} motstanderlag`)

    const opponentMatches = await this.fetchSchedules(opponentIds, seasonId)
    const allMatches = dedupeMatches([...ownMatches, ...opponentMatches])
    this.onProgress('alle kamper', `${allMatches.length} unike kamper`)

    const tables = await this.fetchTables(tournaments)
    this.onProgress('tabeller', `${tables.length} tabeller`)

    return { tournaments, tables, ownMatches, allMatches }
  }

  async discoverTournaments(teamIds: string[], seasonId: string): Promise<TeamTournament[]> {
    const found = new Map<string, TeamTournament>()
    for (const teamId of teamIds) {
      const payload = await this.http.fetchJson(this.endpoints.teamTournaments(teamId))
      for (const tournament of selectSeason(parseTeamTournaments(payload), seasonId)) {
        if (!found.has(tournament.tournamentId)) found.set(tournament.tournamentId, tournament)
      }
    }
    return Array.from(found.values())
  }

  async discoverParticipants(
    tournaments: TeamTournament[],
    excludeTeamIds: string[]
  ): Promise<string[]> {
    const excluded = new Set(excludeTeamIds)
    const found = new Map<string, TournamentTeam>()

    for (const tournament of tournaments) {
      const html = await this.http.fetchPage(tournament.url)
      for (const team of parseTournamentTeams(html)) {
        if (excluded.has(team.teamId) || found.has(team.teamId)) continue
        found.set(team.teamId, team)
      }
      this.onProgress('turnering', `${tournament.name}: ${found.size} lag totalt`)
    }

    return Array.from(found.keys())
  }

  private async fetchSchedules(teamIds: string[], seasonId: string): Promise<ScheduledMatch[]> {
    const matches: ScheduledMatch[] = []
    for (const teamId of teamIds) {
      const payload = await this.http.fetchJson(this.endpoints.teamSchedule(teamId, seasonId))
      matches.push(...parseTeamSchedule(payload))
    }
    return matches
  }

  private async fetchTables(tournaments: TeamTournament[]): Promise<LeagueTable[]> {
    const tables: LeagueTable[] = []
    for (const tournament of tournaments) {
      if (!tournament.hasPublicTable) continue
      const html = await this.http.fetchPage(tournament.url)
      const table = parseLeagueTable(html, tournament.url, new Date().toISOString())
      if (table !== null) tables.push(table)
    }
    return tables
  }
}

export function dedupeMatches(matches: ScheduledMatch[]): ScheduledMatch[] {
  const byId = new Map<string, ScheduledMatch>()
  for (const match of matches) {
    if (!byId.has(match.matchId)) byId.set(match.matchId, match)
  }
  return Array.from(byId.values())
}

export function selectPlayedMatches(matches: ScheduledMatch[]): ScheduledMatch[] {
  return matches.filter((match) => match.result.length > 0)
}
