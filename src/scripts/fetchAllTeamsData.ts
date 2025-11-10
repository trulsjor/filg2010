/**
 * Main script for fetching handball schedule data
 *
 * This script orchestrates the data fetching process:
 * 1. Loads team configuration
 * 2. Scrapes tournament links
 * 3. Fetches schedule data from API
 * 4. Scrapes match links
 * 5. Combines and sorts all data
 * 6. Saves to JSON files
 */

import type { Team, Match, MatchLink, Config, Metadata } from '../types/index.js';
import { ScraperService } from '../services/scraper.service.js';
import { HandballApiService } from '../services/handball-api.service.js';
import { FileService } from '../services/file.service.js';
import { sortMatchesByDate } from '../utils/date.utils.js';

// Re-export for backwards compatibility with tests
export { convertDateForSorting, sortMatchesByDate as sortMatches } from '../utils/date.utils.js';

type SortMatchesFn = (matches: Match[]) => Match[];
type NowFn = () => Date;

interface LoggerLike {
  info?: (...args: unknown[]) => void;
  error?: (...args: unknown[]) => void;
}

interface FileServiceLike {
  ensureDataDirectory(): void;
  loadConfig(): Config;
  saveMatches(matches: Match[]): void;
  saveMetadata(metadata: Metadata): void;
  getMatchesPath(): string;
}

interface ScraperServiceLike {
  scrapeTournamentLinks(teams: Team[]): Promise<Map<string, string>>;
  scrapeMatchLinks(lagid: string): Promise<Map<string, MatchLink>>;
}

interface HandballApiServiceLike {
  fetchTeamSchedule(team: Team): Promise<any[]>;
}

export interface FetchPipelineDependencies {
  fileService: FileServiceLike;
  scraperService: ScraperServiceLike;
  apiService: HandballApiServiceLike;
  sortMatches?: SortMatchesFn;
  now?: NowFn;
  logger?: LoggerLike;
}

const defaultLogger: Required<LoggerLike> = {
  info: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
};

const defaultNow: NowFn = () => new Date();

/**
 * Main data fetching orchestrator
 */
export async function fetchAllTeamsData(): Promise<void> {
  const deps: FetchPipelineDependencies = {
    fileService: new FileService(),
    scraperService: new ScraperService(),
    apiService: new HandballApiService(),
    sortMatches: sortMatchesByDate,
    now: defaultNow,
    logger: defaultLogger,
  };

  try {
    await runFetchPipeline(deps);
  } catch (error) {
    defaultLogger.error('Error fetching all teams data:', error);
    throw error;
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
  logger.info?.('=== Fetching data for all teams ===\n');

  const config = fileService.loadConfig();
  const teams: Team[] = config.teams;
  logger.info?.(`Found ${teams.length} teams in config\n`);

  fileService.ensureDataDirectory();

  logger.info?.('Step 1: Scraping tournament links from all team pages...');
  teams.forEach((team) => {
    logger.info?.(`    - ${team.name} (${team.lagid})`);
  });

  const tournamentMap = await scraperService.scrapeTournamentLinks(teams);
  logger.info?.(`    Found ${tournamentMap.size} unique tournaments\n`);

  const allMatches: Match[] = [];

  for (const team of teams) {
    logger.info?.(`Step 2: Fetching data for ${team.name} (lagid=${team.lagid})...`);

    logger.info?.('  Fetching Excel from API...');
    const jsonData = await apiService.fetchTeamSchedule(team);
    logger.info?.(`  Loaded ${jsonData.length} matches from Excel`);

    logger.info?.('  Scraping match links...');
    const linkMap = await scraperService.scrapeMatchLinks(team.lagid);
    logger.info?.(`  Found ${linkMap.size} match links`);

    const enhancedMatches = enhanceMatchesWithLinks(
      jsonData,
      team,
      linkMap,
      tournamentMap
    );

    allMatches.push(...enhancedMatches);
    logger.info?.(`  Added ${enhancedMatches.length} matches for ${team.name}\n`);
  }

  const sortedMatches = sortMatches(allMatches);
  fileService.saveMatches(sortedMatches);

  const metadata: Metadata = {
    lastUpdated: now().toISOString(),
    teamsCount: teams.length,
    matchesCount: sortedMatches.length,
  };
  fileService.saveMetadata(metadata);

  logger.info?.('=== Summary ===');
  logger.info?.(`Total matches: ${sortedMatches.length}`);
  logger.info?.(`Teams: ${teams.map((t) => t.name).join(', ')}`);
  logger.info?.(`Saved to: ${fileService.getMatchesPath()}`);
  logger.info?.(`Last updated: ${metadata.lastUpdated}`);
}

/**
 * Enhances match data with scraped links
 */
function enhanceMatchesWithLinks(
  matches: any[],
  team: Team,
  linkMap: Map<string, MatchLink>,
  tournamentMap: Map<string, string>
): Match[] {
  return matches.map((row: any) => {
    const kampnr = String(row.Kampnr || '').trim();
    const links = linkMap.get(kampnr);
    const turneringNavn = String(row.Turnering || '').trim();
    const turneringUrl = tournamentMap.get(turneringNavn) || '';

    return {
      Lag: team.name,
      ...row,
      Kampnr: kampnr,
      'Kamp URL': links?.kampUrl || '',
      'Hjemmelag URL': links?.hjemmelagUrl || '',
      'Bortelag URL': links?.bortelagUrl || '',
      'Turnering URL': turneringUrl,
    };
  });
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllTeamsData();
}
