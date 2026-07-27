import { describe, it, expect } from 'vitest'
import { pathToSeason, pathToSquad, previousSeasons } from './SeasonNavigation'

describe('pathToSeason', () => {
  it('gir kort sti for inneværende sesong', () => {
    expect(pathToSeason('g2010', '2026-2027')).toBe('/g2010')
  })

  it('tar med sesongen for arkiverte sesonger', () => {
    expect(pathToSeason('g2010', '2025-2026')).toBe('/g2010/2025-2026')
  })
})

describe('pathToSquad', () => {
  it('beholder sesongen når det andre kullet har den', () => {
    expect(pathToSquad('j2010', '2025-2026')).toBe('/j2010/2025-2026')
  })

  it('går til inneværende når det andre kullet mangler sesongen', () => {
    expect(pathToSquad('j2010', '1999-2000')).toBe('/j2010')
  })

  it('gir kort sti når man allerede er i inneværende sesong', () => {
    expect(pathToSquad('j2010', '2026-2027')).toBe('/j2010')
  })
})

describe('previousSeasons', () => {
  it('gir bare de arkiverte sesongene', () => {
    const arkiv = previousSeasons('g2010')

    expect(arkiv.length).toBeGreaterThan(0)
    expect(arkiv.every((choice) => choice.isArchived)).toBe(true)
  })
})
