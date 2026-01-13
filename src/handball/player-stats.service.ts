/**
 * Service for aggregating and querying player statistics
 */

import type {
  PlayerStatsData,
  PlayerAggregateStats,
  PlayerAggregatesData,
  MatchPlayerData,
  Player,
} from '../types/player-stats.js'

export class PlayerStatsService {
  private data: PlayerStatsData

  constructor(data: PlayerStatsData) {
    this.data = data
  }

  /**
   * Get all unique team IDs from the data
   */
  getTeamIds(): string[] {
    const teamIds = new Set<string>()
    for (const match of this.data.matchStats) {
      teamIds.add(match.homeTeamId)
      teamIds.add(match.awayTeamId)
    }
    return Array.from(teamIds)
  }

  /**
   * Get all unique tournaments from the data
   */
  getTournaments(): string[] {
    const tournaments = new Set<string>()
    for (const match of this.data.matchStats) {
      if (match.tournament) {
        tournaments.add(match.tournament)
      }
    }
    return Array.from(tournaments).sort()
  }

  /**
   * Get player by ID
   */
  getPlayer(playerId: string): Player | undefined {
    return this.data.players.find((p) => p.id === playerId)
  }

  /**
   * Get all matches for a specific player
   */
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
      // Check home team
      const homeStats = match.homeTeamStats.find((s) => s.playerId === playerId)
      if (homeStats) {
        results.push({
          match,
          stats: {
            goals: homeStats.goals,
            penaltyGoals: homeStats.penaltyGoals,
            twoMinutes: homeStats.twoMinutes,
            yellowCards: homeStats.yellowCards,
            redCards: homeStats.redCards,
          },
          isHome: true,
        })
        continue
      }

      // Check away team
      const awayStats = match.awayTeamStats.find((s) => s.playerId === playerId)
      if (awayStats) {
        results.push({
          match,
          stats: {
            goals: awayStats.goals,
            penaltyGoals: awayStats.penaltyGoals,
            twoMinutes: awayStats.twoMinutes,
            yellowCards: awayStats.yellowCards,
            redCards: awayStats.redCards,
          },
          isHome: false,
        })
      }
    }

    // Sort by date (newest first)
    return results.sort((a, b) => {
      const dateA = this.parseDate(a.match.matchDate)
      const dateB = this.parseDate(b.match.matchDate)
      return dateB.getTime() - dateA.getTime()
    })
  }

  /**
   * Generate aggregated statistics for all players
   */
  generateAggregates(): PlayerAggregatesData {
    const playerStatsMap = new Map<
      string,
      {
        name: string
        jerseyNumber?: number
        teamMatchCounts: Map<string, { teamName: string; matches: number }>
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

    // Process all matches
    for (const match of this.data.matchStats) {
      const processTeamStats = (
        stats: typeof match.homeTeamStats,
        teamId: string,
        teamName: string
      ) => {
        for (const playerStat of stats) {
          let aggregate = playerStatsMap.get(playerStat.playerId)

          if (!aggregate) {
            aggregate = {
              name: playerStat.playerName,
              jerseyNumber: playerStat.jerseyNumber,
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

          // Track which teams this player has played for
          const teamCount = aggregate.teamMatchCounts.get(teamId)
          if (teamCount) {
            teamCount.matches++
          } else {
            aggregate.teamMatchCounts.set(teamId, { teamName, matches: 1 })
          }

          // Update totals
          aggregate.totalGoals += playerStat.goals
          aggregate.totalPenaltyGoals += playerStat.penaltyGoals
          aggregate.totalTwoMinutes += playerStat.twoMinutes
          aggregate.totalYellowCards += playerStat.yellowCards
          aggregate.totalRedCards += playerStat.redCards
          aggregate.matchesPlayed++

          // Update jersey number if we have a newer one
          if (playerStat.jerseyNumber !== undefined) {
            aggregate.jerseyNumber = playerStat.jerseyNumber
          }

          // Update tournament stats
          const tournament = match.tournament || 'Ukjent'
          let tournamentStats = aggregate.byTournament.get(tournament)
          if (!tournamentStats) {
            tournamentStats = {
              goals: 0,
              penaltyGoals: 0,
              twoMinutes: 0,
              yellowCards: 0,
              redCards: 0,
              matches: 0,
            }
            aggregate.byTournament.set(tournament, tournamentStats)
          }
          tournamentStats.goals += playerStat.goals
          tournamentStats.penaltyGoals += playerStat.penaltyGoals
          tournamentStats.twoMinutes += playerStat.twoMinutes
          tournamentStats.yellowCards += playerStat.yellowCards
          tournamentStats.redCards += playerStat.redCards
          tournamentStats.matches++
        }
      }

      processTeamStats(match.homeTeamStats, match.homeTeamId, match.homeTeamName)
      processTeamStats(match.awayTeamStats, match.awayTeamId, match.awayTeamName)
    }

    // Convert to array format
    const aggregates: PlayerAggregateStats[] = Array.from(playerStatsMap.entries()).map(
      ([playerId, p]) => {
        // Find primary team (most matches played)
        let primaryTeamId = ''
        let primaryTeamName = ''
        let maxMatches = 0
        const teamIds: string[] = []
        const teamNames: string[] = []

        for (const [teamId, data] of p.teamMatchCounts) {
          teamIds.push(teamId)
          teamNames.push(data.teamName)
          if (data.matches > maxMatches) {
            maxMatches = data.matches
            primaryTeamId = teamId
            primaryTeamName = data.teamName
          }
        }

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
      }
    )

    // Sort by total goals descending
    aggregates.sort((a, b) => b.totalGoals - a.totalGoals)

    return {
      aggregates,
      generatedAt: new Date().toISOString(),
    }
  }

  /**
   * Filter aggregates by team IDs (for "our teams" filter)
   * Checks if player has played for ANY of the given teams
   */
  filterByTeams(aggregates: PlayerAggregateStats[], teamIds: string[]): PlayerAggregateStats[] {
    const teamIdSet = new Set(teamIds)
    return aggregates.filter((a) => a.teamIds.some((id) => teamIdSet.has(id)))
  }

  /**
   * Filter aggregates by tournament
   */
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
    if (!dateStr) return new Date(0)
    const [day, month, year] = dateStr.split('.')
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
}
