import type {
  PlayerStatsData,
  PlayerAggregateStats,
  PlayerAggregatesData,
  MatchPlayerData,
  Player,
} from '../types/player-stats.js'

function compareDates(date1: string, date2: string): number {
  const [d1, m1, y1] = date1.split('.').map(Number)
  const [d2, m2, y2] = date2.split('.').map(Number)
  if (y1 !== y2) return y1 - y2
  if (m1 !== m2) return m1 - m2
  return d1 - d2
}

function extractPlayerStats(stats: {
  goals: number
  penaltyGoals: number
  twoMinutes: number
  yellowCards: number
  redCards: number
}) {
  return {
    goals: stats.goals,
    penaltyGoals: stats.penaltyGoals,
    twoMinutes: stats.twoMinutes,
    yellowCards: stats.yellowCards,
    redCards: stats.redCards,
  }
}

const UNKNOWN_TOURNAMENT = 'Ukjent'

export class PlayerStatsService {
  private data: PlayerStatsData

  constructor(data: PlayerStatsData) {
    this.data = data
  }

  getTeamIds(): string[] {
    const teamIds = new Set<string>()
    for (const match of this.data.matchStats) {
      teamIds.add(match.homeTeamId)
      teamIds.add(match.awayTeamId)
    }
    return Array.from(teamIds)
  }

  getTournaments(): string[] {
    const tournaments = new Set<string>()
    for (const match of this.data.matchStats) {
      if (match.tournament) {
        tournaments.add(match.tournament)
      }
    }
    return Array.from(tournaments).sort()
  }

  getPlayer(playerId: string): Player | undefined {
    return this.data.players.find((p) => p.id === playerId)
  }

  getPlayerMatches(playerId: string): Array<{
    match: MatchPlayerData
    stats: {
      goals: number
      penaltyGoals: number
      twoMinutes: number
      yellowCards: number
      redCards: number
    }
    isHome: boolean
  }> {
    const results: ReturnType<typeof this.getPlayerMatches> = []

    for (const match of this.data.matchStats) {
      const homePlayerStats = match.homeTeamStats.find((s) => s.playerId === playerId)
      if (homePlayerStats) {
        results.push({
          match,
          stats: extractPlayerStats(homePlayerStats),
          isHome: true,
        })
        continue
      }

      const awayPlayerStats = match.awayTeamStats.find((s) => s.playerId === playerId)
      if (awayPlayerStats) {
        results.push({
          match,
          stats: extractPlayerStats(awayPlayerStats),
          isHome: false,
        })
      }
    }

    return this.sortByDateDescending(results)
  }

  private sortByDateDescending<T extends { match: { matchDate: string } }>(results: T[]): T[] {
    return results.sort((a, b) => {
      const dateA = this.parseDate(a.match.matchDate)
      const dateB = this.parseDate(b.match.matchDate)
      return dateB.getTime() - dateA.getTime()
    })
  }

  generateAggregates(): PlayerAggregatesData {
    const playerStatsMap = new Map<
      string,
      {
        name: string
        jerseyNumber?: number
        lastJerseyDate?: string
        teamMatchCounts: Map<string, { teamName: string; matches: number; lastMatchDate: string }>
        totalGoals: number
        totalPenaltyGoals: number
        totalTwoMinutes: number
        totalYellowCards: number
        totalRedCards: number
        matchesPlayed: number
        byTournament: Map<
          string,
          {
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
            matches: number
          }
        >
      }
    >()

    for (const match of this.data.matchStats) {
      this.processTeamStats(
        playerStatsMap,
        match,
        match.homeTeamStats,
        match.homeTeamId,
        match.homeTeamName
      )
      this.processTeamStats(
        playerStatsMap,
        match,
        match.awayTeamStats,
        match.awayTeamId,
        match.awayTeamName
      )
    }

    const aggregates = this.convertToAggregateArray(playerStatsMap)
    this.sortByGoalsDescending(aggregates)

    return {
      aggregates,
      generatedAt: new Date().toISOString(),
    }
  }

