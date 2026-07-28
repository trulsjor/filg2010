import type { Match } from '../types/index.js'

const CUP_PREFIX = 'pwcup-'

export function cupMatchNumber(matchNumber: string): string {
  return `${CUP_PREFIX}${matchNumber}`
}

export function isCupMatch(match: Match): boolean {
  return match.Kampnr.startsWith(CUP_PREFIX)
}
