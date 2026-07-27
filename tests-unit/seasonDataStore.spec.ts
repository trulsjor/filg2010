import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { SeasonDataStore } from '../src/handball/SeasonDataStore.js'
import { SeasonDataError } from '../src/handball/SeasonDataFiles.js'
import type { Match } from '../src/types/index.js'

let baseDir: string
let store: SeasonDataStore

function writeConfig(content: unknown): void {
  fs.writeFileSync(path.join(baseDir, 'config.json'), JSON.stringify(content), 'utf-8')
}

function seasonInfo(squadId: string, slug: string, status: 'aktiv' | 'arkivert') {
  return {
    squadId,
    squadName: `Fjellhammer ${squadId.toUpperCase()}`,
    seasonId: slug === '2026-2027' ? '201068' : '201060',
    seasonName: `Håndballsesongen ${slug.replace('-', '/')}`,
    slug,
    status,
    lastUpdated: '2026-07-27T00:00:00.000Z',
  }
}

beforeEach(() => {
  baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terminliste-'))
  fs.mkdirSync(path.join(baseDir, 'data'), { recursive: true })
  store = new SeasonDataStore(baseDir)
})

afterEach(() => {
  fs.rmSync(baseDir, { recursive: true, force: true })
})

describe('SeasonDataStore og config', () => {
  it('leser kull og gjeldende sesong', () => {
    writeConfig({
      currentSeason: { id: '201068', name: 'Håndballsesongen 2026/2027', slug: '2026-2027' },
      squads: [{ id: 'g2010', name: 'Fjellhammer G2010', teams: [] }],
    })

    const config = store.loadConfig()

    expect(config.currentSeason.slug).toBe('2026-2027')
    expect(config.squads[0].id).toBe('g2010')
  })

  it('feiler tydelig når configen mangler kull', () => {
    writeConfig({ teams: [] })

    expect(() => store.loadConfig()).toThrow(/currentSeason eller squads/)
  })
})

describe('SeasonDataStore og lagring per kull', () => {
  const match: Match = {
    Lag: 'Fjellhammer G16 1',
    Dato: '05.09.2026',
    Tid: '10:00',
    Kampnr: '95031612005',
    Hjemmelag: 'Fjellhammer',
    Bortelag: 'Kjelsås',
    'H-B': '',
    Bane: 'Kjelsåshallen',
    Arrangør: 'Kjelsås IL',
    Turnering: 'iceserien G16',
  }

  it('holder kullene adskilt', () => {
    store.saveMatches('g2010', '2026-2027', [match])
    store.saveMatches('j2010', '2026-2027', [])

    expect(store.loadMatches('g2010', '2026-2027')).toHaveLength(1)
    expect(store.loadMatches('j2010', '2026-2027')).toHaveLength(0)
  })

  it('holder sesongene adskilt', () => {
    store.saveMatches('g2010', '2025-2026', [match, match])
    store.saveMatches('g2010', '2026-2027', [match])

    expect(store.loadMatches('g2010', '2025-2026')).toHaveLength(2)
    expect(store.loadMatches('g2010', '2026-2027')).toHaveLength(1)
  })

  it('gir tom liste for sesong som ikke finnes', () => {
    expect(store.loadMatches('j2010', '1999-2000')).toEqual([])
  })

  it('lagrer under data/kull/sesong', () => {
    store.saveMatches('g2010', '2026-2027', [match])

    expect(
      fs.existsSync(path.join(baseDir, 'data', 'g2010', '2026-2027', 'terminliste.json'))
    ).toBe(true)
  })
})

describe('SeasonDataStore og manifest', () => {
  beforeEach(() => {
    store.saveSeasonInfo(seasonInfo('g2010', '2026-2027', 'aktiv'))
    store.saveSeasonInfo(seasonInfo('g2010', '2025-2026', 'arkivert'))
    store.saveSeasonInfo(seasonInfo('j2010', '2026-2027', 'aktiv'))
  })

  it('finner alle sesonger på tvers av kull', () => {
    expect(store.listSeasons()).toHaveLength(3)
  })

  it('sorterer nyeste sesong først innenfor hvert kull', () => {
    const seasons = store.listSeasons()

    expect(seasons.map((s) => `${s.squadId}/${s.slug}`)).toEqual([
      'g2010/2026-2027',
      'g2010/2025-2026',
      'j2010/2026-2027',
    ])
  })

  it('skiller aktiv sesong fra arkivert', () => {
    const arkiverte = store.listSeasons().filter((s) => s.status === 'arkivert')

    expect(arkiverte).toHaveLength(1)
    expect(arkiverte[0].slug).toBe('2025-2026')
  })

  it('skriver manifestet til data/index.json', () => {
    const manifest = store.saveManifest('2026-2027')

    expect(manifest.currentSeasonSlug).toBe('2026-2027')
    expect(manifest.seasons).toHaveLength(3)
    expect(fs.existsSync(path.join(baseDir, 'data', 'index.json'))).toBe(true)
  })

  it('ignorerer kataloger uten season.json', () => {
    fs.mkdirSync(path.join(baseDir, 'data', 'tomtkull', '2026-2027'), { recursive: true })

    expect(store.listSeasons()).toHaveLength(3)
  })
})

describe('SeasonDataStore og ødelagte datafiler', () => {
  function writeRaw(fileName: string, content: string): void {
    fs.mkdirSync(path.join(baseDir, 'data', 'g2010', '2026-2027'), { recursive: true })
    fs.writeFileSync(path.join(baseDir, 'data', 'g2010', '2026-2027', fileName), content, 'utf-8')
  }

  it('feiler tydelig når terminlisten ikke er kamper', () => {
    writeRaw('terminliste.json', '[{"noe": "annet"}]')

    expect(() => store.loadMatches('g2010', '2026-2027')).toThrow(/terminliste.json/)
  })

  it('feiler tydelig når terminlisten ikke er en liste', () => {
    writeRaw('terminliste.json', '{}')

    expect(() => store.loadMatches('g2010', '2026-2027')).toThrow(SeasonDataError)
  })

  it('feiler tydelig når tabellen mangler rader', () => {
    writeRaw('tables.json', '[{"tournamentName": "Serie"}]')

    expect(() => store.loadTables('g2010', '2026-2027')).toThrow(/tables.json/)
  })

  it('feiler tydelig når spillerstatistikken er ufullstendig', () => {
    writeRaw('player-stats.json', '{"matchStats": []}')

    expect(() => store.loadCollectedStats('g2010', '2026-2027')).toThrow(/player-stats.json/)
  })

  it('starter tomt når spillerstatistikk ikke finnes ennå', () => {
    expect(store.loadCollectedStats('g2010', '2026-2027')).toEqual({
      matchStats: [],
      matchesWithoutStats: [],
    })
  })

  it('leser innsamlet statistikk uten å ta med katalog og tidsstempel', () => {
    writeRaw(
      'player-stats.json',
      JSON.stringify({
        players: [{ id: 'p1' }],
        matchStats: [{ matchId: 'm1' }],
        matchesWithoutStats: ['m2'],
        lastUpdated: '2026-07-27T00:00:00.000Z',
      })
    )

    expect(store.loadCollectedStats('g2010', '2026-2027')).toEqual({
      matchStats: [{ matchId: 'm1' }],
      matchesWithoutStats: ['m2'],
    })
  })
})
