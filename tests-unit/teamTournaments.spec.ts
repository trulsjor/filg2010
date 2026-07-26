import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseTeamTournaments, selectSeason } from '../src/handball/TeamTournaments.js'
import { HandballPayloadError } from '../src/handball/HandballPayloadReader.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')
const tournaments = parseTeamTournaments(
  JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, 'turneringer-531500.json'), 'utf-8'))
)

describe('parseTeamTournaments', () => {
  it('leser alle turneringene laget har deltatt i', () => {
    expect(tournaments.length).toBeGreaterThan(60)
  })

  it('leser turneringsnavn, id og lenke', () => {
    const regionserie = tournaments.find((t) => t.tournamentId === '440238')

    expect(regionserie).toMatchObject({
      name: 'Regionserien Gutter 15 - avd 32',
      seasonId: '201060',
      seasonName: 'Håndballsesongen 2025/2026',
      url: 'https://www.handball.no/system/kamper/turnering/?turnid=440238',
      hasPublicTable: true,
    })
  })

  it('markerer cup uten offentlig tabell', () => {
    const cup = tournaments.find((t) => t.tournamentId === '439013')

    expect(cup?.name).toBe('Mobile Regionscup G15')
    expect(cup?.hasPublicTable).toBe(false)
  })
})

describe('selectSeason', () => {
  it('plukker ut kun turneringene i valgt sesong', () => {
    const forrigeSesong = selectSeason(tournaments, '201060')

    expect(forrigeSesong).toHaveLength(3)
    expect(forrigeSesong.every((t) => t.seasonName === 'Håndballsesongen 2025/2026')).toBe(true)
  })

  it('gir tom liste for sesong laget ikke har deltatt i', () => {
    expect(selectSeason(tournaments, '999999')).toHaveLength(0)
  })
})

describe('parseTeamTournaments ved uventet svar', () => {
  it('feiler tydelig når svaret ikke er en liste', () => {
    expect(() => parseTeamTournaments({})).toThrow(HandballPayloadError)
  })

  it('feiler tydelig når turneringsobjektet mangler', () => {
    expect(() => parseTeamTournaments([{ tournamentLink: 'x' }])).toThrow(HandballPayloadError)
  })
})
