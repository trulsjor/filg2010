import type { Match, Metadata } from '../types/index.js'
import type { LeagueTable } from '../handball/handball-scraper.js'
import { ProfixioScraper } from '../profixio/profixio-scraper.js'
import { profixioMatchToMatch, filterTeamMatches } from '../profixio/profixio-parser.js'
import { mergeCupMatches } from '../profixio/merge-cup-matches.js'
import { FileService } from '../handball/file.service.js'

export async function updatePWCup(): Promise<void> {
  const startTime = Date.now()
  console.log('\n=== Peter Wessel Cup oppdatering ===\n')

  const fileService = new FileService()
  const scraper = new ProfixioScraper()

  try {
    const config = fileService.loadConfig()
    const cups = config.cups ?? []

    if (cups.length === 0) {
      console.log('Ingen cup-konfigurasjoner funnet i config.json')
      return
    }

    for (const cupConfig of cups) {
      console.log(`Cup: ${cupConfig.name}`)
      console.log(`  Lag: ${cupConfig.teamName} → ${cupConfig.teamTag}\n`)

      const { matches: groupMatches, table } = await scraper.scrapeGroupPage(cupConfig)
      const playoffMatches = await scraper.scrapePlayoffPages(cupConfig)

      const allMatches = [...groupMatches, ...playoffMatches]
      const teamMatches = filterTeamMatches(allMatches, cupConfig)
      const convertedMatches: Match[] = teamMatches.map((m) => profixioMatchToMatch(m, cupConfig))

      console.log(`\n  Fjellhammer-kamper: ${convertedMatches.length}`)

      const existingMatches = fileService.loadMatches()
      const merged = mergeCupMatches(existingMatches, convertedMatches, cupConfig.name)
      fileService.saveMatches(merged)
      console.log(`  Terminliste: ${merged.length} kamper totalt`)

      const cupTableName = `${cupConfig.name} - ${cupConfig.groupName}`
      const cupTable: LeagueTable = {
        tournamentName: cupTableName,
        tournamentUrl: `https://www.profixio.com/app/${cupConfig.tournamentSlug}/category/${cupConfig.categoryId}/group/${cupConfig.groupId}`,
        rows: table.map((r) => ({
          position: r.position,
          team: r.team,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          points: r.points,
        })),
        updatedAt: new Date().toISOString(),
      }

      const existingTables = fileService.loadTables()
      const otherTables = existingTables.filter((t) => t.tournamentName !== cupTableName)
      fileService.saveTables([...otherTables, cupTable])
      console.log(`  Tabell: ${table.length} lag i ${cupConfig.groupName}`)

      const metadata: Metadata = {
        lastUpdated: new Date().toISOString(),
        teamsCount: config.teams.length,
        matchesCount: merged.length,
      }
      fileService.saveMetadata(metadata)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`\n=== Ferdig (${elapsed}s) ===\n`)
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