  private processTeamStats(
    playerStatsMap: Map<
      string,
      {
        name: string
        jerseyNumber?: number
        lastJerseyDate?: string
        teamMatchCounts: Map<string, { teamName: string; matches: number; lastMatchDate: string }>
        totalGoals: number
        totalPenaltyGoals: number
        totalTwoMinutes: number
        totalYellowCards: number
        totalRedCards: number
        matchesPlayed: number
        byTournament: Map<
          string,
          {
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
            matches: number
          }
        >
      }
    >,
    match: MatchPlayerData,
    stats: MatchPlayerData['homeTeamStats'],
    teamId: string,
    teamName: string
  ) {
    for (const playerStat of stats) {
      let aggregate = playerStatsMap.get(playerStat.playerId)

      if (!aggregate) {
        aggregate = {
          name: playerStat.playerName,
          jerseyNumber: playerStat.jerseyNumber,
          lastJerseyDate: match.matchDate,
          teamMatchCounts: new Map(),
          totalGoals: 0,
          totalPenaltyGoals: 0,
          totalTwoMinutes: 0,
          totalYellowCards: 0,
          totalRedCards: 0,
          matchesPlayed: 0,
          byTournament: new Map(),
        }
        playerStatsMap.set(playerStat.playerId, aggregate)
      }

      this.updateTeamMatchCount(aggregate, teamId, teamName, match.matchDate)
      this.updatePlayerTotals(aggregate, playerStat)
      this.updateJerseyNumberIfNewer(aggregate, playerStat, match.matchDate)
      this.updateTournamentStats(aggregate, match.tournament, playerStat)
    }
  }

  private updateTeamMatchCount(
    aggregate: {
      teamMatchCounts: Map<string, { teamName: string; matches: number; lastMatchDate: string }>
    },
    teamId: string,
    teamName: string,
    matchDate: string
  ) {
    const teamCount = aggregate.teamMatchCounts.get(teamId)
    if (teamCount) {
      teamCount.matches++
      if (compareDates(matchDate, teamCount.lastMatchDate) > 0) {
        teamCount.lastMatchDate = matchDate
      }
    } else {
      aggregate.teamMatchCounts.set(teamId, { teamName, matches: 1, lastMatchDate: matchDate })
    }
  }

  private updatePlayerTotals(
    aggregate: {
      totalGoals: number
      totalPenaltyGoals: number
      totalTwoMinutes: number
      totalYellowCards: number
      totalRedCards: number
      matchesPlayed: number
    },
    playerStat: {
      goals: number
      penaltyGoals: number
      twoMinutes: number
      yellowCards: number
      redCards: number
    }
  ) {
    aggregate.totalGoals += playerStat.goals
    aggregate.totalPenaltyGoals += playerStat.penaltyGoals
    aggregate.totalTwoMinutes += playerStat.twoMinutes
    aggregate.totalYellowCards += playerStat.yellowCards
    aggregate.totalRedCards += playerStat.redCards
    aggregate.matchesPlayed++
  }

  private updateJerseyNumberIfNewer(
    aggregate: { jerseyNumber?: number; lastJerseyDate?: string },
    playerStat: { jerseyNumber?: number },
    matchDate: string
  ) {
    if (playerStat.jerseyNumber === undefined || !matchDate) return

    const isNewerMatch =
      !aggregate.lastJerseyDate || compareDates(matchDate, aggregate.lastJerseyDate) > 0
    if (isNewerMatch) {
      aggregate.jerseyNumber = playerStat.jerseyNumber
      aggregate.lastJerseyDate = matchDate
    }
  }

  private updateTournamentStats(
    aggregate: {
      byTournament: Map<
        string,
        {
          goals: number
          penaltyGoals: number
          twoMinutes: number
          yellowCards: number
          redCards: number
          matches: number
        }
      >
    },
    tournament: string | undefined,
    playerStat: {
      goals: number
      penaltyGoals: number
      twoMinutes: number
      yellowCards: number
      redCards: number
    }
  ) {
    const tournamentName = tournament === undefined ? UNKNOWN_TOURNAMENT : tournament
    let tournamentStats = aggregate.byTournament.get(tournamentName)
    if (!tournamentStats) {
      tournamentStats = {
        goals: 0,
        penaltyGoals: 0,
        twoMinutes: 0,
        yellowCards: 0,
        redCards: 0,
        matches: 0,
      }
      aggregate.byTournament.set(tournamentName, tournamentStats)
    }
    tournamentStats.goals += playerStat.goals
    tournamentStats.penaltyGoals += playerStat.penaltyGoals
    tournamentStats.twoMinutes += playerStat.twoMinutes
    tournamentStats.yellowCards += playerStat.yellowCards
    tournamentStats.redCards += playerStat.redCards
    tournamentStats.matches++
  }

