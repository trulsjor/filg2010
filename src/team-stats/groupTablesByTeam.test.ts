import { describe, it, expect } from 'vitest'
import { groupTablesByTeam } from './groupTablesByTeam'
import type { LeagueTable } from '../components/LeagueTableCard'
import type { CupConfig, Team } from '../types'

const team = (name: string): Team => ({ name, lagid: name, color: '#000' })

const cup = (name: string, teamTag: string): CupConfig => ({
  name,
  source: 'profixio',
  tournamentSlug: 'slug',
  categoryId: 'c',
  groupId: 'g',
  groupName: 'grp',
  playoffIds: [],
  teamName: 'Fjellhammer IL',
  teamTag,
  color: '#000',
})

const table = (tournamentName: string, teams: string[]): LeagueTable => ({
  tournamentName,
  tournamentUrl: tournamentName,
  rows: teams.map((t) => ({
    position: 1,
    team: t,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  })),
})

const ELITE = table('Skjærgårdslekene Elite - G2010', [
  'Bækkelagets SPKL',
  'Fjellhammer IL',
  'HK Aranäs',
])
const OPEN = table('Skjærgårdslekene Åpen - G2010', [
  'Vang håndball',
  'Bjarg, IL',
  'Fjellhammer IL',
])
const cups = [
  cup('Skjærgårdslekene Elite', 'Fjellhammer G16 1'),
  cup('Skjærgårdslekene Åpen', 'Fjellhammer G16 2'),
]

describe('groupTablesByTeam', () => {
  it('legger elite under 1. lag og åpen under 2. lag (etter teamTag)', () => {
    const teams = [team('Fjellhammer G16 1'), team('Fjellhammer G16 2')]

    const grouped = groupTablesByTeam([ELITE, OPEN], teams, cups)

    expect(grouped['Fjellhammer G16 1'].map((t) => t.tournamentName)).toEqual([
      ELITE.tournamentName,
    ])
    expect(grouped['Fjellhammer G16 2'].map((t) => t.tournamentName)).toEqual([OPEN.tournamentName])
  })

  it('faller tilbake til 1. lag når andrelaget ennå ikke finnes i manifestet (tabellen forsvinner ikke)', () => {
    const teams = [team('Fjellhammer G16 1')]

    const grouped = groupTablesByTeam([ELITE, OPEN], teams, cups)

    expect(grouped['Fjellhammer G16 1'].map((t) => t.tournamentName)).toEqual([
      ELITE.tournamentName,
      OPEN.tournamentName,
    ])
  })

  it('grupperer serietabeller via lagnavn i radene', () => {
    const teams = [team('Fjellhammer G16 1'), team('Fjellhammer G16 2')]
    const serie = table('Regionserien G16', ['Fjellhammer G16 2', 'Annet lag'])

    const grouped = groupTablesByTeam([serie], teams, cups)

    expect(grouped['Fjellhammer G16 2'].map((t) => t.tournamentName)).toEqual([
      serie.tournamentName,
    ])
    expect(grouped['Fjellhammer G16 1']).toEqual([])
  })
})
