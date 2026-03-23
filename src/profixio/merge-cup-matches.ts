import type { Match } from '../types/index.js'
import { sortMatchesByDate } from '../match/match-sorting.js'

export function mergeCupMatches(
  existing: Match[],
  cupMatches: Match[],
  cupTournamentName: string
): Match[] {
  const withoutOldCup = existing.filter((m) => m.Turnering !== cupTournamentName)
  return sortMatchesByDate([...withoutOldCup, ...cupMatches])
}
