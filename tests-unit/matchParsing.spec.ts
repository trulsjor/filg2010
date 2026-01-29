import { describe, expect, it } from 'vitest'
import {
  parseMatchDate,
  needsResultUpdate,
  extractMatchIdFromUrl,
  parseMatchIndexFile,
  isOldMatchIndexEntry,
} from '../src/update/match-parsing.js'
import type { Match } from '../src/types/index.js'

function createMatch(overrides: Partial<Match> = {}): Match {
  return {
    Lag: 'Test',
    Dato: '01.01.2025',
    Tid: '18:00',
    Kampnr: '12345',
    Hjemmelag: 'Team A',
    Bortelag: 'Team B',
    'H-B': '',
    Bane: 'Hallen',
    Tilskuere: 100,
    Arrangør: 'Arr',
    Turnering: 'Serie',
    'Kamp URL': 'https://handball.no?matchid=12345',
    'Hjemmelag URL': '',
    'Bortelag URL': '',
    'Turnering URL': '',
    ...overrides,
  }
}

describe('parseMatchDate', () => {
  it('parser dd.mm.yyyy format korrekt', () => {
    const result = parseMatchDate('15.03.2025')

    expect(result).not.toBeNull()
    expect(result!.getDate()).toBe(15)
    expect(result!.getMonth()).toBe(2) // March = 2 (0-indexed)
    expect(result!.getFullYear()).toBe(2025)
  })

  it('setter tid til 23:59:59', () => {
    const result = parseMatchDate('15.03.2025')

    expect(result!.getHours()).toBe(23)
    expect(result!.getMinutes()).toBe(59)
    expect(result!.getSeconds()).toBe(59)
  })

  it('returnerer null for ugyldig format', () => {
    expect(parseMatchDate('2025-03-15')).toBeNull()
    expect(parseMatchDate('15/03/2025')).toBeNull()
    expect(parseMatchDate('invalid')).toBeNull()
  })

  it('returnerer null for ufullstendig dato', () => {
    expect(parseMatchDate('15.03')).toBeNull()
    expect(parseMatchDate('15')).toBeNull()
  })

  it('returnerer null for ikke-numeriske verdier', () => {
    expect(parseMatchDate('ab.cd.efgh')).toBeNull()
  })

  it('håndterer grensetilfeller (31.12, 01.01)', () => {
    const newYearsEve = parseMatchDate('31.12.2025')
    expect(newYearsEve!.getDate()).toBe(31)
    expect(newYearsEve!.getMonth()).toBe(11) // December

    const newYearsDay = parseMatchDate('01.01.2026')
    expect(newYearsDay!.getDate()).toBe(1)
    expect(newYearsDay!.getMonth()).toBe(0) // January
  })
})

describe('needsResultUpdate', () => {
  it('returnerer false når H-B har verdi', () => {
    const match = createMatch({ 'H-B': '25-20' })
    const now = new Date('2025-01-15')

    expect(needsResultUpdate(match, now)).toBe(false)
  })

  it('returnerer true når H-B er "-" (betyr ingen resultat ennå)', () => {
    const match = createMatch({ 'H-B': '-' })
    const now = new Date('2025-01-15')

    // H-B = '-' betyr at kampen er planlagt men uten resultat ennå
    expect(needsResultUpdate(match, now)).toBe(true)
  })

  it('returnerer false når Kamp URL mangler', () => {
    const match = createMatch({ 'H-B': '', 'Kamp URL': '' })
    const now = new Date('2025-01-15')

    expect(needsResultUpdate(match, now)).toBe(false)
  })

  it('returnerer false når dato er i fremtiden', () => {
    const match = createMatch({ Dato: '01.02.2025', 'H-B': '' })
    const now = new Date('2025-01-15')

    expect(needsResultUpdate(match, now)).toBe(false)
  })

  it('returnerer true når dato er passert og mangler resultat', () => {
    const match = createMatch({ Dato: '01.01.2025', 'H-B': '' })
    const now = new Date('2025-01-15')

    expect(needsResultUpdate(match, now)).toBe(true)
  })

  it('returnerer true for kamp på kampdag etter 23:59:59', () => {
    const match = createMatch({ Dato: '15.01.2025', 'H-B': '' })
    // Same day but later (after 23:59:59 of match day)
    const now = new Date('2025-01-16T00:00:00')

    expect(needsResultUpdate(match, now)).toBe(true)
  })
})

