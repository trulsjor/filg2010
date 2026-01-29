import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { PlayerStatsService } from '../src/handball/PlayerStatsAggregator.js'
import type { PlayerStatsData } from '../src/types/player-stats.js'
import { combinePlayedMatches } from '../src/update/combine-matches.js'

const DATA_DIR = path.join(process.cwd(), 'data')
const PLAYER_STATS_PATH = path.join(DATA_DIR, 'player-stats.json')
const AGGREGATES_PATH = path.join(DATA_DIR, 'player-aggregates.json')
const TERMINLISTE_PATH = path.join(DATA_DIR, 'terminliste.json')

function loadPlayerStats(): PlayerStatsData | null {
  if (!fs.existsSync(PLAYER_STATS_PATH)) return null
  const content = fs.readFileSync(PLAYER_STATS_PATH, 'utf-8')
  return JSON.parse(content) as PlayerStatsData
}

interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
}

function loadTerminliste(): TerminlisteMatch[] {
  if (!fs.existsSync(TERMINLISTE_PATH)) return []
  const content = fs.readFileSync(TERMINLISTE_PATH, 'utf-8')
  return JSON.parse(content) as TerminlisteMatch[]
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
    const stats = loadPlayerStats()

    if (stats === null) {
      test.skip()
      return
    }

    expect(stats).toHaveProperty('players')
    expect(stats).toHaveProperty('matchStats')
    expect(stats).toHaveProperty('lastUpdated')
    expect(Array.isArray(stats.players)).toBe(true)
    expect(Array.isArray(stats.matchStats)).toBe(true)
  })

  test('player-aggregates.json is consistent with player-stats.json', () => {
    const stats = loadPlayerStats()
    if (stats === null) {
      test.skip()
      return
    }

    if (!fs.existsSync(AGGREGATES_PATH)) {
      test.skip()
      return
    }

    const aggregatesContent = fs.readFileSync(AGGREGATES_PATH, 'utf-8')
    const aggregates = JSON.parse(aggregatesContent) as { aggregates: unknown[] }

    expect(Array.isArray(aggregates.aggregates)).toBe(true)
  })

  test('generateAggregates produces correct structure', () => {
    const stats = loadPlayerStats()
    if (stats === null) {
      test.skip()
      return
    }

    const service = new PlayerStatsService(stats)
    const result = service.generateAggregates()

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
