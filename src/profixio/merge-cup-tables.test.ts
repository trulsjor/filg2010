import { describe, it, expect } from 'vitest'
import { mergeCupTables } from './merge-cup-tables'
import type { LeagueTable } from '../handball/LeagueTable'
import type { CupConfig } from '../types/index'

const table = (tournamentName: string): LeagueTable => ({
  tournamentName,
  tournamentUrl: tournamentName,
  rows: [],
  updatedAt: '2026-08-02',
})

const cup = (name: string): CupConfig => ({
  name,
  source: 'profixio',
  tournamentSlug: 's',
  categoryId: 'c',
  groupId: 'g',
  groupName: 'G2010',
  playoffIds: [],
  teamName: 'Fjellhammer IL',
  teamTag: 'Fjellhammer G16 1',
  color: '#000',
})

const cups = [cup('Skjærgårdslekene Elite'), cup('Skjærgårdslekene Åpen')]

describe('mergeCupTables', () => {
  it('bevarer eksisterende cup-tabeller sammen med nye serietabeller', () => {
    const league = [table('Regionserien G16')]
    const existing = [
      table('Regionserien G16'),
      table('Skjærgårdslekene Elite - G2010'),
      table('Skjærgårdslekene Åpen - G2010'),
    ]

    const merged = mergeCupTables(league, existing, cups)

    expect(merged.map((t) => t.tournamentName)).toEqual([
      'Regionserien G16',
      'Skjærgårdslekene Elite - G2010',
      'Skjærgårdslekene Åpen - G2010',
    ])
  })

  it('tar ikke med serietabeller fra existing (kun cup-tabeller bevares)', () => {
    const league = [table('Ny serietabell')]
    const existing = [table('Gammel serietabell'), table('Skjærgårdslekene Elite - G2010')]

    const merged = mergeCupTables(league, existing, cups)

    expect(merged.map((t) => t.tournamentName)).toEqual([
      'Ny serietabell',
      'Skjærgårdslekene Elite - G2010',
    ])
  })

  it('gir bare serietabeller når kullet ikke har cuper', () => {
    const league = [table('Regionserien G16')]
    const existing = [table('Skjærgårdslekene Elite - G2010')]

    expect(mergeCupTables(league, existing, []).map((t) => t.tournamentName)).toEqual([
      'Regionserien G16',
    ])
  })
})
