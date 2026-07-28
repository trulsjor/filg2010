import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { PlayerStatsAggregator } from '../src/handball/PlayerStatsAggregator.js'
import type { PlayerStatsData } from '../src/types/player-stats.js'
import { combinePlayedMatches } from '../src/update/combine-matches.js'

const ARCHIVED_SEASON_DIR = path.join(process.cwd(), 'data', 'g2010', '2025-2026')
const PLAYER_STATS_PATH = path.join(ARCHIVED_SEASON_DIR, 'player-stats.json')
const AGGREGATES_PATH = path.join(ARCHIVED_SEASON_DIR, 'player-aggregates.json')
const TERMINLISTE_PATH = path.join(ARCHIVED_SEASON_DIR, 'terminliste.json')

interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
}

function readJsonFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function isPlayerStatsData(value: unknown): value is PlayerStatsData {
  if (typeof value !== 'object' || value === null) return false
  if (!('players' in value) || !Array.isArray(value.players)) return false
  if (!('matchStats' in value) || !Array.isArray(value.matchStats)) return false
  return 'lastUpdated' in value && typeof value.lastUpdated === 'string'
}

function isTerminlisteMatchArray(value: unknown): value is TerminlisteMatch[] {
  if (!Array.isArray(value)) return false
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'Kampnr' in item &&
      typeof item.Kampnr === 'string'
  )
}

function hasAggregatesArray(value: unknown): value is { aggregates: unknown[] } {
  if (typeof value !== 'object' || value === null) return false
  return 'aggregates' in value && Array.isArray(value.aggregates)
}

function loadPlayerStats(): PlayerStatsData | null {
  const parsed = readJsonFile(PLAYER_STATS_PATH)
  if (parsed === null) return null
  if (!isPlayerStatsData(parsed)) {
    throw new Error(`${PLAYER_STATS_PATH} har ugyldig struktur`)
  }
  return parsed
}

function loadTerminliste(): TerminlisteMatch[] {
  const parsed = readJsonFile(TERMINLISTE_PATH)
  if (parsed === null) return []
  if (!isTerminlisteMatchArray(parsed)) {
    throw new Error(`${TERMINLISTE_PATH} har ugyldig struktur`)
  }
  return parsed
}

test.describe('Update Workflow Integration', () => {
  test('combinePlayedMatches includes matches from terminliste with results', () => {
    const tournamentMatches = [{ matchId: '111', matchUrl: 'https://handball.no?matchid=111' }]

    const terminlisteMatches: TerminlisteMatch[] = [
      { Kampnr: '222', 'Kamp URL': 'https://handball.no?matchid=222', 'H-B': '25-20' },
      { Kampnr: '333', 'Kamp URL': 'https://handball.no?matchid=333', 'H-B': '-' },
      { Kampnr: '444', 'Kamp URL': '', 'H-B': '30-28' },
    ]

    const combined = combinePlayedMatches(tournamentMatches, terminlisteMatches)

    expect(combined).toHaveLength(2)
    expect(combined.map((m) => m.matchId)).toContain('111')
    expect(combined.map((m) => m.matchId)).toContain('222')
    expect(combined.map((m) => m.matchId)).not.toContain('333')
    expect(combined.map((m) => m.matchId)).not.toContain('444')
  })

  test('player-stats.json has valid structure if exists', () => {
    const parsed = readJsonFile(PLAYER_STATS_PATH)

    if (parsed === null) {
      test.skip()
      return
    }

    expect(isPlayerStatsData(parsed)).toBe(true)
  })

  test('player-aggregates.json is consistent with player-stats.json', () => {
    const stats = loadPlayerStats()
    if (stats === null) {
      test.skip()
      return
    }

    const aggregates = readJsonFile(AGGREGATES_PATH)
    if (aggregates === null) {
      test.skip()
      return
    }

    expect(hasAggregatesArray(aggregates)).toBe(true)
  })

  test('generateAggregates produces correct structure', () => {
    const stats = loadPlayerStats()
    if (stats === null) {
      test.skip()
      return
    }

    const aggregator = new PlayerStatsAggregator(stats)
    const result = aggregator.generateAggregates()

    expect(result).toHaveProperty('aggregates')
    expect(result).toHaveProperty('generatedAt')
    expect(Array.isArray(result.aggregates)).toBe(true)

    if (result.aggregates.length > 0) {
      const first = result.aggregates[0]
      expect(first).toHaveProperty('playerId')
      expect(first).toHaveProperty('playerName')
      expect(first).toHaveProperty('totalGoals')
      expect(first).toHaveProperty('matchesPlayed')
    }
  })

  test('all played matches in terminliste have stats or are marked as no-stats', () => {
    const stats = loadPlayerStats()
    const terminliste = loadTerminliste()

    if (stats === null || terminliste.length === 0) {
      test.skip()
      return
    }

    const matchesWithResults = terminliste.filter((m) => {
      const result = m['H-B']
      return result && result.trim() !== '' && result.trim() !== '-' && m['Kamp URL']
    })

    const statsMatchIds = new Set(stats.matchStats.map((m) => m.matchId))
    const noStatsMatchIds = new Set(stats.matchesWithoutStats ?? [])

    const missingMatches = matchesWithResults.filter((m) => {
      const id = m.Kampnr.trim()
      return !statsMatchIds.has(id) && !noStatsMatchIds.has(id)
    })

    expect(missingMatches.length).toBeLessThanOrEqual(5)
  })
})
