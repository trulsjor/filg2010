import { createContext, useContext } from 'react'
import type { SeasonData } from './SeasonDataLoader'

export const SeasonContext = createContext<SeasonData | null>(null)

export const LAST_SQUAD_KEY = 'fjellhammer.sistevalgteKull'

export function rememberSquad(squadId: string): void {
  try {
    window.localStorage.setItem(LAST_SQUAD_KEY, squadId)
  } catch {
    return
  }
}

export function recallSquad(): string | null {
  try {
    return window.localStorage.getItem(LAST_SQUAD_KEY)
  } catch {
    return null
  }
}

export function useSeason(): SeasonData {
  const season = useContext(SeasonContext)
  if (season === null) {
    throw new Error('useSeason må brukes inne i SeasonProvider')
  }
  return season
}
