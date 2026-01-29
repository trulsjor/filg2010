import * as fs from 'fs'
import * as path from 'path'
import type { Team } from '../types/index.js'
import type { PlayerStatsData } from '../types/player-stats.js'
import { HandballScraper } from '../handball/handball-scraper.js'
import { rebuildPlayerCatalog } from '../handball/player-catalog.js'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONFIG_PATH = path.join(process.cwd(), 'config.json')
const PLAYER_STATS_PATH = path.join(DATA_DIR, 'player-stats.json')
const MATCH_CACHE_PATH = path.join(DATA_DIR, 'match-cache.json')
const TERMINLISTE_PATH = path.join(DATA_DIR, 'terminliste.json')

function extractRescrapeIdsFromArgs(): Set<string> {
  const idx = process.argv.indexOf('--rescrape')
  if (idx === -1 || !process.argv[idx + 1]) return new Set()
  return new Set(process.argv[idx + 1].split(',').map((id) => id.trim()))
}

const RESCRAPE_IDS = extractRescrapeIdsFromArgs()
const FORCE = process.argv.includes('--force')
const REFRESH_MATCHES = process.argv.includes('--refresh-matches')
const QUICK = process.argv.includes('--quick')

interface MatchCache {
  matches: Array<{ matchId: string; matchUrl: string }>
  lastUpdated: string
  tournaments: string[]
}

interface TerminlisteMatch {
  Kampnr: string
  'Kamp URL'?: string
  'H-B'?: string
}

function isTerminlisteMatchArray(data: unknown): data is TerminlisteMatch[] {
  if (!Array.isArray(data)) return false
  return data.every((item) => typeof item === 'object' && item !== null && 'Kampnr' in item)
}

function isValidMatchCache(data: unknown): data is MatchCache {
  if (typeof data !== 'object' || data === null) return false
  if (!('matches' in data) || !('lastUpdated' in data) || !('tournaments' in data)) return false
  return (
    Array.isArray(data.matches) &&
    typeof data.lastUpdated === 'string' &&
    Array.isArray(data.tournaments)
  )
}

function findMatchesFromLocalData(): Array<{ matchId: string; matchUrl: string }> {
  const uniqueMatches = new Map<string, { matchId: string; matchUrl: string }>()

  if (fs.existsSync(TERMINLISTE_PATH)) {
    const parsed: unknown = JSON.parse(fs.readFileSync(TERMINLISTE_PATH, 'utf-8'))
    if (!isTerminlisteMatchArray(parsed)) return Array.from(uniqueMatches.values())
    for (const match of parsed) {
      const score = match['H-B']
      const hasScore = score && score.trim() !== '' && score.trim() !== '-' && score.includes('-')
      if (hasScore && match['Kamp URL']) {
        uniqueMatches.set(match.Kampnr, {
          matchId: match.Kampnr,
          matchUrl: match['Kamp URL'],
        })
      }
    }
    console.log(`  📄 terminliste.json: ${uniqueMatches.size} spilte kamper`)
  }

  if (fs.existsSync(MATCH_CACHE_PATH)) {
    const parsed: unknown = JSON.parse(fs.readFileSync(MATCH_CACHE_PATH, 'utf-8'))
    if (isValidMatchCache(parsed)) {
      let added = 0
      for (const match of parsed.matches) {
        if (!uniqueMatches.has(match.matchId)) {
          uniqueMatches.set(match.matchId, match)
          added++
        }
      }
      console.log(`  📋 match-cache.json: ${added} ekstra kamper fra turneringene`)
    }
  } else {
    console.log(
      '  ⚠️  match-cache.json ikke funnet - kjør full fetch først for å oppdage alle kamper'
    )
  }

  return Array.from(uniqueMatches.values())
}

const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000

