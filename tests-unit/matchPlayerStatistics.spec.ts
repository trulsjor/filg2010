import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  parseMatchRosters,
  readTeamIdFromUrl,
  type PlayerMatchStats,
} from '../src/handball/MatchPlayerStatistics.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')
const html = fs.readFileSync(path.join(FIXTURE_DIR, 'kamp-8231616.html'), 'utf-8')

function findPlayer(players: PlayerMatchStats[], name: string): PlayerMatchStats {
  const found = players.find((p) => p.playerName === name)
  if (found === undefined) throw new Error(`Fant ikke spilleren ${name}`)
  return found
}

describe('readTeamIdFromUrl', () => {
  it('leser lagid fra lagurl', () => {
    expect(readTeamIdFromUrl('https://www.handball.no/system/kamper/lag/?lagid=812498')).toBe(
      '812498'
    )
  })

  it('gir tom streng når lagid mangler', () => {
    expect(readTeamIdFromUrl('https://www.handball.no/')).toBe('')
  })
})

describe('parseMatchRosters', () => {
  const rosters = parseMatchRosters(html)

  it('leser lagnavn og lag-IDer', () => {
    expect(rosters.homeTeamName).toBe('Fjellhammer 2')
    expect(rosters.awayTeamName).toBe('Gjerdrum 2')
    expect(rosters.homeTeamId).toBe('812498')
    expect(rosters.awayTeamId).toBe('779812')
  })

  it('leser begge troppene, ikke bare vårt eget lag', () => {
    expect(rosters.homeTeamStats).toHaveLength(12)
    expect(rosters.awayTeamStats).toHaveLength(11)
  })

  it('skiller spillemål fra sjumetermål', () => {
    const player = findPlayer(rosters.awayTeamStats, 'Benjamin Harp Andrews')

    expect(player.goals).toBe(2)
    expect(player.penaltyGoals).toBe(1)
  })

  it('lar målsummen stemme med kampresultatet', () => {
    const sum = (players: PlayerMatchStats[]): number =>
      players.reduce((total, p) => total + p.goals + p.penaltyGoals, 0)

    expect(sum(rosters.homeTeamStats)).toBe(31)
    expect(sum(rosters.awayTeamStats)).toBe(23)
  })

  it('bruker personId fra NHF som spiller-ID', () => {
    const player = findPlayer(rosters.homeTeamStats, 'Tobias Vaarnes Jørgensen')

    expect(player.playerId).toBe('7125498')
    expect(player.jerseyNumber).toBe(7)
    expect(player.goals).toBe(6)
    expect(player.teamId).toBe('812498')
  })

  it('skiller spillere som var i troppen fra dem som spilte', () => {
    const all = [...rosters.homeTeamStats, ...rosters.awayTeamStats]

    expect(all.filter((p) => p.hasPlayed).length).toBe(15)
    expect(all.filter((p) => !p.hasPlayed).length).toBe(8)
  })

  it('lagrer aldri fødselsdato', () => {
    const serialized = JSON.stringify(rosters)

    expect(serialized).not.toMatch(/birth/i)
    expect(serialized).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
    expect(serialized).not.toMatch(/\d{2}\.\d{2}\.(19|20)\d{2}/)
  })

  it('gir hver spiller en unik ID', () => {
    const all = [...rosters.homeTeamStats, ...rosters.awayTeamStats]
    const ids = new Set(all.map((p) => p.playerId))

    expect(ids.size).toBe(all.length)
  })
})
