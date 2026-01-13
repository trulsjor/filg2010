/**
 * Script to fetch player statistics from all matches in our tournaments
 *
 * Features:
 *   - Caches match discovery to avoid re-scraping tournament/team pages
 *   - Saves progress incrementally (after each batch)
 *   - Resumes from where it left off if interrupted
 *
 * Options:
 *   --force                    Re-scrape ALL matches from scratch
 *   --refresh-matches          Re-discover matches (ignore cache)
 *   --rescrape <id1,id2,...>   Re-scrape specific match IDs
 *
 * Examples:
 *   npx tsx src/scripts/fetchPlayerStats.ts
 *   npx tsx src/scripts/fetchPlayerStats.ts --force
 *   npx tsx src/scripts/fetchPlayerStats.ts --refresh-matches
 *   npx tsx src/scripts/fetchPlayerStats.ts --rescrape 41031502009,41031502013
 */

import * as fs from 'fs'
import * as path from 'path'
import type { Team } from '../types/index.js'
import type { PlayerStatsData, Player, MatchPlayerData } from '../types/player-stats.js'
import { HandballScraper } from '../handball/handball-scraper.js'

const DATA_DIR = path.join(process.cwd(), 'data')
const CONFIG_PATH = path.join(process.cwd(), 'config.json')
const PLAYER_STATS_PATH = path.join(DATA_DIR, 'player-stats.json')
const MATCH_CACHE_PATH = path.join(DATA_DIR, 'match-cache.json') // Cache of discovered matches

// Parse arguments
function getRescrapeIds(): Set<string> {
  const idx = process.argv.indexOf('--rescrape')
  if (idx === -1 || !process.argv[idx + 1]) return new Set()
  return new Set(process.argv[idx + 1].split(',').map((id) => id.trim()))
}

const RESCRAPE_IDS = getRescrapeIds()
const FORCE = process.argv.includes('--force')
const REFRESH_MATCHES = process.argv.includes('--refresh-matches')

interface MatchCache {
  matches: Array<{ matchId: string; matchUrl: string }>
  lastUpdated: string
  tournaments: string[]
}

// Load or create match cache
function loadMatchCache(): MatchCache | null {
  if (REFRESH_MATCHES || !fs.existsSync(MATCH_CACHE_PATH)) return null
  try {
    const cache = JSON.parse(fs.readFileSync(MATCH_CACHE_PATH, 'utf-8')) as MatchCache
    // Cache is valid for 24 hours
    const cacheAge = Date.now() - new Date(cache.lastUpdated).getTime()
    if (cacheAge > 24 * 60 * 60 * 1000) {
      console.log('📋 Match-cache er utdatert, oppdaterer...\n')
      return null
    }
    return cache
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

async function discoverMatches(
  scraper: HandballScraper
): Promise<Array<{ matchId: string; matchUrl: string }>> {
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  const teams: Team[] = config.teams

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

  // Save to cache
  saveMatchCache(allMatches, [...allTournamentLinks.keys()])

  return allMatches
}

// Save stats incrementally
function saveStats(stats: PlayerStatsData) {
  fs.writeFileSync(PLAYER_STATS_PATH, JSON.stringify(stats, null, 2))
}

// Rebuild player catalog from match stats
function rebuildPlayerCatalog(matchStats: MatchPlayerData[]): Player[] {
  const playerMap = new Map<
    string,
    {
      id: string
      name: string
      jerseyNumber?: number
      teamCounts: Map<string, { teamName: string; count: number }>
    }
  >()

  for (const match of matchStats) {
    const processStats = (stats: typeof match.homeTeamStats, teamId: string, teamName: string) => {
      for (const stat of stats) {
        let player = playerMap.get(stat.playerId)
        if (!player) {
          player = {
            id: stat.playerId,
            name: stat.playerName,
            jerseyNumber: stat.jerseyNumber,
            teamCounts: new Map(),
          }
          playerMap.set(stat.playerId, player)
        }
        if (stat.jerseyNumber !== undefined) {
          player.jerseyNumber = stat.jerseyNumber
        }
        const tc = player.teamCounts.get(teamId)
        if (tc) tc.count++
        else player.teamCounts.set(teamId, { teamName, count: 1 })
      }
    }
    processStats(match.homeTeamStats, match.homeTeamId, match.homeTeamName)
    processStats(match.awayTeamStats, match.awayTeamId, match.awayTeamName)
  }

  return Array.from(playerMap.values()).map((p) => {
    const teamIds: string[] = []
    const teamNames: string[] = []
    let primaryTeamId = ''
    let primaryTeamName = ''
    let maxCount = 0
    for (const [teamId, data] of p.teamCounts) {
      teamIds.push(teamId)
      teamNames.push(data.teamName)
      if (data.count > maxCount) {
        maxCount = data.count
        primaryTeamId = teamId
        primaryTeamName = data.teamName
      }
    }
    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jerseyNumber,
      teamIds,
      teamNames,
      primaryTeamId,
      primaryTeamName,
    }
  })
}

async function main() {
  console.log('🏐 Henter spillerstatistikk...\n')

  // Load existing stats
  let existingStats: PlayerStatsData = {
    players: [],
    matchStats: [],
    matchesWithoutStats: [],
    lastUpdated: new Date().toISOString(),
  }

  if (fs.existsSync(PLAYER_STATS_PATH)) {
    try {
      existingStats = JSON.parse(fs.readFileSync(PLAYER_STATS_PATH, 'utf-8'))
      console.log(`📁 Eksisterende data: ${existingStats.matchStats.length} kamper\n`)
    } catch {
      console.log('⚠️ Kunne ikke lese eksisterende data\n')
    }
  }

  // Try to use cached match list
  let allMatches: Array<{ matchId: string; matchUrl: string }>
  const cache = loadMatchCache()

  const scraper = new HandballScraper()

  try {
    if (cache && !FORCE) {
      console.log(
        `📋 Bruker cachet kampliste (${cache.matches.length} kamper fra ${cache.tournaments.length} turneringer)\n`
      )
      allMatches = cache.matches
    } else {
      allMatches = await discoverMatches(scraper)
    }

    console.log(`\n📊 Totalt ${allMatches.length} spilte kamper funnet\n`)

    // Determine which matches to scrape
    const existingMatchIds = new Set(existingStats.matchStats.map((m) => m.matchId))
    const matchesWithoutStats = new Set(existingStats.matchesWithoutStats || [])
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
      existingStats.matchesWithoutStats = (existingStats.matchesWithoutStats || []).filter(
        (id) => !RESCRAPE_IDS.has(id)
      )
    } else {
      // Skip both already scraped AND matches known to have no stats
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

    // Scrape in batches and save progress after each batch
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

      // Add to existing stats
      existingStats.matchStats.push(...batchStats)
      existingStats.matchesWithoutStats = existingStats.matchesWithoutStats || []
      existingStats.matchesWithoutStats.push(...batchNoStats)

      // Rebuild player catalog and save after each batch
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

main().catch((err) => {
  console.error('❌ Feil:', err)
  process.exit(1)
})
