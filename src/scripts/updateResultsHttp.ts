import type { Match, Metadata } from '../types/index.js'
import { FileService } from '../handball/file.service.js'
import { ResultFetcherService } from '../handball/result-fetcher.service.js'
import { fetchTablesHttp } from './fetchTablesHttp.js'

interface UpdateResultsDependencies {
  fileService?: FileService
  fetcherService?: ResultFetcherService
  now?: () => Date
  logger?: {
    info: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
  }
}

const defaultLogger = {
  info: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
}

function parseMatchDate(dateStr: string): Date | null {
  const parts = dateStr.split('.')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null

  return new Date(year, month, day, 23, 59, 59)
}

function needsResultUpdate(match: Match, now: Date): boolean {
  if (match['H-B'] && match['H-B'] !== '-') {
    return false
  }

  if (!match['Kamp URL']) {
    return false
  }

  const matchDate = parseMatchDate(match.Dato)
  if (!matchDate) {
    return false
  }

  return matchDate < now
}

export async function updateResultsHttp(deps: UpdateResultsDependencies = {}): Promise<{
  updated: number
  checked: number
  total: number
  affectedTournaments: Map<string, string>
}> {
  const fileService = deps.fileService ?? new FileService()
  const fetcherService = deps.fetcherService ?? new ResultFetcherService()
  const now = deps.now ?? (() => new Date())
  const logger = deps.logger ?? defaultLogger

  logger.info('=== Updating match results (HTTP) ===\n')

  const matches = fileService.loadMatches()
  logger.info(`Loaded ${matches.length} matches from terminliste.json`)

  const currentDate = now()
  const matchesNeedingUpdate = matches.filter((m) => needsResultUpdate(m, currentDate))

  if (matchesNeedingUpdate.length === 0) {
    logger.info('No matches need result updates.')
    return { updated: 0, checked: 0, total: matches.length, affectedTournaments: new Map() }
  }

  logger.info(`Found ${matchesNeedingUpdate.length} matches needing result update:`)
  matchesNeedingUpdate.forEach((m) => {
    logger.info(`  - ${m.Dato} ${m.Tid}: ${m.Hjemmelag} vs ${m.Bortelag}`)
  })

  logger.info('\nFetching results from handball.no (HTTP)...')
  const urls = matchesNeedingUpdate
    .map((m) => m['Kamp URL'])
    .filter((url): url is string => typeof url === 'string')
  const results = await fetcherService.fetchMultipleResults(urls, (current, total) => {
    logger.info(`  Progress: ${current}/${total}`)
  })

  let updatedCount = 0
  const affectedTournaments = new Map<string, string>()
  for (const match of matches) {
    const matchId = extractMatchId(match['Kamp URL'])
    if (matchId && results.has(matchId)) {
      const result = results.get(matchId)
      if (result) {
        match['H-B'] = result.result
        updatedCount++
        logger.info(`  Updated: ${match.Hjemmelag} vs ${match.Bortelag} = ${result.result}`)
        if (
          match['Turnering URL'] &&
          match.Turnering &&
          !match.Turnering.toLowerCase().includes('cup')
        ) {
          affectedTournaments.set(match['Turnering URL'], match.Turnering)
        }
      }
    }
  }

  if (updatedCount > 0) {
    fileService.saveMatches(matches)

    const metadata: Metadata = {
      lastUpdated: currentDate.toISOString(),
      teamsCount: new Set(matches.map((m) => m.Lag)).size,
      matchesCount: matches.length,
    }
    fileService.saveMetadata(metadata)

    logger.info(`\n=== Summary ===`)
    logger.info(`Updated ${updatedCount} match results`)
    logger.info(`Last updated: ${metadata.lastUpdated}`)
  } else {
    logger.info('\nNo new results found (matches may not have been played yet).')
  }

  return {
    updated: updatedCount,
    checked: matchesNeedingUpdate.length,
    total: matches.length,
    affectedTournaments,
  }
}

function extractMatchId(url: string | undefined): string | null {
  if (typeof url !== 'string') return null
  const match = url.match(/matchid=(\d+)/)
  return match ? match[1] : null
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ;(async () => {
    try {
      const result = await updateResultsHttp()
      console.log(`\nResults: Updated ${result.updated}/${result.checked} matches.`)

      if (result.affectedTournaments.size > 0) {
        console.log(`\n📊 Oppdaterer ${result.affectedTournaments.size} berørte tabeller...`)
        const tableResult = await fetchTablesHttp(result.affectedTournaments)

        if (tableResult.failed > 0) {
          console.log(
            `\nTables: Updated ${tableResult.fetched}/${tableResult.total} tables (${tableResult.failed} failed)`
          )
        } else {
          console.log(`\nTables: Updated ${tableResult.fetched}/${tableResult.total} tables.`)
        }
      } else {
        console.log('\n📊 Ingen tabeller trenger oppdatering.')
      }

      process.exit(0)
    } catch (error) {
      console.error('Error updating:', error)
      process.exit(1)
    }
  })()
}
