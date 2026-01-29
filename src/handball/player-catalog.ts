import type { Player, MatchPlayerData } from '../types/player-stats.js'

interface PlayerAggregate {
  id: string
  name: string
  jerseyNumber?: number
  teamCounts: Map<string, { teamName: string; count: number }>
}

export function rebuildPlayerCatalog(matchStats: MatchPlayerData[]): Player[] {
  const playerMap = new Map<string, PlayerAggregate>()

  for (const match of matchStats) {
    const processStats = (stats: typeof match.homeTeamStats, teamId: string, teamName: string) => {
      for (const stat of stats) {
        let player = playerMap.get(stat.playerId)
        if (!player) {
          player = {
            id: stat.playerId,
            name: stat.playerName,
            jerseyNumber: stat.jerseyNumber,
            teamCounts: new Map(),
          }
          playerMap.set(stat.playerId, player)
        }
        if (stat.jerseyNumber !== undefined) {
          player.jerseyNumber = stat.jerseyNumber
        }
        const tc = player.teamCounts.get(teamId)
        if (tc) tc.count++
        else player.teamCounts.set(teamId, { teamName, count: 1 })
      }
    }
    processStats(match.homeTeamStats, match.homeTeamId, match.homeTeamName)
    processStats(match.awayTeamStats, match.awayTeamId, match.awayTeamName)
  }

  return Array.from(playerMap.values()).map((p) => {
    const teamIds: string[] = []
    const teamNames: string[] = []
    let primaryTeamId = ''
    let primaryTeamName = ''
    let maxCount = 0
    for (const [teamId, data] of p.teamCounts) {
      teamIds.push(teamId)
      teamNames.push(data.teamName)
      if (data.count > maxCount) {
        maxCount = data.count
        primaryTeamId = teamId
        primaryTeamName = data.teamName
      }
    }
    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      teamIds,
      teamNames,
      primaryTeamId,
      primaryTeamName,
    }
  })
}
