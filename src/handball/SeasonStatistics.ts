import type { MatchPlayerData } from '../types/player-stats.js'
import { HandballEndpoints } from './HandballEndpoints.js'
import { parseMatchRosters } from './MatchPlayerStatistics.js'
import type { ScheduledMatch } from './TeamSchedule.js'

export interface HandballPageSource {
  fetchPage(url: string): Promise<string>
}

export interface StatisticsProgress {
  (collected: number, total: number, match: ScheduledMatch): void
}

export interface CollectedStatistics {
  matchStats: MatchPlayerData[]
  matchesWithoutStats: string[]
}

export interface AlreadyCollected {
  withStats: Set<string>
  withoutStats: Set<string>
}

export function selectMatchesToCollect(
  played: ScheduledMatch[],
  known: AlreadyCollected
): ScheduledMatch[] {
  return played.filter(
    (match) => !known.withStats.has(match.matchNo) && !known.withoutStats.has(match.matchNo)
  )
}

export class SeasonStatistics {
  private readonly endpoints = new HandballEndpoints()

  constructor(
    private readonly http: HandballPageSource,
    private readonly onProgress: StatisticsProgress = () => {}
  ) {}

  async collect(matches: ScheduledMatch[]): Promise<CollectedStatistics> {
    const matchStats: MatchPlayerData[] = []
    const matchesWithoutStats: string[] = []

    for (const [index, match] of matches.entries()) {
      const collected = await this.collectMatch(match)
      if (collected === null) {
        matchesWithoutStats.push(match.matchNo)
      } else {
        matchStats.push(collected)
      }
      this.onProgress(index + 1, matches.length, match)
    }

    return { matchStats, matchesWithoutStats }
  }

  async collectMatch(match: ScheduledMatch): Promise<MatchPlayerData | null> {
    const matchUrl = this.endpoints.matchPage(match.matchId)
    const html = await this.http.fetchPage(matchUrl)
    const rosters = parseMatchRosters(html)

    if (rosters.homeTeamStats.length === 0 && rosters.awayTeamStats.length === 0) {
      return null
    }

    const score = parseScore(match.result)

    return {
      matchId: match.matchNo,
      matchDate: match.date,
      matchUrl,
      homeTeamId: match.homeTeamId,
      homeTeamName: match.homeTeamName,
      awayTeamId: match.awayTeamId,
      awayTeamName: match.awayTeamName,
      homeScore: score.home,
      awayScore: score.away,
      tournament: match.tournamentName,
      homeTeamStats: rosters.homeTeamStats,
      awayTeamStats: rosters.awayTeamStats,
      scrapedAt: new Date().toISOString(),
    }
  }
}

export function parseScore(result: string): { home: number; away: number } {
  const [homeText, awayText] = result.split('-')
  const home = Number.parseInt(homeText, 10)
  const away = Number.parseInt(awayText === undefined ? '' : awayText, 10)
  return {
    home: Number.isNaN(home) ? 0 : home,
    away: Number.isNaN(away) ? 0 : away,
  }
}
