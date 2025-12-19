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

import type { Team, Match, MatchLink, Config, Metadata, RawMatchData } from '../types/index.js';
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
  fetchTeamSchedule(team: Team): Promise<RawMatchData[]>;
}

export interface FetchPipelineDependencies {
  fileService: FileServiceLike;
  scraperService: ScraperServiceLike;
  apiService: HandballApiServiceLike;
  sortMatches?: SortMatchesFn;
  now?: NowFn;
  logger?: LoggerLike;
  teamConcurrency?: number;
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
  teamConcurrency = 1,
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

  const concurrency = Math.max(1, Math.floor(teamConcurrency));
  const matchesPerTeam = await processTeamsWithConcurrency(
    teams,
    concurrency,
    async (team) => {
      logger.info?.(`Step 2: Fetching data for ${team.name} (lagid=${team.lagid})...`);
      try {
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

        logger.info?.(`  Added ${enhancedMatches.length} matches for ${team.name}\n`);
        return enhancedMatches;
      } catch (error) {
        logger.error?.(`  Failed to process ${team.name} (${team.lagid}):`, error);
        return [];
      }
    }
  );

  const allMatches: Match[] = matchesPerTeam.flat();

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
  matches: RawMatchData[],
  team: Team,
  linkMap: Map<string, MatchLink>,
  tournamentMap: Map<string, string>
): Match[] {
  return matches.map((row: RawMatchData) => {
    const kampnr = String(row.Kampnr || '').trim();
    const links = linkMap.get(kampnr);
    const turneringNavn = String(row.Turnering || '').trim();
    const turneringUrl = tournamentMap.get(turneringNavn) || '';

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
    };
  });
}

async function processTeamsWithConcurrency(
  teams: Team[],
  concurrency: number,
  worker: (team: Team, index: number) => Promise<Match[]>
): Promise<Match[][]> {
  if (teams.length === 0) {
    return [];
  }

  const results: Match[][] = new Array(teams.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= teams.length) {
        break;
      }
      const team = teams[currentIndex];
      results[currentIndex] = await worker(team, currentIndex);
    }
  };

  const workerCount = Math.min(concurrency, teams.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllTeamsData();
}
