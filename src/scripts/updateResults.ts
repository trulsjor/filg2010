import type { Match, Metadata } from '../types/index.js'
import { FileService } from '../handball/file.service.js'
import { ResultScraperService } from '../handball/result-scraper.service.js'
import { fetchTables } from './fetchTables.js'

interface FileServiceLike {
  loadMatches(): Match[]
  saveMatches(matches: Match[]): void
  saveMetadata(metadata: Metadata): void
}

interface ScraperServiceLike {
  fetchMultipleResults(urls: string[]): Promise<Map<string, { matchId: string; result: string }>>
}

interface Logger {
  info: (...args: string[]) => void
  error: (...args: string[]) => void
}

interface UpdateResultsDependencies {
  fileService?: FileServiceLike
  scraperService?: ScraperServiceLike
  now?: () => Date
  logger?: Logger
}

const defaultLogger: Logger = {
  info: (...args: string[]) => console.log(...args),
  error: (...args: string[]) => console.error(...args),
}

function parseMatchDate(dateStr: string): Date | null {
  const parts = dateStr.split('.')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const monthIndex = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(monthIndex) || isNaN(year)) return null

  const END_OF_DAY_HOUR = 23
  const END_OF_DAY_MINUTE = 59
  const END_OF_DAY_SECOND = 59
  return new Date(year, monthIndex, day, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND)
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

export async function updateResults(deps: UpdateResultsDependencies = {}): Promise<{
  updated: number
  checked: number
  total: number
  affectedTournaments: Map<string, string>
}> {
  const fileService = deps.fileService ?? new FileService()
  const scraperService = deps.scraperService ?? new ResultScraperService()
  const now = deps.now ?? (() => new Date())
  const logger = deps.logger ?? defaultLogger

  logger.info('=== Updating match results ===\n')

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

  logger.info('\nFetching results from handball.no...')
  const urls = matchesNeedingUpdate
    .map((m) => m['Kamp URL'])
    .filter((url): url is string => typeof url === 'string')
  const results = await scraperService.fetchMultipleResults(urls, (current, total) => {
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
      const result = await updateResults()
      console.log(`\nResults: Updated ${result.updated}/${result.checked} matches.`)

      if (result.affectedTournaments.size > 0) {
        console.log(`\n📊 Oppdaterer ${result.affectedTournaments.size} berørte tabeller...`)
        const tableResult = await fetchTables(result.affectedTournaments)

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
