import * as fs from 'fs'
import * as path from 'path'
import type { Config, Match, Metadata } from '../types/index.js'
import type { PlayerStatsData } from '../types/player-stats.js'
import type { UpdateSummary } from '../update/update-summary.js'
import { parseMatchIndexFile, type MatchIndex } from '../update/match-parsing.js'
import { PlayerStatsService } from './PlayerStatsAggregator.js'

/**
 * Service for file operations
 */
export class FileService {
  private readonly dataDir: string
  private readonly configPath: string

  constructor(baseDir: string = process.cwd()) {
    this.dataDir = path.join(baseDir, 'data')
    this.configPath = path.join(baseDir, 'config.json')
  }

  /**
   * Ensures data directory exists
   */
  ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  /**
   * Loads config file
   */
  loadConfig(): Config {
    try {
      const content = fs.readFileSync(this.configPath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to load config file: ${error}`)
    }
  }

  /**
   * Saves matches to JSON file
   */
  saveMatches(matches: Match[]): void {
    const filePath = path.join(this.dataDir, 'terminliste.json')
    try {
      fs.writeFileSync(filePath, JSON.stringify(matches, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Failed to save matches: ${error}`)
    }
  }

  /**
   * Saves metadata to JSON file
   */
  saveMetadata(metadata: Metadata): void {
    const filePath = path.join(this.dataDir, 'metadata.json')
    try {
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Failed to save metadata: ${error}`)
    }
  }

  /**
   * Gets the full path to the matches JSON file
   */
  getMatchesPath(): string {
    return path.join(this.dataDir, 'terminliste.json')
  }

  /**
   * Loads matches from JSON file
   */
  loadMatches(): Match[] {
    const filePath = path.join(this.dataDir, 'terminliste.json')
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to load matches: ${error}`)
    }
  }

  /**
   * Loads metadata from JSON file
   */
  loadMetadata(): Metadata {
    const filePath = path.join(this.dataDir, 'metadata.json')
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Failed to load metadata: ${error}`)
    }
  }

  saveSummary(summary: UpdateSummary): void {
    const filePath = path.join(this.dataDir, 'update-summary.json')
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2))
  }

  savePlayerStats(stats: PlayerStatsData): void {
    const filePath = path.join(this.dataDir, 'player-stats.json')
    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2))
  }

  loadPlayerStats(): PlayerStatsData | null {
    const filePath = path.join(this.dataDir, 'player-stats.json')
    if (!fs.existsSync(filePath)) {
      return null
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as PlayerStatsData
    } catch {
      return null
    }
  }

  loadMatchIndex(): MatchIndex {
    const indexPath = path.join(this.dataDir, 'match-index.json')
    const legacyCachePath = path.join(this.dataDir, 'match-cache.json')

    if (fs.existsSync(indexPath)) {
      try {
        const content = fs.readFileSync(indexPath, 'utf-8')
        return parseMatchIndexFile(content)
      } catch {
        return this.migrateFromLegacyMatchCache(legacyCachePath)
      }
    }
    return this.migrateFromLegacyMatchCache(legacyCachePath)
  }

  private migrateFromLegacyMatchCache(legacyCachePath: string): MatchIndex {
    if (!fs.existsSync(legacyCachePath)) return {}

    try {
      const legacy = JSON.parse(fs.readFileSync(legacyCachePath, 'utf-8'))
      if (legacy.matches && Array.isArray(legacy.matches)) {
        const index: MatchIndex = {}
        for (const m of legacy.matches) {
          if (m.matchId && m.matchUrl) {
            index[m.matchId] = m.matchUrl
          }
        }
        return index
      }
    } catch {
      return {}
    }
    return {}
  }

  saveMatchIndex(index: MatchIndex): void {
    const filePath = path.join(this.dataDir, 'match-index.json')
    fs.writeFileSync(filePath, JSON.stringify(index, null, 2))
  }

  generateAndSaveAggregates(stats: PlayerStatsData): number {
    const service = new PlayerStatsService(stats)
    const aggregates = service.generateAggregates()
    const filePath = path.join(this.dataDir, 'player-aggregates.json')
    fs.writeFileSync(filePath, JSON.stringify(aggregates, null, 2))
    return aggregates.aggregates.length
  }
}
