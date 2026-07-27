import { describe, it, expect } from 'vitest'
import {
  archiveLabel,
  pageTitle,
  seasonOptionLabel,
  shortSeasonName,
  shortSquadName,
} from './SeasonLabels'

describe('shortSeasonName', () => {
  it('fjerner sesongprefikset', () => {
    expect(shortSeasonName('Håndballsesongen 2025/2026')).toBe('2025/2026')
  })

  it('lar navn uten prefiks stå urørt', () => {
    expect(shortSeasonName('Beachhåndball 2026')).toBe('Beachhåndball 2026')
  })
})

describe('shortSquadName', () => {
  it('fjerner klubbnavnet', () => {
    expect(shortSquadName('Fjellhammer G2010')).toBe('G2010')
  })

  it('lar navn uten klubbnavn stå urørt', () => {
    expect(shortSquadName('G2010')).toBe('G2010')
  })
})

describe('archiveLabel', () => {
  it('merker arkivert sesong', () => {
    expect(archiveLabel('Håndballsesongen 2025/2026')).toBe('Arkiv 2025/2026')
  })
})

describe('seasonOptionLabel', () => {
  it('merker arkiverte valg', () => {
    expect(seasonOptionLabel('Håndballsesongen 2025/2026', true)).toBe('2025/2026 (arkiv)')
  })

  it('lar inneværende sesong stå umerket', () => {
    expect(seasonOptionLabel('Håndballsesongen 2026/2027', false)).toBe('2026/2027')
  })
})

describe('pageTitle', () => {
  it('viser kullet for inneværende sesong', () => {
    expect(pageTitle('Fjellhammer J2010', 'Håndballsesongen 2026/2027', false)).toBe(
      'Terminliste - Fjellhammer J2010'
    )
  })

  it('viser sesongen og merker arkiv når man ser bakover', () => {
    expect(pageTitle('Fjellhammer G2010', 'Håndballsesongen 2025/2026', true)).toBe(
      'Fjellhammer G2010 2025/2026 (arkiv)'
    )
  })
})