describe('extractMatchIdFromUrl', () => {
  it('trekker ut matchid fra gyldig URL', () => {
    const url = 'https://www.handball.no/kamp/?matchid=41031502009'

    expect(extractMatchIdFromUrl(url)).toBe('41031502009')
  })

  it('returnerer null for URL uten matchid', () => {
    const url = 'https://www.handball.no/kamp/'

    expect(extractMatchIdFromUrl(url)).toBeNull()
  })

  it('håndterer URL med andre query-params', () => {
    const url = 'https://www.handball.no/kamp/?foo=bar&matchid=12345&baz=qux'

    expect(extractMatchIdFromUrl(url)).toBe('12345')
  })

  it('returnerer null for tom streng', () => {
    expect(extractMatchIdFromUrl('')).toBeNull()
  })

  it('returnerer kun numeriske matchid', () => {
    const url = 'https://www.handball.no/kamp/?matchid=abc123'

    expect(extractMatchIdFromUrl(url)).toBeNull()
  })
})

describe('isOldMatchIndexEntry', () => {
  it('returnerer true for gammelt format', () => {
    expect(isOldMatchIndexEntry({ url: 'https://example.com' })).toBe(true)
    expect(isOldMatchIndexEntry({ url: 'https://example.com', played: true })).toBe(true)
  })

  it('returnerer false for nytt format (streng)', () => {
    expect(isOldMatchIndexEntry('https://example.com')).toBe(false)
  })

  it('returnerer false for null/undefined', () => {
    expect(isOldMatchIndexEntry(null)).toBe(false)
    expect(isOldMatchIndexEntry(undefined)).toBe(false)
  })

  it('returnerer false for objekt uten url-property', () => {
    expect(isOldMatchIndexEntry({ played: true })).toBe(false)
    expect(isOldMatchIndexEntry({})).toBe(false)
  })
})

describe('parseMatchIndexFile', () => {
  it('parser nytt format (string-verdier)', () => {
    const content = JSON.stringify({
      '12345': 'https://handball.no?matchid=12345',
      '67890': 'https://handball.no?matchid=67890',
    })

    const result = parseMatchIndexFile(content)

    expect(result['12345']).toBe('https://handball.no?matchid=12345')
    expect(result['67890']).toBe('https://handball.no?matchid=67890')
  })

  it('migrerer gammelt format (OldMatchIndexEntry)', () => {
    const content = JSON.stringify({
      '12345': { url: 'https://handball.no?matchid=12345', played: true },
      '67890': { url: 'https://handball.no?matchid=67890' },
    })

    const result = parseMatchIndexFile(content)

    expect(result['12345']).toBe('https://handball.no?matchid=12345')
    expect(result['67890']).toBe('https://handball.no?matchid=67890')
  })

  it('returnerer tom for ugyldig JSON', () => {
    const result = parseMatchIndexFile('not valid json')

    expect(result).toEqual({})
  })

  it('returnerer tom for tom fil', () => {
    expect(parseMatchIndexFile('{}')).toEqual({})
  })

  it('returnerer tom for null-verdi', () => {
    expect(parseMatchIndexFile('null')).toEqual({})
  })

  it('ignorerer ugyldig verdier i index', () => {
    const content = JSON.stringify({
      '12345': 'https://handball.no?matchid=12345',
      '67890': 123, // invalid - should be ignored
      '11111': null, // invalid - should be ignored
    })

    const result = parseMatchIndexFile(content)

    expect(Object.keys(result)).toHaveLength(1)
    expect(result['12345']).toBe('https://handball.no?matchid=12345')
  })
})
