import * as fs from 'fs'
import * as path from 'path'
import type { Config, Match, Metadata } from '../types/index.js'

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
}
