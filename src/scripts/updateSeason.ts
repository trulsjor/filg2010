import type { Match, Metadata, Season, Squad } from '../types/index.js'
import type { PlayerStatsData } from '../types/player-stats.js'
import { HandballHttpClient } from '../handball/HandballHttpClient.js'
import { HandballEndpoints } from '../handball/HandballEndpoints.js'
import { SeasonDataStore } from '../handball/SeasonDataStore.js'
import { SeasonDiscovery, selectPlayedMatches } from '../handball/SeasonDiscovery.js'
import { SeasonStatistics, selectMatchesToCollect } from '../handball/SeasonStatistics.js'
import { parseTeamSchedule } from '../handball/TeamSchedule.js'
import type { TeamTournament } from '../handball/TeamTournaments.js'
import { buildTournamentUrlLookup, toMatches } from '../handball/ScheduledMatchToMatch.js'
import { PlayerStatsAggregator } from '../handball/PlayerStatsAggregator.js'
import { rebuildPlayerCatalog } from '../handball/player-catalog.js'
import { sortMatchesByDate } from '../match/match-sorting.js'

const SKIP_STATS = process.argv.includes('--no-stats')
const ONLY_SQUAD = readArg('--squad')

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1 || index + 1 >= process.argv.length) return undefined
  return process.argv[index + 1]
}

function emptyStats(): PlayerStatsData {
  return { players: [], matchStats: [], matchesWithoutStats: [], lastUpdated: '' }
}

function isCupMatch(match: Match): boolean {
  return match.Kampnr.startsWith('pwcup-')
}

export async function updateSquad(
  squad: Squad,
  season: Season,
  store: SeasonDataStore,
  http: HandballHttpClient
): Promise<void> {
  const started = Date.now()
  console.log(`\n=== ${squad.name} — ${season.name} ===`)

  const teamIds = squad.teams.map((team) => team.lagid)
  const discovery = new SeasonDiscovery(http, (step, detail) =>
    console.log(`  [${step}] ${detail}`)
  )
  const tournaments = await discovery.discoverTournaments(teamIds, season.id)
  const tournamentUrls = buildTournamentUrlLookup(tournaments)
  console.log(`  [turneringer] ${tournaments.length}`)

  const endpoints = new HandballEndpoints()
  const ownMatches: Match[] = []
  for (const team of squad.teams) {
    const schedule = parseTeamSchedule(
      await http.fetchJson(endpoints.teamSchedule(team.lagid, season.id))
    )
    ownMatches.push(...toMatches(schedule, team, tournamentUrls))
    console.log(`  [terminliste] ${team.name}: ${schedule.length} kamper`)
  }

  const cupMatches = store.loadMatches(squad.id, season.slug).filter(isCupMatch)
  store.saveMatches(squad.id, season.slug, sortMatchesByDate([...ownMatches, ...cupMatches]))

  const tables = await discovery.fetchTables(tournaments)
  store.saveTables(squad.id, season.slug, tables)
  console.log(`  [tabeller] ${tables.length}`)

  const stats = SKIP_STATS
    ? (store.loadPlayerStats(squad.id, season.slug) ?? emptyStats())
    : await collectStatistics(squad, season, store, http, discovery, teamIds, tournaments)

  const players = rebuildPlayerCatalog(stats.matchStats)
  const withCatalog: PlayerStatsData = {
    ...stats,
    players,
    lastUpdated: new Date().toISOString(),
  }
  store.savePlayerStats(squad.id, season.slug, withCatalog)

  const aggregates = new PlayerStatsAggregator(withCatalog).generateAggregates()
  store.savePlayerAggregates(squad.id, season.slug, aggregates)
  console.log(`  [spillere] ${players.length} spillere, ${aggregates.aggregates.length} aggregater`)

  const metadata: Metadata = {
    lastUpdated: new Date().toISOString(),
    teamsCount: squad.teams.length,
    matchesCount: ownMatches.length + cupMatches.length,
  }
  store.saveMetadata(squad.id, season.slug, metadata)

  store.saveSeasonInfo({
    squadId: squad.id,
    squadName: squad.name,
    seasonId: season.id,
    seasonName: season.name,
    slug: season.slug,
    status: 'aktiv',
    lastUpdated: metadata.lastUpdated,
  })

  console.log(`  ferdig på ${((Date.now() - started) / 1000).toFixed(1)}s`)
}

async function collectStatistics(
  squad: Squad,
  season: Season,
  store: SeasonDataStore,
  http: HandballHttpClient,
  discovery: SeasonDiscovery,
  teamIds: string[],
  tournaments: TeamTournament[]
): Promise<PlayerStatsData> {
  const existing = store.loadPlayerStats(squad.id, season.slug) ?? emptyStats()
  const known = {
    withStats: new Set(existing.matchStats.map((match) => match.matchId)),
    withoutStats: new Set(existing.matchesWithoutStats),
  }

  const opponentIds = await discovery.discoverParticipants(tournaments, teamIds)
  const allMatches = await discovery.fetchAllSchedules([...teamIds, ...opponentIds], season.id)
  const played = selectPlayedMatches(allMatches)
  const toCollect = selectMatchesToCollect(played, known)
  console.log(`  [statistikk] ${played.length} spilte, ${toCollect.length} nye å hente`)

  if (toCollect.length === 0) return existing

  const collector = new SeasonStatistics(http, (done, total) => {
    if (done % 25 === 0 || done === total) console.log(`  [statistikk] ${done}/${total}`)
  })
  const collected = await collector.collect(toCollect)

  return {
    ...existing,
    matchStats: [...existing.matchStats, ...collected.matchStats],
    matchesWithoutStats: [...existing.matchesWithoutStats, ...collected.matchesWithoutStats],
  }
}

export async function updateAllSquads(): Promise<void> {
  const started = Date.now()
  const store = new SeasonDataStore()
  const config = store.loadConfig()
  const http = new HandballHttpClient()

  const squads = ONLY_SQUAD
    ? config.squads.filter((squad) => squad.id === ONLY_SQUAD)
    : config.squads

  if (squads.length === 0) {
    throw new Error(`Fant ingen kull å oppdatere${ONLY_SQUAD ? ` for --squad ${ONLY_SQUAD}` : ''}`)
  }

  for (const squad of squads) {
    await updateSquad(squad, config.currentSeason, store, http)
  }

  const manifest = store.saveManifest(config.currentSeason.slug)
  console.log(`\nSesonger i data/: ${manifest.seasons.length}`)
  for (const entry of manifest.seasons) {
    console.log(`  ${entry.squadId}/${entry.slug} (${entry.status})`)
  }
  console.log(`\n=== Ferdig på ${((Date.now() - started) / 1000).toFixed(1)}s ===\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllSquads()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Feil:', error)
      process.exit(1)
    })
}