function loadMatchCache(): MatchCache | null {
  if (REFRESH_MATCHES || !fs.existsSync(MATCH_CACHE_PATH)) return null
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(MATCH_CACHE_PATH, 'utf-8'))
    if (!isValidMatchCache(parsed)) return null
    const cacheAge = Date.now() - new Date(parsed.lastUpdated).getTime()
    if (cacheAge > CACHE_VALIDITY_MS) {
      console.log('📋 Match-cache er utdatert, oppdaterer...\n')
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function saveMatchCache(
  matches: Array<{ matchId: string; matchUrl: string }>,
  tournaments: string[]
) {
  const cache: MatchCache = {
    matches,
    lastUpdated: new Date().toISOString(),
    tournaments,
  }
  fs.writeFileSync(MATCH_CACHE_PATH, JSON.stringify(cache, null, 2))
}

interface Config {
  teams: Team[]
}

function isValidConfig(data: unknown): data is Config {
  if (typeof data !== 'object' || data === null) return false
  if (!('teams' in data)) return false
  return Array.isArray(data.teams)
}

async function discoverMatches(
  scraper: HandballScraper
): Promise<Array<{ matchId: string; matchUrl: string }>> {
  const parsed: unknown = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  if (!isValidConfig(parsed)) {
    throw new Error('Invalid config.json format')
  }
  const teams = parsed.teams

  console.log(`🔍 Henter turneringer fra ${teams.length} lag...\n`)

  const allTournamentLinks = new Map<string, string>()

  for (const team of teams) {
    const result = await scraper.scrapeTeamPage(team)
    console.log(`  ✓ ${team.name}`)
    for (const [name, url] of result.tournamentLinks) {
      if (!allTournamentLinks.has(name)) {
        allTournamentLinks.set(name, url)
      }
    }
  }

  console.log(`\n📋 Fant ${allTournamentLinks.size} turneringer:\n`)
  for (const [name] of allTournamentLinks) {
    console.log(`   - ${name}`)
  }

  console.log(`\n🔄 Henter kampliste fra alle lag...\n`)

  const allMatches = await scraper.scrapeAllTournamentMatches(
    allTournamentLinks,
    3,
    (step, detail) => {
      if (step === 'tournament') console.log(`\n📋 ${detail}`)
      else if (step === 'teams') console.log(`   ${detail}`)
      else if (step === 'info') console.log(`\n📊 ${detail}`)
      else if (step === 'team') console.log(`   ✓ ${detail}`)
      else if (step === 'error') console.log(`   ❌ ${detail}`)
      else if (step === 'warning') console.log(`\n⚠️  ${detail}`)
      else if (step === 'done') console.log(`\n✅ ${detail}`)
    }
  )

  saveMatchCache(allMatches, [...allTournamentLinks.keys()])

  return allMatches
}

function saveStats(stats: PlayerStatsData) {
  fs.writeFileSync(PLAYER_STATS_PATH, JSON.stringify(stats, null, 2))
}

function isValidPlayerStatsData(data: unknown): data is PlayerStatsData {
  if (typeof data !== 'object' || data === null) return false
  if (!('players' in data) || !('matchStats' in data) || !('lastUpdated' in data)) return false
  return Array.isArray(data.players) && Array.isArray(data.matchStats)
}

function createEmptyPlayerStats(): PlayerStatsData {
  return {
    players: [],
    matchStats: [],
    matchesWithoutStats: [],
    lastUpdated: new Date().toISOString(),
  }
}

function ensureMatchesWithoutStats(stats: PlayerStatsData): PlayerStatsData {
  if (!stats.matchesWithoutStats) {
    return { ...stats, matchesWithoutStats: [] }
  }
  return stats
}

async function main() {
  console.log('🏐 Henter spillerstatistikk...\n')

  let existingStats = createEmptyPlayerStats()

  if (fs.existsSync(PLAYER_STATS_PATH)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(PLAYER_STATS_PATH, 'utf-8'))
      if (isValidPlayerStatsData(parsed)) {
        existingStats = ensureMatchesWithoutStats(parsed)
        console.log(`📁 Eksisterende data: ${existingStats.matchStats.length} kamper\n`)
      }
    } catch {
      console.log('⚠️ Kunne ikke lese eksisterende data\n')
    }
  }

  let allMatches: Array<{ matchId: string; matchUrl: string }>

  const scraper = new HandballScraper()

  try {
    if (QUICK) {
      console.log('⚡ Quick mode: Bruker lokale data for kampoppdagelse\n')
      allMatches = findMatchesFromLocalData()
    } else {
      const cache = loadMatchCache()
      if (cache && !FORCE) {
        console.log(
          `📋 Bruker cachet kampliste (${cache.matches.length} kamper fra ${cache.tournaments.length} turneringer)\n`
        )
        allMatches = cache.matches
      } else {
        allMatches = await discoverMatches(scraper)
      }
    }

    console.log(`\n📊 Totalt ${allMatches.length} spilte kamper funnet\n`)

    const existingMatchIds = new Set(existingStats.matchStats.map((m) => m.matchId))
    const matchesWithoutStats = new Set(existingStats.matchesWithoutStats)
    let matchesToScrape: Array<{ matchId: string; matchUrl: string }>

    if (FORCE) {
      console.log('⚠️  FORCE: Re-scraper ALLE kampstatistikker\n')
      matchesToScrape = allMatches
      existingStats.matchStats = []
      existingStats.matchesWithoutStats = []
    } else if (RESCRAPE_IDS.size > 0) {
      console.log(`🔄 Re-scraper ${RESCRAPE_IDS.size} spesifikke kamper\n`)
      matchesToScrape = allMatches.filter((m) => RESCRAPE_IDS.has(m.matchId))
      existingStats.matchStats = existingStats.matchStats.filter(
        (m) => !RESCRAPE_IDS.has(m.matchId)
      )
      existingStats.matchesWithoutStats = existingStats.matchesWithoutStats.filter(
        (id) => !RESCRAPE_IDS.has(id)
      )
    } else {
      matchesToScrape = allMatches.filter(
        (m) => !existingMatchIds.has(m.matchId) && !matchesWithoutStats.has(m.matchId)
      )
    }

    if (matchesToScrape.length === 0) {
      console.log('✅ Alle kampstatistikker er allerede hentet!\n')
      await scraper.close()
      return
    }

    console.log(`🔄 Henter statistikk for ${matchesToScrape.length} kamper...\n`)

    const BATCH_SIZE = 10
    let scraped = 0

    for (let i = 0; i < matchesToScrape.length; i += BATCH_SIZE) {
      const batch = matchesToScrape.slice(i, i + BATCH_SIZE)

      const { results: batchStats, noStats: batchNoStats } = await scraper.scrapeMultipleMatchStats(
        batch,
        2,
        (current, _total, matchId) => {
          const globalProgress = scraped + current
          const percent = Math.round((globalProgress / matchesToScrape.length) * 100)
          console.log(
            `  [${percent}%] ${globalProgress}/${matchesToScrape.length} - Kamp ${matchId}`
          )
        }
      )

      scraped += batch.length

      existingStats.matchStats.push(...batchStats)
      existingStats.matchesWithoutStats.push(...batchNoStats)

      existingStats.players = rebuildPlayerCatalog(existingStats.matchStats)
      existingStats.lastUpdated = new Date().toISOString()
      saveStats(existingStats)

      console.log(
        `  💾 Lagret (${existingStats.matchStats.length} kamper + ${existingStats.matchesWithoutStats.length} uten stats)\n`
      )
    }

    console.log(
      `\n✅ Ferdig! ${existingStats.matchStats.length} kamper, ${existingStats.players.length} spillere\n`
    )
  } finally {
    await scraper.close()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Feil:', err)
    process.exit(1)
  })
