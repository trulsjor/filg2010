import * as fs from 'fs'
import * as path from 'path'
import type { Config, DataManifest, Match, Metadata, SeasonManifestEntry } from '../types/index.js'
import type { PlayerStatsData } from '../types/player-stats.js'
import type { LeagueTable } from './LeagueTable.js'
import {
  SeasonDataError,
  isLeagueTableArray,
  isMatchArray,
  isPlayerStatsData,
  isSeasonManifestEntry,
  requireShape,
} from './SeasonDataFiles.js'

export interface SeasonInfo {
  squadId: string
  squadName: string
  seasonId: string
  seasonName: string
  slug: string
  status: 'aktiv' | 'arkivert'
  lastUpdated: string
}

export interface CollectedPlayerStats {
  matchStats: PlayerStatsData['matchStats']
  matchesWithoutStats: string[]
}

export class SeasonDataStore {
  private readonly dataDir: string
  private readonly configPath: string

  constructor(baseDir: string = process.cwd()) {
    this.dataDir = path.join(baseDir, 'data')
    this.configPath = path.join(baseDir, 'config.json')
  }

  loadConfig(): Config {
    const parsed: unknown = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'))
    if (!isConfig(parsed)) {
      throw new SeasonDataError(`${this.configPath} mangler currentSeason eller squads`)
    }
    return parsed
  }

  seasonDir(squadId: string, slug: string): string {
    return path.join(this.dataDir, squadId, slug)
  }

  ensureSeasonDir(squadId: string, slug: string): void {
    fs.mkdirSync(this.seasonDir(squadId, slug), { recursive: true })
  }

  saveMatches(squadId: string, slug: string, matches: Match[]): void {
    this.write(squadId, slug, 'terminliste.json', matches)
  }

  loadMatches(squadId: string, slug: string): Match[] {
    const parsed = this.read(squadId, slug, 'terminliste.json')
    if (parsed === null) return []
    return requireShape(parsed, isMatchArray, this.describe(squadId, slug, 'terminliste.json'))
  }

  saveTables(squadId: string, slug: string, tables: LeagueTable[]): void {
    this.write(squadId, slug, 'tables.json', tables)
  }

  loadTables(squadId: string, slug: string): LeagueTable[] {
    const parsed = this.read(squadId, slug, 'tables.json')
    if (parsed === null) return []
    return requireShape(parsed, isLeagueTableArray, this.describe(squadId, slug, 'tables.json'))
  }

  savePlayerStats(squadId: string, slug: string, stats: PlayerStatsData): void {
    this.write(squadId, slug, 'player-stats.json', stats)
  }

  loadCollectedStats(squadId: string, slug: string): CollectedPlayerStats {
    const parsed = this.read(squadId, slug, 'player-stats.json')
    if (parsed === null) return { matchStats: [], matchesWithoutStats: [] }

    const stats = requireShape(
      parsed,
      isPlayerStatsData,
      this.describe(squadId, slug, 'player-stats.json')
    )
    return { matchStats: stats.matchStats, matchesWithoutStats: stats.matchesWithoutStats }
  }

  savePlayerAggregates(squadId: string, slug: string, aggregates: unknown): void {
    this.write(squadId, slug, 'player-aggregates.json', aggregates)
  }

  saveMetadata(squadId: string, slug: string, metadata: Metadata): void {
    this.write(squadId, slug, 'metadata.json', metadata)
  }

  saveSeasonInfo(info: SeasonInfo): void {
    this.write(info.squadId, info.slug, 'season.json', info)
  }

  listSeasons(): SeasonManifestEntry[] {
    if (!fs.existsSync(this.dataDir)) return []

    const entries: SeasonManifestEntry[] = []
    for (const squadId of readDirectories(this.dataDir)) {
      for (const slug of readDirectories(path.join(this.dataDir, squadId))) {
        const seasonPath = path.join(this.dataDir, squadId, slug, 'season.json')
        if (!fs.existsSync(seasonPath)) continue

        const parsed: unknown = JSON.parse(fs.readFileSync(seasonPath, 'utf-8'))
        const info = requireShape(
          parsed,
          isSeasonManifestEntry,
          this.describe(squadId, slug, 'season.json')
        )
        entries.push({
          squadId: info.squadId,
          squadName: info.squadName,
          seasonId: info.seasonId,
          seasonName: info.seasonName,
          slug: info.slug,
          status: info.status,
        })
      }
    }
    return entries.sort(bySquadThenNewestSeason)
  }

  saveManifest(currentSeasonSlug: string): DataManifest {
    const manifest: DataManifest = {
      currentSeasonSlug,
      seasons: this.listSeasons(),
      generatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(
      path.join(this.dataDir, 'index.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf-8'
    )
    return manifest
  }

  private describe(squadId: string, slug: string, fileName: string): string {
    return `data/${squadId}/${slug}/${fileName}`
  }

  private write(squadId: string, slug: string, fileName: string, content: unknown): void {
    this.ensureSeasonDir(squadId, slug)
    fs.writeFileSync(
      path.join(this.seasonDir(squadId, slug), fileName),
      `${JSON.stringify(content, null, 2)}\n`,
      'utf-8'
    )
  }

  private read(squadId: string, slug: string, fileName: string): unknown {
    const filePath = path.join(this.seasonDir(squadId, slug), fileName)
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
}

function readDirectories(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

function bySquadThenNewestSeason(a: SeasonManifestEntry, b: SeasonManifestEntry): number {
  if (a.squadId !== b.squadId) return a.squadId.localeCompare(b.squadId)
  return b.slug.localeCompare(a.slug)
}

function isConfig(value: unknown): value is Config {
  if (typeof value !== 'object' || value === null) return false
  if (!('squads' in value) || !Array.isArray(value.squads)) return false
  if (!('currentSeason' in value)) return false

  const season = value.currentSeason
  if (typeof season !== 'object' || season === null) return false
  return 'id' in season && 'slug' in season
}
