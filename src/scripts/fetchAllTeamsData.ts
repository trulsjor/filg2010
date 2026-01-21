/**
 * Main script for fetching handball schedule data
 *
 * Optimized pipeline:
 * 1. Loads team configuration
 * 2. Fetches Excel data from API (parallel)
 * 3. Scrapes match + tournament links (parallel, shared browser)
 * 4. Combines and sorts all data
 * 5. Saves to JSON files
 */

import type { Team, Match, MatchLink, Config, Metadata, RawMatchData } from '../types/index.js'
import { ScraperService } from '../handball/scraper.service.js'
import { HandballApiService } from '../handball/handball-api.service.js'
import { FileService } from '../handball/file.service.js'
import { sortMatchesByDate } from '../match/match-sorting.js'

type SortMatchesFn = (matches: Match[]) => Match[]
type NowFn = () => Date

interface LoggerLike {
  info?: (...args: unknown[]) => void
  error?: (...args: unknown[]) => void
}

interface FileServiceLike {
  ensureDataDirectory(): void
  loadConfig(): Config
  saveMatches(matches: Match[]): void
  saveMetadata(metadata: Metadata): void
  getMatchesPath(): string
}

interface ScraperServiceLike {
  scrapeAllTeams(
    teams: Team[],
    concurrency?: number
  ): Promise<{
    matchLinksPerTeam: Map<string, Map<string, MatchLink>>
    allTournamentLinks: Map<string, string>
  }>
  close(): Promise<void>
  // Legacy methods for backwards compatibility
  scrapeTournamentLinks?(teams: Team[]): Promise<Map<string, string>>
  scrapeMatchLinks?(lagid: string): Promise<Map<string, MatchLink>>
}

interface HandballApiServiceLike {
  fetchTeamSchedule(team: Team): Promise<RawMatchData[]>
}

export interface FetchPipelineDependencies {
  fileService: FileServiceLike
  scraperService: ScraperServiceLike
  apiService: HandballApiServiceLike
  sortMatches?: SortMatchesFn
  now?: NowFn
  logger?: LoggerLike
}

const defaultLogger: Required<LoggerLike> = {
  info: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
}

const defaultNow: NowFn = () => new Date()

/**
 * Main data fetching orchestrator
 */
export async function fetchAllTeamsData(): Promise<void> {
  const scraperService = new ScraperService()
  const deps: FetchPipelineDependencies = {
    fileService: new FileService(),
    scraperService,
    apiService: new HandballApiService(),
    sortMatches: sortMatchesByDate,
    now: defaultNow,
    logger: defaultLogger,
  }

  try {
    await runFetchPipeline(deps)
  } catch (error) {
    defaultLogger.error('Error fetching all teams data:', error)
    throw error
  } finally {
    await scraperService.close()
  }
}

export async function runFetchPipeline({
  fileService,
  scraperService,
  apiService,
  sortMatches = sortMatchesByDate,
  now = defaultNow,
  logger = defaultLogger,
}: FetchPipelineDependencies): Promise<void> {
  const startTime = Date.now()
  logger.info?.('=== Fetching data for all teams ===\n')

  const config = fileService.loadConfig()
  const teams: Team[] = config.teams
  logger.info?.(`Found ${teams.length} teams in config`)
  teams.forEach((team) => logger.info?.(`  - ${team.name} (${team.lagid})`))
  logger.info?.('')

  fileService.ensureDataDirectory()

  // Step 1: Fetch API data and scrape in parallel
  logger.info?.('Step 1: Fetching data (API + scraping in parallel)...')

  const [apiDataPerTeam, scrapingResult] = await Promise.all([
    // Fetch Excel data from API for all teams in parallel
    Promise.all(
      teams.map(async (team) => {
        try {
          const data = await apiService.fetchTeamSchedule(team)
          logger.info?.(`  ✓ API: ${team.name} - ${data.length} matches`)
          return { team, data }
        } catch (error) {
          logger.error?.(`  ✗ API: ${team.name} failed:`, error)
          return { team, data: [] as RawMatchData[] }
        }
      })
    ),
    // Scrape all teams (shared browser, parallel pages)
    (async () => {
      const result = await scraperService.scrapeAllTeams(teams, 3)
      logger.info?.(
        `  ✓ Scraping: ${result.allTournamentLinks.size} tournaments, ${teams.length} teams`
      )
      return result
    })(),
  ])

  // Step 2: Combine data
  logger.info?.('\nStep 2: Combining data...')
  const allMatches: Match[] = []

  for (const { team, data } of apiDataPerTeam) {
    const matchLinks = scrapingResult.matchLinksPerTeam.get(team.lagid) || new Map()
    const enhancedMatches = enhanceMatchesWithLinks(
      data,
      team,
      matchLinks,
      scrapingResult.allTournamentLinks
    )
    allMatches.push(...enhancedMatches)
    logger.info?.(`  ${team.name}: ${enhancedMatches.length} matches`)
  }

  // Step 3: Sort and save
  const sortedMatches = sortMatches(allMatches)
  fileService.saveMatches(sortedMatches)

  const metadata: Metadata = {
    lastUpdated: now().toISOString(),
    teamsCount: teams.length,
    matchesCount: sortedMatches.length,
  }
  fileService.saveMetadata(metadata)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  logger.info?.('\n=== Summary ===')
  logger.info?.(`Total matches: ${sortedMatches.length}`)
  logger.info?.(`Teams: ${teams.map((t) => t.name).join(', ')}`)
  logger.info?.(`Saved to: ${fileService.getMatchesPath()}`)
  logger.info?.(`Time: ${elapsed}s`)
}

/**
 * Enhances match data with scraped links
 */
function enhanceMatchesWithLinks(
  matches: RawMatchData[],
  team: Team,
  linkMap: Map<string, MatchLink>,
  tournamentMap: Map<string, string>
): Match[] {
  return matches.map((row: RawMatchData) => {
    const kampnr = String(row.Kampnr || '').trim()
    const links = linkMap.get(kampnr)
    const turneringNavn = String(row.Turnering || '').trim()
    const turneringUrl = tournamentMap.get(turneringNavn) || ''

    return {
      Lag: team.name,
      Dato: row.Dato,
      Tid: row.Tid,
      Kampnr: kampnr,
      Hjemmelag: row.Hjemmelag,
      Bortelag: row.Bortelag,
      'H-B': row['H-B'],
      Bane: row.Bane,
      Tilskuere: row.Tilskuere ?? 0,
      Arrangør: row.Arrangør ?? '',
      Turnering: row.Turnering,
      'Kamp URL': links?.kampUrl || '',
      'Hjemmelag URL': links?.hjemmelagUrl || '',
      'Bortelag URL': links?.bortelagUrl || '',
      'Turnering URL': turneringUrl,
    }
  })
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllTeamsData().then(() => process.exit(0))
}
