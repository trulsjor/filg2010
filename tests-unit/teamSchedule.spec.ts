import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import {
  parseTeamSchedule,
  formatMatchDate,
  formatMatchTime,
  type ScheduledMatch,
} from '../src/handball/TeamSchedule.js'
import { HandballPayloadError } from '../src/handball/HandballPayloadReader.js'

const FIXTURE_DIR = path.join(process.cwd(), 'tests-unit', 'fixtures', 'handball-2026')

function loadFixture(name: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, name), 'utf-8'))
}

function findMatch(matches: ScheduledMatch[], matchNo: string): ScheduledMatch {
  const found = matches.find((m) => m.matchNo === matchNo)
  if (found === undefined) throw new Error(`Fant ikke kamp ${matchNo} i fixture`)
  return found
}

describe('formatMatchDate', () => {
  it('konverterer ISO-dato til norsk format', () => {
    expect(formatMatchDate('2025-09-21T00:00:00')).toBe('21.09.2025')
  })

  it('gir tom streng når dato mangler', () => {
    expect(formatMatchDate(null)).toBe('')
  })

  it('gir tom streng for nullstilt dato fra handball.no', () => {
    expect(formatMatchDate('0001-01-01T00:00:00')).toBe('')
  })
})

describe('formatMatchTime', () => {
  it('konverterer firesifret klokkeslett', () => {
    expect(formatMatchTime(1435)).toBe('14:35')
  })

  it('nullpadder klokkeslett før klokken ti', () => {
    expect(formatMatchTime(900)).toBe('09:00')
  })

  it('gir tom streng når klokkeslett mangler', () => {
    expect(formatMatchTime(null)).toBe('')
  })
})

describe('parseTeamSchedule', () => {
  const matches = parseTeamSchedule(loadFixture('terminliste-531500-201060.json'))

  it('leser alle kampene i terminlisten', () => {
    expect(matches).toHaveLength(21)
  })

  it('leser en spilt kamp med resultat, bane og tilskuere', () => {
    const match = findMatch(matches, '41031502009')

    expect(match).toMatchObject({
      matchId: '8231475',
      date: '21.09.2025',
      time: '14:35',
      homeTeamName: 'Nordstrand 2',
      awayTeamName: 'Fjellhammer',
      result: '13-32',
      venue: 'Nordstrand Arena 1',
      organizer: 'Nordstrand Idrettsforening',
      spectators: 125,
      tournamentName: 'Regionserien Gutter 15 - avd 32',
      tournamentId: '440238',
      round: 'Runde 2',
    })
  })

  it('bruker banenavn med nummer, ikke anleggsnavnet', () => {
    const match = findMatch(matches, '41031502009')

    expect(match.venue).toBe('Nordstrand Arena 1')
    expect(match.venue).not.toBe('Nordstrand Arena')
  })

  it('gir tomt resultat for kamp uten dato og måltall', () => {
    const match = findMatch(matches, '420315002')

    expect(match.date).toBe('')
    expect(match.result).toBe('')
  })

  it('leser lag-IDer slik at lenker kan bygges', () => {
    const match = findMatch(matches, '41031502009')

    expect(match.homeTeamId).toBe('682369')
    expect(match.awayTeamId).toBe('531500')
  })

  it('fjerner etterfølgende mellomrom i kampnummer', () => {
    for (const match of matches) {
      expect(match.matchNo).toBe(match.matchNo.trim())
      expect(match.matchNo.length).toBeGreaterThan(0)
    }
  })

  it('leser ny sesong uten spilte kamper', () => {
    const nextSeason = parseTeamSchedule(loadFixture('terminliste-558767-201068.json'))

    expect(nextSeason).toHaveLength(4)
    expect(nextSeason.every((m) => m.result === '')).toBe(true)
    expect(nextSeason.every((m) => m.tournamentName === 'iceserien G16 - Kval Pulje 12')).toBe(true)
  })
})

describe('parseTeamSchedule ved uventet svar', () => {
  it('feiler tydelig når svaret ikke er et objekt', () => {
    expect(() => parseTeamSchedule('noe annet')).toThrow(HandballPayloadError)
  })

  it('feiler tydelig når kamplisten mangler', () => {
    expect(() => parseTeamSchedule({})).toThrow(HandballPayloadError)
  })

  it('feiler tydelig når en kamp mangler påkrevd felt', () => {
    expect(() => parseTeamSchedule({ matches: [{ matchId: 1 }] })).toThrow(HandballPayloadError)
  })
})
