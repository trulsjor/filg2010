import { MatchResult, type ResultType } from './MatchResult'
import type { PlayerStatsData } from '../types/player-stats'
import type { Config, TeamId, TeamName, PlayerId, TournamentName } from '../types'
import { NorwegianDate } from '../player-stats/NorwegianDate'

export interface TeamMatchData {
  matchId: string
  matchDate: string
  matchUrl: string | undefined
  opponent: TeamName
  opponentId: TeamId
  isHome: boolean
  goalsScored: number
  goalsConceded: number
  result: MatchResult
  resultType: ResultType
  tournament: TournamentName
}

export interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
}

export interface TeamDetailStats {
  matchCount: number
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  goalDiff: number
  goalsPerMatch: number
}

export interface TeamDetailData {
  teamId: TeamId
  teamName: TeamName
  isOurTeam: boolean
  matches: TeamMatchData[]
  players: TeamPlayerData[]
  stats: TeamDetailStats
}

export interface TeamPlayerData {
  playerId: PlayerId
  playerName: string
  jerseyNumber: number | undefined
  goals: number
  penaltyGoals: number
  twoMinutes: number
  matches: number
}

export interface TeamSummary {
  teamId: TeamId
  teamName: TeamName
  matches: number
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  goalDiff: number
  isOurTeam: boolean
  tournaments: TournamentName[]
}

export interface TournamentTeamSummary extends TeamSummary {
  tournament: TournamentName
}

export class TeamStatsAggregate {
  static buildTeamSummaries(statsData: PlayerStatsData, ourTeamIds: Set<TeamId>): TeamSummary[] {
    const teams = new Map<TeamId, TeamSummary>()

    const getOrCreateTeam = (teamId: TeamId, teamName: TeamName): TeamSummary => {
      const existing = teams.get(teamId)
      if (existing) return existing

      const newTeam: TeamSummary = {
        teamId,
        teamName,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        goalDiff: 0,
        isOurTeam: ourTeamIds.has(teamId),
        tournaments: [],
      }
      teams.set(teamId, newTeam)
      return newTeam
    }

    for (const match of statsData.matchStats) {
      const homeResult = new MatchResult(match.homeScore, match.awayScore)

      const home = getOrCreateTeam(match.homeTeamId, match.homeTeamName)
      const away = getOrCreateTeam(match.awayTeamId, match.awayTeamName)

      home.matches += 1
      home.goalsScored += match.homeScore
      home.goalsConceded += match.awayScore
      away.matches += 1
      away.goalsScored += match.awayScore
      away.goalsConceded += match.homeScore

      if (homeResult.isWin()) {
        home.wins += 1
        away.losses += 1
      } else if (homeResult.isDraw()) {
        home.draws += 1
        away.draws += 1
      } else {
        home.losses += 1
        away.wins += 1
      }

      if (!home.tournaments.includes(match.tournament)) {
        home.tournaments.push(match.tournament)
      }
      if (!away.tournaments.includes(match.tournament)) {
        away.tournaments.push(match.tournament)
      }
    }

    for (const team of teams.values()) {
      team.goalDiff = team.goalsScored - team.goalsConceded
    }

    return Array.from(teams.values())
  }

  static buildTournamentTeamSummaries(
    statsData: PlayerStatsData,
    ourTeamIds: Set<TeamId>
  ): Map<TournamentName, TournamentTeamSummary[]> {
    const tournamentTeams = new Map<TournamentName, Map<TeamId, TournamentTeamSummary>>()

    const getOrCreateTeam = (
      tournament: TournamentName,
      teamId: TeamId,
      teamName: TeamName
    ): TournamentTeamSummary => {
      let teamsInTournament = tournamentTeams.get(tournament)
      if (!teamsInTournament) {
        teamsInTournament = new Map()
        tournamentTeams.set(tournament, teamsInTournament)
      }

      const existing = teamsInTournament.get(teamId)
      if (existing) return existing

      const newTeam: TournamentTeamSummary = {
        teamId,
        teamName,
        tournament,
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsScored: 0,
        goalsConceded: 0,
        goalDiff: 0,
        isOurTeam: ourTeamIds.has(teamId),
        tournaments: [tournament],
      }
      teamsInTournament.set(teamId, newTeam)
      return newTeam
    }

    for (const match of statsData.matchStats) {
      const homeResult = new MatchResult(match.homeScore, match.awayScore)

      const home = getOrCreateTeam(match.tournament, match.homeTeamId, match.homeTeamName)
      const away = getOrCreateTeam(match.tournament, match.awayTeamId, match.awayTeamName)

      home.matches += 1
      home.goalsScored += match.homeScore
      home.goalsConceded += match.awayScore
      away.matches += 1
      away.goalsScored += match.awayScore
      away.goalsConceded += match.homeScore

      if (homeResult.isWin()) {
        home.wins += 1
        away.losses += 1
      } else if (homeResult.isDraw()) {
        home.draws += 1
        away.draws += 1
      } else {
        home.losses += 1
        away.wins += 1
      }
    }

    for (const teamsInTournament of tournamentTeams.values()) {
      for (const team of teamsInTournament.values()) {
        team.goalDiff = team.goalsScored - team.goalsConceded
      }
    }

    const result = new Map<TournamentName, TournamentTeamSummary[]>()
    for (const [tournament, teamsMap] of tournamentTeams) {
      const teams = Array.from(teamsMap.values()).sort(TeamStatsAggregate.compareByPriority)
      result.set(tournament, teams)
    }

    return result
  }

