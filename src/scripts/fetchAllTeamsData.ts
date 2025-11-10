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

import type { Team, Match, MatchLink } from '../types/index.js';
import { ScraperService } from '../services/scraper.service.js';
import { HandballApiService } from '../services/handball-api.service.js';
import { FileService } from '../services/file.service.js';
import { sortMatchesByDate } from '../utils/date.utils.js';

// Re-export for backwards compatibility with tests
export { convertDateForSorting, sortMatchesByDate as sortMatches } from '../utils/date.utils.js';

/**
 * Main data fetching orchestrator
 */
export async function fetchAllTeamsData(): Promise<void> {
  // Initialize services
  const fileService = new FileService();
  const scraperService = new ScraperService();
  const apiService = new HandballApiService();

  try {
    console.log('=== Fetching data for all teams ===\n');

    // Load configuration
    const config = fileService.loadConfig();
    const teams: Team[] = config.teams;
    console.log(`Found ${teams.length} teams in config\n`);

    // Ensure data directory exists
    fileService.ensureDataDirectory();

    // Step 1: Scrape tournament links
    console.log('Step 1: Scraping tournament links from all team pages...');
    console.log('  Scraping tournament links from all team pages...');
    teams.forEach(team => {
      console.log(`    - ${team.name} (${team.lagid})`);
    });

    const tournamentMap = await scraperService.scrapeTournamentLinks(teams);
    console.log(`    Found ${tournamentMap.size} unique tournaments\n`);

    // Step 2: Fetch data for each team
    const allMatches: Match[] = [];

    for (const team of teams) {
      console.log(`Step 2: Fetching data for ${team.name} (lagid=${team.lagid})...`);

      // Fetch Excel data from API
      console.log(`  Fetching Excel from API...`);
      const jsonData = await apiService.fetchTeamSchedule(team);
      console.log(`  Loaded ${jsonData.length} matches from Excel`);

      // Scrape match links
      console.log(`  Scraping match links...`);
      const linkMap = await scraperService.scrapeMatchLinks(team.lagid);
      console.log(`  Found ${linkMap.size} match links`);

      // Combine data with scraped links
      const enhancedMatches = enhanceMatchesWithLinks(
        jsonData,
        team,
        linkMap,
        tournamentMap
      );

      allMatches.push(...enhancedMatches);
      console.log(`  Added ${enhancedMatches.length} matches for ${team.name}\n`);
    }

    // Step 3: Sort all matches
    const sortedMatches = sortMatchesByDate(allMatches);

    // Step 4: Save to files
    fileService.saveMatches(sortedMatches);

    const metadata = {
      lastUpdated: new Date().toISOString(),
      teamsCount: teams.length,
      matchesCount: sortedMatches.length,
    };
    fileService.saveMetadata(metadata);

    // Summary
    console.log('=== Summary ===');
    console.log(`Total matches: ${sortedMatches.length}`);
    console.log(`Teams: ${teams.map((t) => t.name).join(', ')}`);
    console.log(`Saved to: ${fileService.getMatchesPath()}`);
    console.log(`Last updated: ${metadata.lastUpdated}`);
  } catch (error) {
    console.error('Error fetching all teams data:', error);
    throw error;
  }
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
