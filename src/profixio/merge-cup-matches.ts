import type { Match } from '../types/index.js'
import { sortMatchesByDate } from '../match/match-sorting.js'

function isPlayed(match: Match): boolean {
  const result = match['H-B']
  return result !== '-' && result !== ''
}

export function mergeCupMatches(
  existing: Match[],
  cupMatches: Match[],
  cupTournamentName: string
): Match[] {
  const withoutOldCup = existing.filter((m) => m.Turnering !== cupTournamentName)

  // Profixio flytter spilte kamper til «Spilte»-fanen, så en gitt skraping kan
  // mangle dem. Bevar spilte cup-kamper (med resultat) som ikke er i skrapet, så
  // resultatene ikke forsvinner fra oversikten. Nye/oppdaterte kamper i skrapet
  // vinner (samme Kampnr).
  const scrapedNumbers = new Set(cupMatches.map((m) => m.Kampnr))
  const playedNotInScrape = existing.filter(
    (m) => m.Turnering === cupTournamentName && !scrapedNumbers.has(m.Kampnr) && isPlayed(m)
  )

  return sortMatchesByDate([...withoutOldCup, ...playedNotInScrape, ...cupMatches])
}
