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
  const previousByNr = new Map(
    existing.filter((m) => m.Turnering === cupTournamentName).map((m) => [m.Kampnr, m])
  )

  // Spilte kamper hentes fra «Spilte»-fanen uten bane/hall. Behold banen fra da
  // kampen var kommende (samme Kampnr), så «Kart» ikke forsvinner når kampen er
  // spilt. Banen endrer seg ikke.
  const enriched = cupMatches.map((match) => {
    if ((match.Bane ?? '') === '') {
      const previous = previousByNr.get(match.Kampnr)
      if (previous?.Bane) return { ...match, Bane: previous.Bane }
    }
    return match
  })

  const withoutOldCup = existing.filter((m) => m.Turnering !== cupTournamentName)

  // Profixio flytter spilte kamper til «Spilte»-fanen, så en gitt skraping kan
  // mangle dem. Bevar spilte cup-kamper (med resultat) som ikke er i skrapet, så
  // resultatene ikke forsvinner fra oversikten. Nye/oppdaterte kamper i skrapet
  // vinner (samme Kampnr).
  const scrapedNumbers = new Set(cupMatches.map((m) => m.Kampnr))
  const playedNotInScrape = existing.filter(
    (m) => m.Turnering === cupTournamentName && !scrapedNumbers.has(m.Kampnr) && isPlayed(m)
  )

  return sortMatchesByDate([...withoutOldCup, ...playedNotInScrape, ...enriched])
}
