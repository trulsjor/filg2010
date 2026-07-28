import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseTournamentTeams } from '../src/handball/TournamentTeams.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')

function loadHtml(name: string): string {
  return fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf-8')
}

describe('parseTournamentTeams med publisert tabell', () => {
  const teams = parseTournamentTeams(loadHtml('turnering-440238.html'))

  it('finner alle lagene i puljen', () => {
    expect(teams).toHaveLength(10)
  })

  it('leser lag-ID og navn', () => {
    expect(teams).toContainEqual({ teamId: '997528', teamName: 'Kråkerøy' })
    expect(teams).toContainEqual({ teamId: '531500', teamName: 'Fjellhammer' })
  })

  it('tar med trukne lag', () => {
    expect(teams.map((t) => t.teamId)).toContain('817221')
  })
})

describe('parseTournamentTeams uten publisert tabell', () => {
  const teams = parseTournamentTeams(loadHtml('turnering-449420-uten-tabell.html'))

  it('finner lagene fra lenkene i stedet', () => {
    expect(teams).toHaveLength(5)
  })

  it('leser lag-ID og navn fra lenkene', () => {
    expect(teams).toContainEqual({ teamId: '558767', teamName: 'Fjellhammer' })
    expect(teams).toContainEqual({ teamId: '611598', teamName: 'Tromsø' })
  })

  it('tar ikke med lenkemalen med lagid null', () => {
    expect(teams.map((t) => t.teamId)).not.toContain('0')
  })
})

describe('parseTournamentTeams uten lag', () => {
  it('gir tom liste når siden ikke har lag', () => {
    expect(parseTournamentTeams('<html><body>Ingenting</body></html>')).toEqual([])
  })
})
