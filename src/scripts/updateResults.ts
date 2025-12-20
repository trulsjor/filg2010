/**
 * Smart results updater script
 *
 * Only fetches results for matches that:
 * 1. Have already been played (date has passed)
 * 2. Don't have a result yet (H-B === "-")
 *
 * Much faster than full refresh (~seconds vs ~minutes)
 */

import type { Match, Metadata } from '../types/index.js';
import { FileService } from '../services/file.service.js';
import { ResultScraperService } from '../services/result-scraper.service.js';
import { fetchTables } from './fetchTables.js';

interface UpdateResultsDependencies {
  fileService?: FileService;
  scraperService?: ResultScraperService;
  now?: () => Date;
  logger?: {
    info: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
}

const defaultLogger = {
  info: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/**
 * Parses DD.MM.YYYY date string to Date object
 */
function parseMatchDate(dateStr: string): Date | null {
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const year = parseInt(parts[2], 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month, day, 23, 59, 59); // End of match day
}

/**
 * Checks if a match needs result update
 */
function needsResultUpdate(match: Match, now: Date): boolean {
  // Already has result
  if (match['H-B'] && match['H-B'] !== '-') {
    return false;
  }

  // No match URL
  if (!match['Kamp URL']) {
    return false;
  }

  // Check if match date has passed
  const matchDate = parseMatchDate(match.Dato);
  if (!matchDate) {
    return false;
  }

  return matchDate < now;
}

/**
 * Main update function
 */
export async function updateResults(deps: UpdateResultsDependencies = {}): Promise<{
  updated: number;
  checked: number;
  total: number;
  affectedTournaments: Map<string, string>;
}> {
  const fileService = deps.fileService ?? new FileService();
  const scraperService = deps.scraperService ?? new ResultScraperService();
  const now = deps.now ?? (() => new Date());
  const logger = deps.logger ?? defaultLogger;

  logger.info('=== Updating match results ===\n');

  // Load existing matches
  const matches = fileService.loadMatches();
  logger.info(`Loaded ${matches.length} matches from terminliste.json`);

  // Find matches that need updating
  const currentDate = now();
  const matchesNeedingUpdate = matches.filter((m) => needsResultUpdate(m, currentDate));

  if (matchesNeedingUpdate.length === 0) {
    logger.info('No matches need result updates.');
    return { updated: 0, checked: 0, total: matches.length, affectedTournaments: new Map() };
  }

  logger.info(`Found ${matchesNeedingUpdate.length} matches needing result update:`);
  matchesNeedingUpdate.forEach((m) => {
    logger.info(`  - ${m.Dato} ${m.Tid}: ${m.Hjemmelag} vs ${m.Bortelag}`);
  });

  // Fetch results
  logger.info('\nFetching results from handball.no...');
  const urls = matchesNeedingUpdate.map((m) => m['Kamp URL']);
  const results = await scraperService.fetchMultipleResults(urls, (current, total) => {
    logger.info(`  Progress: ${current}/${total}`);
  });

  // Update matches with new results and track affected tournaments
  let updatedCount = 0;
  const affectedTournaments = new Map<string, string>();
  for (const match of matches) {
    const matchId = extractMatchId(match['Kamp URL']);
    if (matchId && results.has(matchId)) {
      const result = results.get(matchId)!;
      match['H-B'] = result.result;
      updatedCount++;
      logger.info(`  Updated: ${match.Hjemmelag} vs ${match.Bortelag} = ${result.result}`);
      if (match['Turnering URL'] && match.Turnering && !match.Turnering.toLowerCase().includes('cup')) {
        affectedTournaments.set(match['Turnering URL'], match.Turnering);
      }
    }
  }

  if (updatedCount > 0) {
    // Save updated matches
    fileService.saveMatches(matches);

    // Update metadata
    const metadata: Metadata = {
      lastUpdated: currentDate.toISOString(),
      teamsCount: new Set(matches.map((m) => m.Lag)).size,
      matchesCount: matches.length,
    };
    fileService.saveMetadata(metadata);

    logger.info(`\n=== Summary ===`);
    logger.info(`Updated ${updatedCount} match results`);
    logger.info(`Last updated: ${metadata.lastUpdated}`);
  } else {
    logger.info('\nNo new results found (matches may not have been played yet).');
  }

  return {
    updated: updatedCount,
    checked: matchesNeedingUpdate.length,
    total: matches.length,
    affectedTournaments,
  };
}

function extractMatchId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/matchid=(\d+)/);
  return match ? match[1] : null;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const result = await updateResults();
      console.log(`\nResults: Updated ${result.updated}/${result.checked} matches.`);

      // Only fetch tables for affected tournaments
      if (result.affectedTournaments.size > 0) {
        console.log(`\n📊 Oppdaterer ${result.affectedTournaments.size} berørte tabeller...`);
        const tableResult = await fetchTables(result.affectedTournaments);

        if (tableResult.failed > 0) {
          console.log(`\nTables: Updated ${tableResult.fetched}/${tableResult.total} tables (${tableResult.failed} failed)`);
        } else {
          console.log(`\nTables: Updated ${tableResult.fetched}/${tableResult.total} tables.`);
        }
      } else {
        console.log('\n📊 Ingen tabeller trenger oppdatering.');
      }

      process.exit(0);
    } catch (error) {
      console.error('Error updating:', error);
      process.exit(1);
    }
  })();
}
