/**
 * Combined refresh script - fetches all data in one go
 * - Match data from API
 * - Match links from scraping
 * - Tournament links from scraping
 * - League tables from scraping
 *
 * All scraping uses a single browser instance with parallel execution
 */

import type { Team, Match, RawMatchData, Metadata } from '../types/index.js'
import { HandballScraperService } from '../services/handball-scraper.service.js'
import { HandballApiService } from '../services/handball-api.service.js'
import { FileService } from '../services/file.service.js'
import { sortMatchesByDate } from '../utils/date.utils.js'
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const TABLES_PATH = path.join(DATA_DIR, 'tables.json')

export async function refresh(): Promise<void> {
  const startTime = Date.now()
  console.log('=== Full data refresh ===\n')

  const fileService = new FileService()
  const apiService = new HandballApiService()
  const scraperService = new HandballScraperService()

  try {
    const config = fileService.loadConfig()
    const teams: Team[] = config.teams
    console.log(`Found ${teams.length} teams:`)
    teams.forEach((t) => console.log(`  - ${t.name}`))
    console.log('')

    fileService.ensureDataDirectory()

    // Step 1: Fetch API data and scrape in parallel
    console.log('Step 1: Fetching API data + scraping (parallel)...')

    const [apiDataPerTeam, scrapingResult] = await Promise.all([
      // API calls
      Promise.all(
        teams.map(async (team) => {
          try {
            const data = await apiService.fetchTeamSchedule(team)
            console.log(`  ✓ API: ${team.name} (${data.length} matches)`)
            return { team, data }
          } catch (error) {
            console.error(`  ✗ API: ${team.name} failed:`, error)
            return { team, data: [] as RawMatchData[] }
          }
        })
      ),
      // Scraping (teams + tables)
      scraperService.fullRefresh(teams, 3, (step, detail) => {
        console.log(`  ✓ ${step}: ${detail}`)
      }),
    ])

    // Step 2: Combine match data
    console.log('\nStep 2: Combining data...')
    const allMatches: Match[] = []

    for (const { team, data } of apiDataPerTeam) {
      const matchLinks = scrapingResult.matchLinksPerTeam.get(team.lagid) || new Map()

      for (const row of data) {
        const kampnr = String(row.Kampnr || '').trim()
        const links = matchLinks.get(kampnr)
        const turneringUrl = scrapingResult.allTournamentLinks.get(row.Turnering) || ''

        allMatches.push({
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
        })
      }
      console.log(`  ${team.name}: ${data.length} matches`)
    }

    // Step 3: Save everything
    console.log('\nStep 3: Saving data...')

    const sortedMatches = sortMatchesByDate(allMatches)
    fileService.saveMatches(sortedMatches)
    console.log(`  ✓ ${sortedMatches.length} matches saved`)

    const metadata: Metadata = {
      lastUpdated: new Date().toISOString(),
      teamsCount: teams.length,
      matchesCount: sortedMatches.length,
    }
    fileService.saveMetadata(metadata)
    console.log(`  ✓ Metadata saved`)

    // Save tables
    fs.writeFileSync(TABLES_PATH, JSON.stringify(scrapingResult.tables, null, 2), 'utf-8')
    console.log(`  ✓ ${scrapingResult.tables.length} tables saved`)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n=== Done in ${elapsed}s ===`)
    console.log(`Matches: ${sortedMatches.length}`)
    console.log(`Tables: ${scrapingResult.tables.length}`)
    console.log(`Teams: ${teams.map((t) => t.name).join(', ')}`)
  } finally {
    await scraperService.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  refresh()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}