  static compareByPriority(a: TeamSummary, b: TeamSummary): number {
    if (a.isOurTeam !== b.isOurTeam) return a.isOurTeam ? -1 : 1
    return b.matches - a.matches
  }

  static sortByPriority(teams: TeamSummary[]): TeamSummary[] {
    return [...teams].sort(TeamStatsAggregate.compareByPriority)
  }

  static createOurTeamIds(config: Config): Set<TeamId> {
    return new Set(config.teams.map((t) => t.lagid))
  }

  static sortMatchesByDateDescending<T extends { matchDate: string }>(matches: T[]): T[] {
    return [...matches].sort((a, b) => {
      const dateA = NorwegianDate.fromString(a.matchDate)
      const dateB = NorwegianDate.fromString(b.matchDate)
      return dateB.getTime() - dateA.getTime()
    })
  }

  static sortPlayersByGoalsDescending<T extends { goals: number }>(players: T[]): T[] {
    return [...players].sort((a, b) => b.goals - a.goals)
  }

  static resolveMatchUrl(
    primaryUrl: string | undefined,
    matchId: string,
    terminlisteData: TerminlisteMatch[]
  ): string | undefined {
    if (primaryUrl !== undefined) {
      return primaryUrl
    }
    const terminlisteMatch = terminlisteData.find((t) => t.Kampnr === matchId)
    if (terminlisteMatch !== undefined) {
      return terminlisteMatch['Kamp URL']
    }
    return undefined
  }

  static findTeamTournaments(teamId: TeamId, statsData: PlayerStatsData): TournamentName[] {
    const tournaments = new Set<TournamentName>()
    for (const match of statsData.matchStats) {
      if (match.homeTeamId === teamId || match.awayTeamId === teamId) {
        tournaments.add(match.tournament)
      }
    }
    return Array.from(tournaments).sort((a, b) => a.localeCompare(b, 'nb'))
  }

  static buildTeamDetailData(
    teamId: TeamId,
    statsData: PlayerStatsData,
    terminlisteData: TerminlisteMatch[],
    ourTeamIds: Set<TeamId>,
    tournamentFilter: TournamentName | null
  ): TeamDetailData | null {
    let teamName: TeamName = ''
    const matches: TeamMatchData[] = []
    const playerStats = new Map<PlayerId, TeamPlayerData>()

    const getOrCreatePlayer = (
      playerId: PlayerId,
      playerName: string,
      jerseyNumber: number | undefined
    ): TeamPlayerData => {
      const existing = playerStats.get(playerId)
      if (existing) return existing

      const newPlayer: TeamPlayerData = {
        playerId,
        playerName,
        jerseyNumber,
        goals: 0,
        penaltyGoals: 0,
        twoMinutes: 0,
        matches: 0,
      }
      playerStats.set(playerId, newPlayer)
      return newPlayer
    }

    for (const match of statsData.matchStats) {
      const isHome = match.homeTeamId === teamId
      const isAway = match.awayTeamId === teamId

      if (!isHome && !isAway) continue
      if (tournamentFilter && match.tournament !== tournamentFilter) continue

      teamName = isHome ? match.homeTeamName : match.awayTeamName

      const goalsScored = isHome ? match.homeScore : match.awayScore
      const goalsConceded = isHome ? match.awayScore : match.homeScore
      const opponent = isHome ? match.awayTeamName : match.homeTeamName
      const opponentId = isHome ? match.awayTeamId : match.homeTeamId

      const result = new MatchResult(goalsScored, goalsConceded)
      const matchUrl = TeamStatsAggregate.resolveMatchUrl(
        match.matchUrl,
        match.matchId,
        terminlisteData
      )

      matches.push({
        matchId: match.matchId,
        matchDate: match.matchDate,
        matchUrl,
        opponent,
        opponentId,
        isHome,
        goalsScored,
        goalsConceded,
        result,
        resultType: result.getType(),
        tournament: match.tournament,
      })

      const teamStats = isHome ? match.homeTeamStats : match.awayTeamStats
      for (const ps of teamStats) {
        const player = getOrCreatePlayer(ps.playerId, ps.playerName, ps.jerseyNumber)
        player.goals += ps.goals
        player.penaltyGoals += ps.penaltyGoals
        player.twoMinutes += ps.twoMinutes
        player.matches += 1
      }
    }

    if (matches.length === 0) return null

    const sortedMatches = TeamStatsAggregate.sortMatchesByDateDescending(matches)
    const sortedPlayers = TeamStatsAggregate.sortPlayersByGoalsDescending(
      Array.from(playerStats.values())
    )

    const wins = matches.filter((m) => m.result.isWin()).length
    const draws = matches.filter((m) => m.result.isDraw()).length
    const losses = matches.filter((m) => m.result.isLoss()).length
    const goalsScored = matches.reduce((sum, m) => sum + m.goalsScored, 0)
    const goalsConceded = matches.reduce((sum, m) => sum + m.goalsConceded, 0)

    return {
      teamId,
      teamName,
      isOurTeam: ourTeamIds.has(teamId),
      matches: sortedMatches,
      players: sortedPlayers,
      stats: {
        matchCount: matches.length,
        wins,
        draws,
        losses,
        goalsScored,
        goalsConceded,
        goalDiff: goalsScored - goalsConceded,
        goalsPerMatch: goalsScored / matches.length,
      },
    }
  }