  private convertToAggregateArray(
    playerStatsMap: Map<
      string,
      {
        name: string
        jerseyNumber?: number
        teamMatchCounts: Map<string, { teamName: string; matches: number; lastMatchDate: string }>
        totalGoals: number
        totalPenaltyGoals: number
        totalTwoMinutes: number
        totalYellowCards: number
        totalRedCards: number
        matchesPlayed: number
        byTournament: Map<
          string,
          {
            goals: number
            penaltyGoals: number
            twoMinutes: number
            yellowCards: number
            redCards: number
            matches: number
          }
        >
      }
    >
  ): PlayerAggregateStats[] {
    return Array.from(playerStatsMap.entries()).map(([playerId, p]) => {
      const { primaryTeamId, primaryTeamName, teamIds, teamNames } = this.findPrimaryTeam(
        p.teamMatchCounts
      )

      return {
        playerId,
        playerName: p.name,
        teamId: primaryTeamId,
        teamName: primaryTeamName,
        teamIds,
        teamNames,
        jerseyNumber: p.jerseyNumber,
        totalGoals: p.totalGoals,
        totalPenaltyGoals: p.totalPenaltyGoals,
        totalTwoMinutes: p.totalTwoMinutes,
        totalYellowCards: p.totalYellowCards,
        totalRedCards: p.totalRedCards,
        matchesPlayed: p.matchesPlayed,
        goalsPerMatch:
          p.matchesPlayed > 0 ? Math.round((p.totalGoals / p.matchesPlayed) * 100) / 100 : 0,
        byTournament: Array.from(p.byTournament.entries()).map(([tournament, stats]) => ({
          tournament,
          ...stats,
        })),
      }
    })
  }

  private findPrimaryTeam(
    teamMatchCounts: Map<string, { teamName: string; matches: number; lastMatchDate: string }>
  ) {
    if (teamMatchCounts.size === 0) {
      throw new Error('Player has no team match counts - data integrity error')
    }

    const teamIds: string[] = []
    const teamNames: string[] = []
    let primaryTeam = { id: '', name: '', matches: 0 }

    for (const [teamId, data] of teamMatchCounts) {
      teamIds.push(teamId)
      teamNames.push(data.teamName)
      if (data.matches > primaryTeam.matches) {
        primaryTeam = { id: teamId, name: data.teamName, matches: data.matches }
      }
    }

    return {
      primaryTeamId: primaryTeam.id,
      primaryTeamName: primaryTeam.name,
      teamIds,
      teamNames,
    }
  }

  private sortByGoalsDescending(aggregates: PlayerAggregateStats[]) {
    aggregates.sort((a, b) => b.totalGoals - a.totalGoals)
  }

  filterByTeams(aggregates: PlayerAggregateStats[], teamIds: string[]): PlayerAggregateStats[] {
    const teamIdSet = new Set(teamIds)
    return aggregates.filter((a) => a.teamIds.some((id) => teamIdSet.has(id)))
  }

  filterByTournament(
    aggregates: PlayerAggregateStats[],
    tournament: string
  ): PlayerAggregateStats[] {
    return aggregates
      .filter((a) => a.byTournament.some((t) => t.tournament === tournament))
      .map((a) => {
        const tournamentStats = a.byTournament.find((t) => t.tournament === tournament)
        if (!tournamentStats) return a

        return {
          ...a,
          totalGoals: tournamentStats.goals,
          totalPenaltyGoals: tournamentStats.penaltyGoals,
          totalTwoMinutes: tournamentStats.twoMinutes,
          totalYellowCards: tournamentStats.yellowCards,
          totalRedCards: tournamentStats.redCards,
          matchesPlayed: tournamentStats.matches,
          goalsPerMatch:
            tournamentStats.matches > 0
              ? Math.round((tournamentStats.goals / tournamentStats.matches) * 100) / 100
              : 0,
        }
      })
  }

  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
}
