import { useMemo } from 'react'
import type { Metadata } from '../types'

export function useMetadata(metadata: Metadata | null) {
  const formattedLastUpdated = useMemo(() => {
    if (!metadata?.lastUpdated) return null
    return new Date(metadata.lastUpdated).toLocaleString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [metadata?.lastUpdated])

  return {
    metadata,
    formattedLastUpdated,
  }
}
