import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMetadata } from './useMetadata'
import type { Metadata } from '../types'

const mockMetadata: Metadata = {
  lastUpdated: '2025-01-15T10:30:00.000Z',
  teamsCount: 2,
  matchesCount: 15,
}

describe('useMetadata', () => {
  it('returns metadata when provided', async () => {
    const { result } = renderHook(() => useMetadata(mockMetadata))

    await waitFor(() => {
      expect(result.current.metadata).toEqual(mockMetadata)
    })
  })

  it('returns formatted last updated date', async () => {
    const { result } = renderHook(() => useMetadata(mockMetadata))

    await waitFor(() => {
      expect(result.current.formattedLastUpdated).toContain('15')
      expect(result.current.formattedLastUpdated).toContain('01')
      expect(result.current.formattedLastUpdated).toContain('2025')
    })
  })

  it('returns null formatted date when metadata is null', async () => {
    const { result } = renderHook(() => useMetadata(null))

    await waitFor(() => {
      expect(result.current.formattedLastUpdated).toBeNull()
    })
  })
})
