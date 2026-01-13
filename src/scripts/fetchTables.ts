/**
 * Script for fetching league tables from handball.no
 * Optimized to reuse browser instance across multiple tables
 */

import * as fs from 'fs'
import * as path from 'path'
import { TableScraperService, type LeagueTable } from '../handball/table-scraper.service.js'

interface Match {
  'Turnering URL'?: string
  Turnering?: string
}

const DATA_DIR = path.join(process.cwd(), 'data')
const TERMINLISTE_PATH = path.join(DATA_DIR, 'terminliste.json')
const TABLES_PATH = path.join(DATA_DIR, 'tables.json')

export interface FetchTablesResult {
  fetched: number
  failed: number
  total: number
  failedTournaments: string[]
}

export async function fetchTables(
  specificTournaments?: Map<string, string>
): Promise<FetchTablesResult> {
  const startTime = Date.now()
  console.log('🏆 Henter serietabeller...')

  let tournamentUrls: Map<string, string>

  if (specificTournaments && specificTournaments.size > 0) {
    tournamentUrls = specificTournaments
    console.log(`📋 Oppdaterer ${tournamentUrls.size} spesifikke turneringer`)
  } else {
    if (!fs.existsSync(TERMINLISTE_PATH)) {
      console.error('❌ terminliste.json ikke funnet')
      return { fetched: 0, failed: 0, total: 0, failedTournaments: [] }
    }

    const matches: Match[] = JSON.parse(fs.readFileSync(TERMINLISTE_PATH, 'utf-8'))

    // Get unique tournament URLs (excluding cups)
    tournamentUrls = new Map<string, string>()
    for (const match of matches) {
      if (match['Turnering URL'] && match.Turnering) {
        if (match.Turnering.toLowerCase().includes('cup')) {
          continue
        }
        tournamentUrls.set(match['Turnering URL'], match.Turnering)
      }
    }

    console.log(`📋 Fant ${tournamentUrls.size} turneringer (ekskludert cups)`)
  }

  const scraper = new TableScraperService()
  const failedTournaments: string[] = []

  try {
    const tables = await scraper.scrapeMultipleTables(tournamentUrls, 3, (current, total, name) => {
      console.log(`  ✓ [${current}/${total}] ${name}`)
    })

    // Check for failures
    const fetchedUrls = new Set(tables.map((t) => t.tournamentUrl))
    for (const [url, name] of tournamentUrls) {
      if (!fetchedUrls.has(url)) {
        failedTournaments.push(name)
      }
    }

    // Save tables
    let allTables = tables
    if (specificTournaments && specificTournaments.size > 0 && fs.existsSync(TABLES_PATH)) {
      const existingTables: LeagueTable[] = JSON.parse(fs.readFileSync(TABLES_PATH, 'utf-8'))
      const updatedUrls = new Set(tables.map((t) => t.tournamentUrl))
      const unchangedTables = existingTables.filter((t) => !updatedUrls.has(t.tournamentUrl))
      allTables = [...unchangedTables, ...tables]
    }

    fs.writeFileSync(TABLES_PATH, JSON.stringify(allTables, null, 2), 'utf-8')

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n💾 Lagret ${allTables.length} tabeller til ${TABLES_PATH}`)
    console.log(`⏱️  Tid: ${elapsed}s`)

    if (failedTournaments.length > 0) {
      console.warn(`\n⚠️ ${failedTournaments.length} turneringer feilet:`)
      failedTournaments.forEach((name) => console.warn(`  - ${name}`))
    }

    return {
      fetched: tables.length,
      failed: failedTournaments.length,
      total: tournamentUrls.size,
      failedTournaments,
    }
  } finally {
    await scraper.close()
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchTables()
    .then((result) => {
      if (result.failed > 0) {
        console.log(
          `\n⚠️ Ferdig med feil: Hentet ${result.fetched}/${result.total} tabeller (${result.failed} feilet)`
        )
        process.exit(1)
      } else {
        console.log(`\n✅ Ferdig! Hentet ${result.fetched}/${result.total} tabeller`)
        process.exit(0)
      }
    })
    .catch((error) => {
      console.error('❌ Feil:', error)
      process.exit(1)
    })
}
