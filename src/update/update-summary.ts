export interface MatchUpdateInfo {
  kampnr: string
  hjemmelag: string
  bortelag: string
  resultat: string
}

export interface UpdateSummary {
  timestamp: string
  resultsUpdated: MatchUpdateInfo[]
  statsUpdated: MatchUpdateInfo[]
  noChanges: boolean
}

export function createEmptySummary(): UpdateSummary {
  return {
    timestamp: new Date().toISOString(),
    resultsUpdated: [],
    statsUpdated: [],
    noChanges: true,
  }
}

export function hasChanges(summary: UpdateSummary): boolean {
  return summary.resultsUpdated.length > 0 || summary.statsUpdated.length > 0
}

export function finalizeSummary(summary: UpdateSummary): UpdateSummary {
  return {
    ...summary,
    noChanges: !hasChanges(summary),
  }
}
