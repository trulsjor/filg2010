import type { Match } from '../types/index.js'

export interface MatchIndex {
  [kampnr: string]: string
}

export class Attendance {
  private constructor(private readonly value: number | string | undefined) {}

  static parse(input: number | string | undefined): Attendance {
    if (typeof input === 'number') {
      return new Attendance(input)
    }
    if (typeof input === 'string') {
      const trimmed = input.trim()
      if (trimmed === '') {
        return new Attendance(undefined)
      }
      const parsed = parseInt(trimmed, 10)
      if (!Number.isNaN(parsed)) {
        return new Attendance(parsed)
      }
      return new Attendance(trimmed)
    }
    return new Attendance(undefined)
  }

  toValue(): number | string | undefined {
    return this.value
  }
}

export class MatchParticipants {
  constructor(
    readonly homeTeam: string,
    readonly awayTeam: string
  ) {}
}

export function populateMatchUrls(matches: Match[], index: MatchIndex): number {
  let populated = 0
  for (const match of matches) {
    const cleanKampnr = match.Kampnr.trim()
    const url = index[cleanKampnr]
    if (!match['Kamp URL'] && url) {
      match['Kamp URL'] = url
      populated++
    }
  }
  return populated
}

interface OldMatchIndexEntry {
  url: string
  played?: boolean
}

type MatchIndexValue = OldMatchIndexEntry | string | number | boolean | null

interface RawMatchIndexData {
  [key: string]: MatchIndexValue
}

export function parseMatchDate(dateStr: string): Date | null {
  const parts = dateStr.split('.')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  return new Date(year, month, day, 23, 59, 59)
}

export function needsResultUpdate(match: Match, now: Date): boolean {
  if (match['H-B'] && match['H-B'] !== '-') {
    return false
  }
  if (!match['Kamp URL']) {
    return false
  }
  const matchDate = parseMatchDate(match.Dato)
  if (!matchDate) {
    return false
  }
  return matchDate < now
}

export function extractMatchIdFromUrl(url: string | undefined): string | null {
  if (typeof url !== 'string') {
    return null
  }
  const match = url.match(/matchid=(\d+)/)
  return match ? match[1] : null
}

export function isOldMatchIndexEntry(value: MatchIndexValue): value is OldMatchIndexEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  if (!('url' in value)) {
    return false
  }
  const urlValue = Object.getOwnPropertyDescriptor(value, 'url')?.value
  return typeof urlValue === 'string'
}

function isRawMatchIndexData(value: object | null): value is RawMatchIndexData {
  return typeof value === 'object' && value !== null
}

export function parseMatchIndexFile(content: string): MatchIndex {
  let parsed: object | null = null
  try {
    const result = JSON.parse(content)
    if (typeof result === 'object') {
      parsed = result
    }
  } catch {
    return {}
  }

  if (!isRawMatchIndexData(parsed)) {
    return {}
  }

  const entries = Object.entries(parsed)
  if (entries.length === 0) {
    return {}
  }

  const [, firstValue] = entries[0]

  if (isOldMatchIndexEntry(firstValue)) {
    const index: MatchIndex = {}
    for (const [k, v] of entries) {
      if (isOldMatchIndexEntry(v)) {
        index[k] = v.url
      }
    }
    return index
  }

  const index: MatchIndex = {}
  for (const [k, v] of entries) {
    if (typeof v === 'string') {
      index[k] = v
    }
  }
  return index
}
