import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  SeasonStatistics,
  parseScore,
  selectMatchesToCollect,
  type HandballPageSource,
} from '../src/handball/SeasonStatistics.js'
import type { ScheduledMatch } from '../src/handball/TeamSchedule.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')
const matchHtml = fs.readFileSync(path.join(FIXTURE_DIR, 'kamp-8231616.html'), 'utf-8')

function scheduledMatch(overrides: Partial<ScheduledMatch> = {}): ScheduledMatch {
  return {
    matchId: '8231616',
    matchNo: '41031504004',
    tournamentId: '440240',
    tournamentName: 'Regionserien Gutter 15 - avd 42',
    homeTeamId: '812498',
    homeTeamName: 'Fjellhammer 2',
    awayTeamId: '779812',
    awayTeamName: 'Gjerdrum 2',
    date: '14.09.2025',
    time: '10:00',
    result: '31-23',
    venue: 'Fjellhamar Arena 2',
    organizer: 'Fjellhammer Idrettslag',
    spectators: 60,
    round: 'Runde 1',
    ...overrides,
  }
}

class FixedPageSource implements HandballPageSource {
  readonly requested: string[] = []

  constructor(private readonly html: string) {}

  fetchPage(url: string): Promise<string> {
    this.requested.push(url)
    return Promise.resolve(this.html)
  }
}

describe('parseScore', () => {
  it('leser hjemme- og bortemål', () => {
    expect(parseScore('31-23')).toEqual({ home: 31, away: 23 })
  })

  it('gir null for tomt resultat', () => {
    expect(parseScore('')).toEqual({ home: 0, away: 0 })
  })

  it('gir null for resultat som ikke er tall', () => {
    expect(parseScore('0-WO')).toEqual({ home: 0, away: 0 })
  })
})

describe('selectMatchesToCollect', () => {
  const played = [
    scheduledMatch({ matchNo: 'A' }),
    scheduledMatch({ matchNo: 'B' }),
    scheduledMatch({ matchNo: 'C' }),
  ]

  it('hopper over kamper vi allerede har statistikk for', () => {
    const valgt = selectMatchesToCollect(played, {
      withStats: new Set(['A']),
      withoutStats: new Set(),
    })

    expect(valgt.map((m) => m.matchNo)).toEqual(['B', 'C'])
  })

  it('hopper over kamper vi vet mangler statistikk', () => {
    const valgt = selectMatchesToCollect(played, {
      withStats: new Set(['A']),
      withoutStats: new Set(['B']),
    })

    expect(valgt.map((m) => m.matchNo)).toEqual(['C'])
  })

  it('tar alt når vi ikke har noe fra før', () => {
    const valgt = selectMatchesToCollect(played, {
      withStats: new Set(),
      withoutStats: new Set(),
    })

    expect(valgt).toHaveLength(3)
  })
})

describe('SeasonStatistics', () => {
  it('setter sammen kampdata fra terminliste og lagoppstilling', async () => {
    const source = new FixedPageSource(matchHtml)
    const collected = await new SeasonStatistics(source).collect([scheduledMatch()])

    expect(collected.matchStats).toHaveLength(1)
    expect(collected.matchesWithoutStats).toHaveLength(0)

    const match = collected.matchStats[0]
    expect(match).toMatchObject({
      matchId: '41031504004',
      matchDate: '14.09.2025',
      homeTeamName: 'Fjellhammer 2',
      awayTeamName: 'Gjerdrum 2',
      homeScore: 31,
      awayScore: 23,
      tournament: 'Regionserien Gutter 15 - avd 42',
    })
    expect(match.homeTeamStats).toHaveLength(12)
    expect(match.awayTeamStats).toHaveLength(11)
  })

  it('bruker kampnummer som id, ikke intern matchId', async () => {
    const collected = await new SeasonStatistics(new FixedPageSource(matchHtml)).collect([
      scheduledMatch(),
    ])

    expect(collected.matchStats[0].matchId).toBe('41031504004')
  })

  it('henter kampsiden ut fra intern matchId', async () => {
    const source = new FixedPageSource(matchHtml)
    await new SeasonStatistics(source).collect([scheduledMatch()])

    expect(source.requested).toEqual([
      'https://www.handball.no/system/kamper/kamp/?matchid=8231616',
    ])
  })

  it('melder fra om framdrift per kamp', async () => {
    const framdrift: string[] = []
    await new SeasonStatistics(new FixedPageSource(matchHtml), (n, total, match) =>
      framdrift.push(`${n}/${total} ${match.matchNo}`)
    ).collect([scheduledMatch({ matchNo: 'A' }), scheduledMatch({ matchNo: 'B' })])

    expect(framdrift).toEqual(['1/2 A', '2/2 B'])
  })

  it('registrerer kamp uten lagoppstilling som uten statistikk', async () => {
    const tomKampside = matchHtml.replace(/:home-players='\[[\s\S]*?\]'/, ":home-players='[]'")
    const utenBorte = tomKampside.replace(/:away-players='\[[\s\S]*?\]'/, ":away-players='[]'")

    const collected = await new SeasonStatistics(new FixedPageSource(utenBorte)).collect([
      scheduledMatch(),
    ])

    expect(collected.matchStats).toHaveLength(0)
    expect(collected.matchesWithoutStats).toEqual(['41031504004'])
  })
})
