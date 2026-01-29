import type { Team, Match, RawMatchData, Metadata, MatchLink } from '../types/index.js'
import type { PlayerStatsData } from '../types/player-stats.js'
import { HandballScraper } from '../handball/handball-scraper.js'
import { HandballApiService } from '../handball/handball-api.service.js'
import { FileService } from '../handball/file.service.js'
import { ResultScraperService } from '../handball/result-scraper.service.js'
import { sortMatchesByDate } from '../match/match-sorting.js'
import { combinePlayedMatches, type PlayedMatch } from '../update/combine-matches.js'
import { rebuildPlayerCatalog } from '../handball/player-catalog.js'
import { PlayerStatsService } from '../handball/PlayerStatsAggregator.js'
import {
  needsResultUpdate,
  extractMatchIdFromUrl,
  parseMatchIndexFile,
  type MatchIndex,
} from '../update/match-parsing.js'
import {
  createEmptySummary,
  finalizeSummary,
  type UpdateSummary,
} from '../update/update-summary.js'
import * as fs from 'fs'
import * as path from 'path'

interface MatchTeamNames {
  hjemmelag: string
  bortelag: string
}

type TeamMatchLinksMap = Map<string, Map<string, MatchLink>>

const DATA_DIR = path.join(process.cwd(), 'data')
const TABLES_PATH = path.join(DATA_DIR, 'tables.json')
const PLAYER_STATS_PATH = path.join(DATA_DIR, 'player-stats.json')
const MATCH_INDEX_PATH = path.join(DATA_DIR, 'match-index.json')
const UPDATE_SUMMARY_PATH = path.join(DATA_DIR, 'update-summary.json')
const AGGREGATES_PATH = path.join(DATA_DIR, 'player-aggregates.json')

function saveSummary(summary: UpdateSummary) {
  fs.writeFileSync(UPDATE_SUMMARY_PATH, JSON.stringify(summary, null, 2))
}

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag)
  if (idx !== -1 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1]
  }
  return undefined
}

const FORCE_STATS = process.argv.includes('--force-stats')
const FULL_DISCOVERY = process.argv.includes('--full')
const SINGLE_URL = getArgValue('--url')

function savePlayerStats(stats: PlayerStatsData) {
  fs.writeFileSync(PLAYER_STATS_PATH, JSON.stringify(stats, null, 2))
}

function generateAndSaveAggregates(stats: PlayerStatsData) {
  const service = new PlayerStatsService(stats)
  const aggregates = service.generateAggregates()
  fs.writeFileSync(AGGREGATES_PATH, JSON.stringify(aggregates, null, 2))
  console.log(`  Aggregater: ${aggregates.aggregates.length} spillere`)
}

function createInitialPlayerStats(): PlayerStatsData {
  return {
    players: [],
    matchStats: [],
    matchesWithoutStats: [],
    lastUpdated: new Date().toISOString(),
  }
}

const LEGACY_MATCH_CACHE_PATH = path.join(DATA_DIR, 'match-cache.json')

function migrateFromLegacyMatchCache(): MatchIndex {
  if (!fs.existsSync(LEGACY_MATCH_CACHE_PATH)) return {}

  try {
    const legacy = JSON.parse(fs.readFileSync(LEGACY_MATCH_CACHE_PATH, 'utf-8'))
    if (legacy.matches && Array.isArray(legacy.matches)) {
      const index: MatchIndex = {}
      for (const m of legacy.matches) {
        if (m.matchId && m.matchUrl) {
          index[m.matchId] = m.matchUrl
        }
      }
      console.log(`  Migrerte ${Object.keys(index).length} kamper fra match-cache.json`)
      return index
    }
  } catch {
    return {}
  }
  return {}
}

function loadMatchIndex(): MatchIndex {
  if (fs.existsSync(MATCH_INDEX_PATH)) {
    try {
      const content = fs.readFileSync(MATCH_INDEX_PATH, 'utf-8')
      return parseMatchIndexFile(content)
    } catch {
      return migrateFromLegacyMatchCache()
    }
  }
  return migrateFromLegacyMatchCache()
}

function saveMatchIndex(index: MatchIndex) {
  fs.writeFileSync(MATCH_INDEX_PATH, JSON.stringify(index, null, 2))
}

