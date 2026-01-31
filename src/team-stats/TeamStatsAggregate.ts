import { MatchResult, type ResultType } from './MatchResult'
import type { PlayerStatsData } from '../types/player-stats'
import type { Config, TeamId, TeamName, PlayerId, TournamentName } from '../types'
import { NorwegianDate } from '../player-match-records/NorwegianDate'

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
  'H-B'?: string
}

interface ParsedScore {
  homeScore: number
  awayScore: number
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

export class TeamStatsAggregate {
  static parseResultString(hb: string | undefined): ParsedScore | null {
    if (!hb) return null
    const match = hb.match(/^(\d+)-(\d+)$/)
    if (!match) return null
    return {
      homeScore: parseInt(match[1]),
      awayScore: parseInt(match[2]),
    }
  }

  static resolveMatchScores(
    match: { homeScore: number; awayScore: number; matchId: string },
    terminlisteData: TerminlisteMatch[]
  ): { homeScore: number; awayScore: number } {
    const terminlisteMatch = terminlisteData.find((t) => t.Kampnr.trim() === match.matchId.trim())
    if (terminlisteMatch) {
      const parsed = TeamStatsAggregate.parseResultString(terminlisteMatch['H-B'])
      if (parsed) {
        return parsed
      }
    }
    return { homeScore: match.homeScore, awayScore: match.awayScore }
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

      const resolvedScores = TeamStatsAggregate.resolveMatchScores(match, terminlisteData)
      const goalsScored = isHome ? resolvedScores.homeScore : resolvedScores.awayScore
      const goalsConceded = isHome ? resolvedScores.awayScore : resolvedScores.homeScore
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

  static extractLagIdFromUrl(url: string | undefined): TeamId | undefined {
    if (!url) return undefined
    const match = url.match(/lagid=(\d+)/)
    return match ? match[1] : undefined
  }

  static buildTeamNameToIdMap(
    statsData: PlayerStatsData,
    terminlisteMatches?: Array<{
      Hjemmelag?: string
      Bortelag?: string
      'Hjemmelag URL'?: string
      'Bortelag URL'?: string
    }>
  ): Map<TeamName, TeamId> {
    const map = new Map<TeamName, TeamId>()

    for (const match of statsData.matchStats) {
      if (!map.has(match.homeTeamName)) {
        map.set(match.homeTeamName, match.homeTeamId)
      }
      if (!map.has(match.awayTeamName)) {
        map.set(match.awayTeamName, match.awayTeamId)
      }
    }

    if (terminlisteMatches) {
      for (const match of terminlisteMatches) {
        if (match.Hjemmelag && !map.has(match.Hjemmelag)) {
          const lagId = TeamStatsAggregate.extractLagIdFromUrl(match['Hjemmelag URL'])
          if (lagId) {
            map.set(match.Hjemmelag, lagId)
          }
        }
        if (match.Bortelag && !map.has(match.Bortelag)) {
          const lagId = TeamStatsAggregate.extractLagIdFromUrl(match['Bortelag URL'])
          if (lagId) {
            map.set(match.Bortelag, lagId)
          }
        }
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
