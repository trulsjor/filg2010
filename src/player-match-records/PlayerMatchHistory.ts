import type { PlayerStatsData, PlayerAggregateStats } from '../types/player-stats'
import type { TeamId, TeamName, TournamentName } from '../types'
import { NorwegianDate } from './NorwegianDate'
import { TeamSelection } from './TeamSelection'

export interface TerminlisteKamp {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
  Hjemmelag: string
  Bortelag: string
}

export interface MatchHistoryItem {
  matchId: string
  matchDate: string
  homeTeam: TeamName
  homeTeamId: TeamId
  awayTeam: TeamName
  awayTeamId: TeamId
  teamName: TeamName
  teamId: TeamId
  tournament: TournamentName
  result: string
  isHome: boolean
  won: boolean
  draw: boolean
  goals: number
  penaltyGoals: number
  twoMinutes: number
  yellowCards: number
  matchUrl: string | undefined
}

export interface TeamStatsItem {
  teamId: TeamId
  teamName: TeamName
  matches: number
  goals: number
  penaltyGoals: number
  twoMinutes: number
  wins: number
  draws: number
  losses: number
}

export interface FilteredStats {
  totalGoals: number
  totalPenaltyGoals: number
  regularGoals: number
  totalTwoMinutes: number
  totalYellowCards: number
  matchCount: number
  goalsPerMatch: number | null
}

export class PlayerMatchHistory {
  private readonly items: MatchHistoryItem[]

  private constructor(items: MatchHistoryItem[]) {
    this.items = items
  }

  static empty(): PlayerMatchHistory {
    return new PlayerMatchHistory([])
  }

  static build(
    playerId: string,
    stats: PlayerStatsData,
    terminliste: TerminlisteKamp[]
  ): PlayerMatchHistory {
    const history: MatchHistoryItem[] = []

    for (const match of stats.matchStats) {
      let playerStats = match.homeTeamStats.find((s) => s.playerId === playerId)
      let isHome = true

      if (!playerStats) {
        playerStats = match.awayTeamStats.find((s) => s.playerId === playerId)
        isHome = false
      }

      if (playerStats) {
        const teamName = isHome ? match.homeTeamName : match.awayTeamName
        const teamId = isHome ? match.homeTeamId : match.awayTeamId

        const terminlisteMatch = terminliste.find((t) => t.Kampnr === match.matchId)
        const matchUrl = PlayerMatchHistory.resolveMatchUrl(
          match.matchUrl,
          terminlisteMatch?.['Kamp URL']
        )

        const resolvedResult = PlayerMatchHistory.resolveResult(
          match.homeScore,
          match.awayScore,
          terminlisteMatch?.['H-B']
        )

        const resolvedPlayerScore = isHome ? resolvedResult.homeScore : resolvedResult.awayScore
        const resolvedOpponentScore = isHome ? resolvedResult.awayScore : resolvedResult.homeScore

        history.push({
          matchId: match.matchId,
          matchDate: match.matchDate,
          homeTeam: match.homeTeamName,
          homeTeamId: match.homeTeamId,
          awayTeam: match.awayTeamName,
          awayTeamId: match.awayTeamId,
          teamName,
          teamId,
          tournament: match.tournament,
          result: `${resolvedResult.homeScore}-${resolvedResult.awayScore}`,
          isHome,
          won: resolvedPlayerScore > resolvedOpponentScore,
          draw: resolvedPlayerScore === resolvedOpponentScore,
          goals: playerStats.goals,
          penaltyGoals: playerStats.penaltyGoals,
          twoMinutes: playerStats.twoMinutes,
          yellowCards: playerStats.yellowCards,
          matchUrl,
        })
      }
    }

    const sorted = [...history].sort((a, b) => {
      const dateA = NorwegianDate.fromString(a.matchDate)
      const dateB = NorwegianDate.fromString(b.matchDate)
      return dateB.getTime() - dateA.getTime()
    })

    return new PlayerMatchHistory(sorted)
  }

  private static resolveMatchUrl(
    primaryUrl: string | undefined,
    fallbackUrl: string | undefined
  ): string | undefined {
    if (primaryUrl !== undefined) {
      return primaryUrl
    }
    if (fallbackUrl !== undefined) {
      return fallbackUrl
    }
    return undefined
  }

  private static resolveResult(
    homeScore: number,
    awayScore: number,
    hbString: string | undefined
  ): { homeScore: number; awayScore: number } {
    if (hbString) {
      const match = hbString.match(/^(\d+)-(\d+)$/)
      if (match) {
        return {
          homeScore: parseInt(match[1]),
          awayScore: parseInt(match[2]),
        }
      }
    }
    return { homeScore, awayScore }
  }

  getItems(): MatchHistoryItem[] {
    return this.items
  }

  filterByTeams(selection: TeamSelection): PlayerMatchHistory {
    if (selection.isEmpty()) {
      return this
    }
    const filtered = this.items.filter((m) => selection.hasTeam(m.teamId))
    return new PlayerMatchHistory(filtered)
  }

  aggregateTeamStats(): TeamStatsItem[] {
    const teamMap = new Map<string, TeamStatsItem>()

    for (const match of this.items) {
      const existing = teamMap.get(match.teamId)
      if (existing) {
        existing.matches += 1
        existing.goals += match.goals
        existing.penaltyGoals += match.penaltyGoals
        existing.twoMinutes += match.twoMinutes
        if (match.won) existing.wins += 1
        else if (match.draw) existing.draws += 1
        else existing.losses += 1
      } else {
        teamMap.set(match.teamId, {
          teamId: match.teamId,
          teamName: match.teamName,
          matches: 1,
          goals: match.goals,
          penaltyGoals: match.penaltyGoals,
          twoMinutes: match.twoMinutes,
          wins: match.won ? 1 : 0,
          draws: match.draw ? 1 : 0,
          losses: !match.won && !match.draw ? 1 : 0,
        })
      }
    }

    return Array.from(teamMap.values()).sort((a, b) => b.matches - a.matches)
  }

  calculateStats(): FilteredStats {
    const totalGoals = this.items.reduce((sum, m) => sum + m.goals, 0)
    const totalPenaltyGoals = this.items.reduce((sum, m) => sum + m.penaltyGoals, 0)
    const totalTwoMinutes = this.items.reduce((sum, m) => sum + m.twoMinutes, 0)
    const totalYellowCards = this.items.reduce((sum, m) => sum + m.yellowCards, 0)
    const matchCount = this.items.length
    return {
      totalGoals,
      totalPenaltyGoals,
      regularGoals: totalGoals - totalPenaltyGoals,
      totalTwoMinutes,
      totalYellowCards,
      matchCount,
      goalsPerMatch: matchCount > 0 ? totalGoals / matchCount : null,
    }
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  count(): number {
    return this.items.length
  }

  slice(start: number, end?: number): MatchHistoryItem[] {
    return this.items.slice(start, end)
  }

  reverse(): MatchHistoryItem[] {
    return [...this.items].reverse()
  }
}

export function formatJerseyNumber(player: PlayerAggregateStats): string {
  if (player.jerseyNumber !== undefined) {
    return String(player.jerseyNumber)
  }
  return '#'
}

export type ResultClass = 'win' | 'loss' | 'draw'

export function getResultClass(match: { won: boolean; draw: boolean }): ResultClass {
  if (match.draw) return 'draw'
  if (match.won) return 'win'
  return 'loss'
}
