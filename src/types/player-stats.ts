export interface Player {
  id: string
  name: string
  jerseyNumber?: number
  teamIds: string[]
  teamNames: string[]
  primaryTeamId: string
  primaryTeamName: string
}

export interface PlayerMatchStats {
  playerId: string
  playerName: string
  jerseyNumber?: number
  goals: number
  penaltyGoals: number
  twoMinutes: number
  yellowCards: number
  redCards: number
}

export interface MatchPlayerData {
  matchId: string
  matchDate: string
  matchUrl?: string
  homeTeamId: string
  homeTeamName: string
  awayTeamId: string
  awayTeamName: string
  homeScore: number
  awayScore: number
  tournament: string
  homeTeamStats: PlayerMatchStats[]
  awayTeamStats: PlayerMatchStats[]
  scrapedAt: string
}

export interface PlayerAggregateStats {
  playerId: string
  playerName: string
  teamId: string
  teamName: string
  teamIds: string[]
  teamNames: string[]
  jerseyNumber?: number
  totalGoals: number
  totalPenaltyGoals: number
  totalTwoMinutes: number
  totalYellowCards: number
  totalRedCards: number
  matchesPlayed: number
  goalsPerMatch: number
  byTournament: {
    tournament: string
    goals: number
    penaltyGoals: number
    twoMinutes: number
    yellowCards: number
    redCards: number
    matches: number
  }[]
}

export interface PlayerStatsData {
  players: Player[]
  matchStats: MatchPlayerData[]
  matchesWithoutStats: string[]
  lastUpdated: string
}

export interface PlayerAggregatesData {
  aggregates: PlayerAggregateStats[]
  generatedAt: string
}
