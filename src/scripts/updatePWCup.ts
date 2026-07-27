import type { CupConfig, Match, Season, Squad } from '../types/index.js'
import type { LeagueTable } from '../handball/LeagueTable.js'
import { ProfixioScraper } from '../profixio/profixio-scraper.js'
import { profixioMatchToMatch, filterTeamMatches } from '../profixio/profixio-parser.js'
import { mergeCupMatches } from '../profixio/merge-cup-matches.js'
import { SeasonDataStore } from '../handball/SeasonDataStore.js'

function cupTableName(cup: CupConfig): string {
  return `${cup.name} - ${cup.groupName}`
}

function cupTableUrl(cup: CupConfig): string {
  return `https://www.profixio.com/app/${cup.tournamentSlug}/category/${cup.categoryId}/group/${cup.groupId}`
}

async function updateCup(
  cup: CupConfig,
  squad: Squad,
  season: Season,
  store: SeasonDataStore,
  scraper: ProfixioScraper
): Promise<void> {
  console.log(`\nCup: ${cup.name} (${squad.name})`)

  const { matches: groupMatches, table } = await scraper.scrapeGroupPage(cup)
  const playoffMatches = await scraper.scrapePlayoffPages(cup)

  const teamMatches = filterTeamMatches([...groupMatches, ...playoffMatches], cup)
  const converted: Match[] = teamMatches.map((match) => profixioMatchToMatch(match, cup))
  console.log(`  Egne kamper: ${converted.length}`)

  const existing = store.loadMatches(squad.id, season.slug)
  const merged = mergeCupMatches(existing, converted, cup.name)
  store.saveMatches(squad.id, season.slug, merged)
  console.log(`  Terminliste: ${merged.length} kamper totalt`)

  const cupTable: LeagueTable = {
    tournamentName: cupTableName(cup),
    tournamentUrl: cupTableUrl(cup),
    rows: table.map((row) => ({ ...row, withdrawn: false })),
    updatedAt: new Date().toISOString(),
  }

  const existingTables = store.loadTables(squad.id, season.slug)
  const otherTables = existingTables.filter((t) => t.tournamentName !== cupTable.tournamentName)
  store.saveTables(squad.id, season.slug, [...otherTables, cupTable])
  console.log(`  Tabell: ${table.length} lag i ${cup.groupName}`)
}

export async function updatePWCup(): Promise<void> {
  const started = Date.now()
  console.log('\n=== Cup-oppdatering ===')

  const store = new SeasonDataStore()
  const config = store.loadConfig()
  const scraper = new ProfixioScraper()

  try {
    let cupCount = 0
    for (const squad of config.squads) {
      for (const cup of squad.cups ?? []) {
        await updateCup(cup, squad, config.currentSeason, store, scraper)
        cupCount++
      }
    }

    if (cupCount === 0) {
      console.log('Ingen cuper konfigurert på noen kull')
      return
    }

    console.log(`\n=== Ferdig (${((Date.now() - started) / 1000).toFixed(1)}s) ===\n`)
  } finally {
    await scraper.close()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updatePWCup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Feil:', error)
      process.exit(1)
    })
}
