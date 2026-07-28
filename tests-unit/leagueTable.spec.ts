import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseLeagueTable, parseTournamentName } from '../src/handball/LeagueTable.js'
import { HandballPayloadError } from '../src/handball/HandballPayloadReader.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')
const TOURNAMENT_URL = 'https://www.handball.no/system/kamper/turnering/?turnid=440238'
const UPDATED_AT = '2026-07-26T12:00:00.000Z'

const html = fs.readFileSync(path.join(FIXTURE_DIR, 'turnering-440238.html'), 'utf-8')

describe('parseTournamentName', () => {
  it('henter navnet fra sidetittelen, ikke fra h1', () => {
    expect(parseTournamentName(html)).toBe(
      'Regionserien Gutter 15 - avd 32, Håndballsesongen 2025/2026'
    )
  })

  it('gir aldri det generiske h1-navnet', () => {
    expect(parseTournamentName(html)).not.toBe('Turnering')
  })
})

describe('parseLeagueTable', () => {
  const table = parseLeagueTable(html, TOURNAMENT_URL, UPDATED_AT)

  it('leser hele tabellen', () => {
    expect(table).not.toBeNull()
    expect(table?.rows).toHaveLength(10)
    expect(table?.tournamentUrl).toBe(TOURNAMENT_URL)
    expect(table?.updatedAt).toBe(UPDATED_AT)
  })

  it('leser tabelltoppen med riktige tall', () => {
    expect(table?.rows[0]).toEqual({
      position: 1,
      team: 'Kråkerøy',
      played: 8,
      won: 7,
      drawn: 0,
      lost: 1,
      goalsFor: 202,
      goalsAgainst: 149,
      points: 14,
      withdrawn: false,
    })
  })

  it('markerer trukket lag i stedet for å endre lagnavnet', () => {
    const withdrawn = table?.rows.filter((row) => row.withdrawn)

    expect(withdrawn).toHaveLength(1)
    expect(withdrawn?.[0].team).toBe('Ski/Langhus 2')
    expect(withdrawn?.[0].team).not.toContain('Trukket')
  })

  it('plasserer trukket lag sist når det mangler plassering', () => {
    const withdrawn = table?.rows.find((row) => row.withdrawn)

    expect(withdrawn?.position).toBe(10)
  })

  it('fjerner mellomrom rundt lagnavn', () => {
    for (const row of table?.rows ?? []) {
      expect(row.team).toBe(row.team.trim())
    }
  })

  it('gir sammenhengende plasseringer', () => {
    expect(table?.rows.map((row) => row.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})

describe('parseLeagueTable ved uventet innhold', () => {
  it('feiler tydelig når tabellkomponenten mangler', () => {
    expect(() =>
      parseLeagueTable('<html><title>Tom</title></html>', TOURNAMENT_URL, UPDATED_AT)
    ).toThrow(HandballPayloadError)
  })
})
