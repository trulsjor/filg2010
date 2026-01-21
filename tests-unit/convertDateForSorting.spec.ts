import { describe, expect, it } from 'vitest'
import { convertDateForSorting } from '../src/match/match-sorting.js'

describe('convertDateForSorting', () => {
  it('converts DD.MM.YYYY to YYYY-MM-DD', () => {
    expect(convertDateForSorting('14.09.2025')).toBe('2025-09-14')
    expect(convertDateForSorting('01.01.2025')).toBe('2025-01-01')
    expect(convertDateForSorting('31.12.2025')).toBe('2025-12-31')
  })

  it('returns empty string when input is empty', () => {
    expect(convertDateForSorting('')).toBe('')
  })

  it('returns original string for invalid formats', () => {
    expect(convertDateForSorting('invalid')).toBe('invalid')
    expect(convertDateForSorting('14-09-2025')).toBe('14-09-2025')
    expect(convertDateForSorting('14/09/2025')).toBe('14/09/2025')
  })

  it('handles partial dates', () => {
    expect(convertDateForSorting('14.09')).toBe('14.09')
    expect(convertDateForSorting('2025')).toBe('2025')
  })
})