  static buildTeamNameToIdMap(statsData: PlayerStatsData): Map<TeamName, TeamId> {
    const map = new Map<TeamName, TeamId>()
    for (const match of statsData.matchStats) {
      if (!map.has(match.homeTeamName)) {
        map.set(match.homeTeamName, match.homeTeamId)
      }
      if (!map.has(match.awayTeamName)) {
        map.set(match.awayTeamName, match.awayTeamId)
      }
    }
    return map
  }

  static normalizeTableTeamName(teamName: string): TeamName {
    return teamName
      .replace(/\s*\(D\)\s*$/, '')
      .replace(/\s*\(Trukket\)\s*$/, '')
      .trim()
  }

  static lookupTeamId(teamName: string, nameToIdMap: Map<TeamName, TeamId>): TeamId | undefined {
    const normalizedName = TeamStatsAggregate.normalizeTableTeamName(teamName)
    return nameToIdMap.get(normalizedName)
  }

  static extractTeamBaseName(teamName: string): string {
    return teamName.split(' ')[0].toLowerCase()
  }

  static extractTeamNumber(teamName: string): string | undefined {
    return teamName.match(/\d+$/)?.[0]
  }

  static tableContainsFirstTeam<T extends { team: string }>(rows: T[], baseName: string): boolean {
    return rows.some((row) => {
      const rowTeam = row.team.toLowerCase()
      const isExactMatch = rowTeam === baseName
      const isBaseNameWithoutNumber = rowTeam.startsWith(baseName + ' ') && !rowTeam.match(/\d/)
      return isExactMatch || isBaseNameWithoutNumber
    })
  }

  static tableContainsNumberedTeam<T extends { team: string }>(
    rows: T[],
    baseName: string,
    teamNumber: string
  ): boolean {
    return rows.some((row) => {
      const rowTeam = row.team.toLowerCase()
      return rowTeam.includes(baseName) && rowTeam.includes(teamNumber)
    })
  }

  static findConfigTeamInTable<TRow extends { team: string }, TTeam extends { name: string }>(
    rows: TRow[],
    teamsSortedBySpecificity: TTeam[]
  ): TTeam | undefined {
    return teamsSortedBySpecificity.find((team) => {
      const baseName = TeamStatsAggregate.extractTeamBaseName(team.name)
      const teamNumber = TeamStatsAggregate.extractTeamNumber(team.name)
      const isFirstTeam = teamNumber === '1' || teamNumber === undefined
      if (isFirstTeam) {
        return TeamStatsAggregate.tableContainsFirstTeam(rows, baseName)
      }
      return TeamStatsAggregate.tableContainsNumberedTeam(rows, baseName, teamNumber)
    })
  }

  static sortTeamsByNameLengthDescending<T extends { name: string }>(teams: T[]): T[] {
    return [...teams].sort((a, b) => b.name.length - a.name.length)
  }
}
