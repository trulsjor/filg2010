import { describe, expect, it } from 'vitest'
import { createEmptySummary, hasChanges, finalizeSummary } from '../src/update/update-summary.js'

describe('createEmptySummary', () => {
  it('returnerer riktig struktur', () => {
    const summary = createEmptySummary()

    expect(summary).toHaveProperty('timestamp')
    expect(summary).toHaveProperty('resultsUpdated')
    expect(summary).toHaveProperty('statsUpdated')
    expect(summary).toHaveProperty('noChanges')
  })

  it('setter noChanges til true', () => {
    const summary = createEmptySummary()

    expect(summary.noChanges).toBe(true)
  })

  it('initialiserer tomme arrays', () => {
    const summary = createEmptySummary()

    expect(summary.resultsUpdated).toEqual([])
    expect(summary.statsUpdated).toEqual([])
  })

  it('setter timestamp til ISO-format', () => {
    const summary = createEmptySummary()

    expect(() => new Date(summary.timestamp)).not.toThrow()
    expect(summary.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('hasChanges', () => {
  it('returnerer false for tom summary', () => {
    const summary = createEmptySummary()

    expect(hasChanges(summary)).toBe(false)
  })

  it('returnerer true når resultsUpdated har elementer', () => {
    const summary = createEmptySummary()
    summary.resultsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })

    expect(hasChanges(summary)).toBe(true)
  })

  it('returnerer true når statsUpdated har elementer', () => {
    const summary = createEmptySummary()
    summary.statsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })

    expect(hasChanges(summary)).toBe(true)
  })

  it('returnerer true når begge arrays har elementer', () => {
    const summary = createEmptySummary()
    summary.resultsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })
    summary.statsUpdated.push({
      kampnr: '456',
      hjemmelag: 'Team C',
      bortelag: 'Team D',
      resultat: '30-28',
    })

    expect(hasChanges(summary)).toBe(true)
  })
})

describe('finalizeSummary', () => {
  it('setter noChanges til true når ingen endringer', () => {
    const summary = createEmptySummary()

    const finalized = finalizeSummary(summary)

    expect(finalized.noChanges).toBe(true)
  })

  it('setter noChanges til false når resultater er oppdatert', () => {
    const summary = createEmptySummary()
    summary.resultsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })

    const finalized = finalizeSummary(summary)

    expect(finalized.noChanges).toBe(false)
  })

  it('setter noChanges til false når stats er oppdatert', () => {
    const summary = createEmptySummary()
    summary.statsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })

    const finalized = finalizeSummary(summary)

    expect(finalized.noChanges).toBe(false)
  })

  it('beholder original data', () => {
    const summary = createEmptySummary()
    summary.resultsUpdated.push({
      kampnr: '123',
      hjemmelag: 'Team A',
      bortelag: 'Team B',
      resultat: '25-20',
    })

    const finalized = finalizeSummary(summary)

    expect(finalized.resultsUpdated).toEqual(summary.resultsUpdated)
    expect(finalized.timestamp).toBe(summary.timestamp)
  })

  it('returnerer ny instans (immutable)', () => {
    const summary = createEmptySummary()

    const finalized = finalizeSummary(summary)

    expect(finalized).not.toBe(summary)
  })
})
