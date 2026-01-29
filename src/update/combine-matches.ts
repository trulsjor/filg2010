interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
}

export interface PlayedMatch {
  matchId: string
  matchUrl: string
}

function hasValidResult(match: TerminlisteMatch): boolean {
  const result = match['H-B']
  return Boolean(result && result.trim() !== '' && result.trim() !== '-')
}

export function combinePlayedMatches(
  tournamentMatches: PlayedMatch[],
  terminlisteMatches: TerminlisteMatch[]
): PlayedMatch[] {
  const allPlayedMatches = new Map<string, PlayedMatch>()

  for (const match of tournamentMatches) {
    allPlayedMatches.set(match.matchId, match)
  }

  for (const match of terminlisteMatches) {
    if (!hasValidResult(match)) {
      continue
    }

    const url = match['Kamp URL']
    if (!url || url.trim() === '') {
      continue
    }

    const matchId = match.Kampnr.trim()

    if (!allPlayedMatches.has(matchId)) {
      allPlayedMatches.set(matchId, {
        matchId,
        matchUrl: url,
      })
    }
  }

  return Array.from(allPlayedMatches.values())
}
