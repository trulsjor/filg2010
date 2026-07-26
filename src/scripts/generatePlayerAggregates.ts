import * as fs from 'fs'
import * as path from 'path'
import type { PlayerStatsData } from '../types/player-stats.js'
import { PlayerStatsAggregator } from '../handball/PlayerStatsAggregator.js'

const DATA_DIR = path.join(process.cwd(), 'data')
const PLAYER_STATS_PATH = path.join(DATA_DIR, 'player-stats.json')
const AGGREGATES_PATH = path.join(DATA_DIR, 'player-aggregates.json')

async function main() {
  console.log('📊 Genererer aggregert spillerstatistikk...\n')

  if (!fs.existsSync(PLAYER_STATS_PATH)) {
    console.error('❌ player-stats.json ikke funnet. Kjør npm run fetch-player-stats først.')
    process.exit(1)
  }

  const data: PlayerStatsData = JSON.parse(fs.readFileSync(PLAYER_STATS_PATH, 'utf-8'))
  console.log(`📁 Lastet ${data.matchStats.length} kamper med ${data.players.length} spillere\n`)

  const aggregator = new PlayerStatsAggregator(data)
  const aggregates = aggregator.generateAggregates()

  fs.writeFileSync(AGGREGATES_PATH, JSON.stringify(aggregates, null, 2))

  console.log(`💾 Lagret til ${AGGREGATES_PATH}`)
  console.log(`   - ${aggregates.aggregates.length} spillere med aggregert statistikk`)

  console.log('\n🏆 Toppscorere:')
  const topScorers = aggregates.aggregates.slice(0, 10)
  for (const player of topScorers) {
    const nr = player.jerseyNumber ? `#${player.jerseyNumber}` : ''
    console.log(`   ${player.totalGoals} mål - ${player.playerName} ${nr} (${player.teamName})`)
  }

  console.log('\n✅ Ferdig!')
}

main().catch((err) => {
  console.error('❌ Feil:', err)
  process.exit(1)
})