function updateMatchIndexFromScraping(
  matchLinksPerTeam: TeamMatchLinksMap,
  index: MatchIndex
): number {
  let newCount = 0
  for (const [, matchLinks] of matchLinksPerTeam) {
    for (const [kampnr, link] of matchLinks) {
      const cleanKampnr = kampnr.trim()
      if (link.kampUrl && !index[cleanKampnr]) {
        index[cleanKampnr] = link.kampUrl
        newCount++
      }
    }
  }
  return newCount
}

function populateMatchUrlsInTerminliste(matches: Match[], index: MatchIndex): number {
  let populated = 0
  for (const match of matches) {
    const cleanKampnr = match.Kampnr.trim()
    const url = index[cleanKampnr]
    if (!match['Kamp URL'] && url) {
      match['Kamp URL'] = url
      populated++
    }
  }
  return populated
}

async function handleSingleUrl(url: string): Promise<void> {
  const startTime = Date.now()
  console.log(`\n=== Enkeltkamp: ${url} ===\n`)

  const scraper = new HandballScraper()

  try {
    const matchId = extractMatchIdFromUrl(url)
    if (!matchId) {
      console.error('Ugyldig URL - kunne ikke finne matchid')
      process.exit(1)
    }

    console.log(`Henter spillerstatistikk for matchid=${matchId}...`)

    const stats = await scraper.scrapeMatchStats(url, matchId)

    if (!stats) {
      console.log('Ingen spillerstatistikk funnet for denne kampen')
      process.exit(0)
    }

    let existingStats = createInitialPlayerStats()
    if (fs.existsSync(PLAYER_STATS_PATH)) {
      try {
        existingStats = JSON.parse(fs.readFileSync(PLAYER_STATS_PATH, 'utf-8'))
        if (!existingStats.matchesWithoutStats) existingStats.matchesWithoutStats = []
      } catch {
        existingStats = createInitialPlayerStats()
      }
    }

    const existingIdx = existingStats.matchStats.findIndex((m) => m.matchId === matchId)
    if (existingIdx >= 0) {
      existingStats.matchStats[existingIdx] = stats
      console.log(`Oppdaterte eksisterende statistikk`)
    } else {
      existingStats.matchStats.push(stats)
      console.log(`La til ny spillerstatistikk`)
    }

    existingStats.players = rebuildPlayerCatalog(existingStats.matchStats)
    existingStats.lastUpdated = new Date().toISOString()
    savePlayerStats(existingStats)
    generateAndSaveAggregates(existingStats)

    const summary = createEmptySummary()
    summary.statsUpdated.push({
      kampnr: stats.matchId,
      hjemmelag: stats.homeTeamName,
      bortelag: stats.awayTeamName,
      resultat: `${stats.homeScore}-${stats.awayScore}`,
    })
    saveSummary(finalizeSummary(summary))

    console.log(
      `  ${stats.homeTeamName} ${stats.homeScore} - ${stats.awayScore} ${stats.awayTeamName}`
    )
    console.log(`  Spillere: ${stats.homeTeamStats.length + stats.awayTeamStats.length}`)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n=== Ferdig (${elapsed}s) ===\n`)
  } finally {
    await scraper.close()
  }
}

function parseAttendance(value: number | string | undefined): number | string | undefined {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return undefined
    }
    const parsed = parseInt(trimmed, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
    return trimmed
  }
  return undefined
}

function transformToMatch(
  team: Team,
  row: RawMatchData,
  links: MatchLink | undefined,
  turneringUrl: string | undefined
): Match {
  const arrangør = row.Arrangør
  if (typeof arrangør !== 'string') {
    throw new Error(`Invalid Arrangør for match ${row.Kampnr}`)
  }

  return {
    Lag: team.name,
    Dato: row.Dato,
    Tid: row.Tid,
    Kampnr: row.Kampnr,
    Hjemmelag: row.Hjemmelag,
    Bortelag: row.Bortelag,
    'H-B': row['H-B'],
    Bane: row.Bane,
    Tilskuere: parseAttendance(row.Tilskuere),
    Arrangør: arrangør,
    Turnering: row.Turnering,
    'Kamp URL': links?.kampUrl,
    'Hjemmelag URL': links?.hjemmelagUrl,
    'Bortelag URL': links?.bortelagUrl,
    'Turnering URL': turneringUrl,
  }
}

export async function refreshHandballData(): Promise<void> {
  const startTime = Date.now()
  const mode = FULL_DISCOVERY ? 'full' : 'quick'
  console.log(`\n=== Håndballoppdatering (${mode}) ===\n`)

  const fileService = new FileService()
  const apiService = new HandballApiService()
  const scraper = new HandballScraper()

  try {
    const config = fileService.loadConfig()
    const teams: Team[] = config.teams
    console.log(`Lag: ${teams.map((t) => t.name).join(', ')}\n`)

    fileService.ensureDataDirectory()

    const matchIndex = loadMatchIndex()
    const indexSizeBefore = Object.keys(matchIndex).length

    console.log('[1/3] Henter data fra handball.no...')

    const emptyMatchData: RawMatchData[] = []
    const [apiDataPerTeam, scrapingResult] = await Promise.all([
      Promise.all(
        teams.map(async (team) => {
          try {
            const data = await apiService.fetchTeamSchedule(team)
            return { team, data }
          } catch (error) {
            console.error(`  ✗ ${team.name}: ${error}`)
            return { team, data: emptyMatchData }
          }
        })
      ),
      scraper.fullRefresh(teams, 3, () => {}),
    ])

    const newFromScraping = updateMatchIndexFromScraping(
      scrapingResult.matchLinksPerTeam,
      matchIndex
    )

    const totalApiMatches = apiDataPerTeam.reduce((sum, { data }) => sum + data.length, 0)
    console.log(`  API: ${totalApiMatches} kamper`)
    console.log(`  Scraping: ${teams.length} lagssider, ${scrapingResult.tables.length} tabeller`)
    console.log(`  Match-index: ${Object.keys(matchIndex).length} kamper (+${newFromScraping} nye)`)

    const allMatches: Match[] = []

    for (const { team, data } of apiDataPerTeam) {
      const matchLinksForTeam = scrapingResult.matchLinksPerTeam.get(team.lagid)

      for (const row of data) {
        const links = matchLinksForTeam?.get(row.Kampnr.trim())
        const turneringUrl = scrapingResult.allTournamentLinks.get(row.Turnering)
        const match = transformToMatch(team, row, links, turneringUrl)
        allMatches.push(match)
      }
    }

    const sortedMatches = sortMatchesByDate(allMatches)
    const populatedCount = populateMatchUrlsInTerminliste(sortedMatches, matchIndex)

    const matchLookup = new Map<string, MatchTeamNames>()
    for (const match of sortedMatches) {
      matchLookup.set(match.Kampnr.trim(), {
        hjemmelag: match.Hjemmelag,
        bortelag: match.Bortelag,
      })
    }

    const summary = createEmptySummary()

    fs.writeFileSync(TABLES_PATH, JSON.stringify(scrapingResult.tables, null, 2), 'utf-8')

    console.log('\n[2/4] Oppdaterer kampresultater...')
    const now = new Date()
    const matchesNeedingResults = sortedMatches.filter((m) => needsResultUpdate(m, now))

    let resultsUpdated = 0
    if (matchesNeedingResults.length > 0) {
      console.log(`  Fant ${matchesNeedingResults.length} kamper som mangler resultat`)
      const resultScraper = new ResultScraperService()
      const urls = matchesNeedingResults
        .map((m) => m['Kamp URL'])
        .filter((url): url is string => typeof url === 'string')
      const results = await resultScraper.fetchMultipleResults(urls, (current, total) => {
        console.log(`  Henter resultat ${current}/${total}`)
      })

      for (const match of sortedMatches) {
        const matchId = extractMatchIdFromUrl(match['Kamp URL'])
        const result = matchId ? results.get(matchId) : undefined
        if (result) {
          match['H-B'] = result.result
          resultsUpdated++
          summary.resultsUpdated.push({
            kampnr: match.Kampnr.trim(),
            hjemmelag: match.Hjemmelag,
            bortelag: match.Bortelag,
            resultat: result.result,
          })
        }
      }
      console.log(`  Oppdaterte ${resultsUpdated} resultater`)
    } else {
      console.log(`  Alle kamper har resultater`)
    }

    fileService.saveMatches(sortedMatches)

    const metadata: Metadata = {
      lastUpdated: new Date().toISOString(),
      teamsCount: teams.length,
      matchesCount: sortedMatches.length,
    }
    fileService.saveMetadata(metadata)

    console.log('\n[3/4] Henter spilte kamper fra turneringene...')

    let tournamentPlayedMatches: PlayedMatch[]

    if (FULL_DISCOVERY) {
      let tournamentCount = 0
      const countTournamentStep = (step: string) => {
        if (step === 'tournament') {
          tournamentCount++
        }
      }
      tournamentPlayedMatches = await scraper.scrapeAllTournamentMatches(
        scrapingResult.allTournamentLinks,
        3,
        countTournamentStep
      )
      console.log(`  Full discovery: ${tournamentCount} turneringer via lagssider`)
    } else {
      tournamentPlayedMatches = await scraper.scrapeAllTournamentPlayedMatches(
        scrapingResult.allTournamentLinks,
        3,
        (name) => console.log(`  ${name}`)
      )
    }

    let newFromTournaments = 0
    for (const m of tournamentPlayedMatches) {
      if (!matchIndex[m.matchId]) {
        matchIndex[m.matchId] = m.matchUrl
        newFromTournaments++
      }
    }

    console.log(
      `  Fant ${tournamentPlayedMatches.length} spilte kamper (+${newFromTournaments} nye i index)`
    )

    if (Object.keys(matchIndex).length > indexSizeBefore) {
      saveMatchIndex(matchIndex)
    }

    console.log(`  Kamper i index: ${Object.keys(matchIndex).length}`)
    if (populatedCount > 0) {
      console.log(`  URL populert i terminliste: ${populatedCount}`)
    }

    console.log('\n[4/4] Oppdaterer spillerstatistikk...')

    let existingStats = createInitialPlayerStats()

    if (fs.existsSync(PLAYER_STATS_PATH) && !FORCE_STATS) {
      try {
        existingStats = JSON.parse(fs.readFileSync(PLAYER_STATS_PATH, 'utf-8'))
        if (!existingStats.matchesWithoutStats) {
          existingStats.matchesWithoutStats = []
        }
      } catch {
        console.log('  Kunne ikke lese eksisterende spillerdata')
      }
    }

    if (FORCE_STATS) {
      console.log('  --force-stats: Henter alt på nytt')
      existingStats.matchStats = []
      existingStats.matchesWithoutStats = []
    }

    const allPlayedMatches = combinePlayedMatches(tournamentPlayedMatches, sortedMatches)

    const existingMatchIds = new Set(existingStats.matchStats.map((m) => m.matchId))
    const matchesWithoutStats = new Set(existingStats.matchesWithoutStats)
    const matchesToScrape = allPlayedMatches.filter(
      (m) => !existingMatchIds.has(m.matchId) && !matchesWithoutStats.has(m.matchId)
    )

    console.log(`  Har statistikk: ${existingStats.matchStats.length} kamper`)
    console.log(`  Mangler: ${matchesToScrape.length} kamper`)

    if (matchesToScrape.length === 0) {
      console.log(`  Alt oppdatert!`)
    } else {
      console.log('')

      const BATCH_SIZE = 10
      let scraped = 0

      for (let i = 0; i < matchesToScrape.length; i += BATCH_SIZE) {
        const batch = matchesToScrape.slice(i, i + BATCH_SIZE)

        const { results: batchStats, noStats: batchNoStats } =
          await scraper.scrapeMultipleMatchStats(batch, 2, (current, _total, matchId) => {
            const globalProgress = scraped + current
            const percent = Math.round((globalProgress / matchesToScrape.length) * 100)
            const info = matchLookup.get(matchId)
            const matchDesc = info ? `${info.hjemmelag} vs ${info.bortelag}` : matchId
            console.log(
              `  [${percent}%] ${globalProgress}/${matchesToScrape.length} - ${matchDesc}`
            )
          })

        scraped += batch.length

        for (const stat of batchStats) {
          summary.statsUpdated.push({
            kampnr: stat.matchId,
            hjemmelag: stat.homeTeamName,
            bortelag: stat.awayTeamName,
            resultat: `${stat.homeScore}-${stat.awayScore}`,
          })
        }

        existingStats.matchStats.push(...batchStats)
        existingStats.matchesWithoutStats.push(...batchNoStats)

        existingStats.lastUpdated = new Date().toISOString()
        savePlayerStats(existingStats)
      }

      existingStats.players = rebuildPlayerCatalog(existingStats.matchStats)
      existingStats.lastUpdated = new Date().toISOString()
      savePlayerStats(existingStats)

      console.log(
        `  Lagret: ${existingStats.matchStats.length} kamper, ${existingStats.players.length} spillere`
      )
    }

    generateAndSaveAggregates(existingStats)

    saveSummary(finalizeSummary(summary))

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n=== Ferdig (${elapsed}s) ===\n`)
  } finally {
    await scraper.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const main = SINGLE_URL ? () => handleSingleUrl(SINGLE_URL) : refreshHandballData

  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Feil:', error)
      process.exit(1)
    })
}
