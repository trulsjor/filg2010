import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSquadPath } from './useSquadPath'

function wrapperFor(route: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/:squadId/*" element={children} />
        <Route path="/:squadId" element={children} />
      </Routes>
    </MemoryRouter>
  )
}

function pathsFor(route: string) {
  const { result } = renderHook(() => useSquadPath(), { wrapper: wrapperFor(route) })
  return result.current
}

describe('useSquadPath', () => {
  it('bygger sti innenfor kullet man ser på', () => {
    const { squadPath } = pathsFor('/j2010')

    expect(squadPath()).toBe('/j2010')
    expect(squadPath('tabeller')).toBe('/j2010/tabeller')
    expect(squadPath('spillere/abc')).toBe('/j2010/spillere/abc')
  })

  it('leser kullet fra ruten', () => {
    expect(pathsFor('/j2010/tabeller').squadId).toBe('j2010')
    expect(pathsFor('/g2010/tabeller').squadId).toBe('g2010')
  })

  it('tar vare på valgt sesong når man navigerer', () => {
    const { squadPath } = pathsFor('/g2010?sesong=2025-2026')

    expect(squadPath()).toBe('/g2010?sesong=2025-2026')
    expect(squadPath('spillere')).toBe('/g2010/spillere?sesong=2025-2026')
  })

  it('legger sesongen til med & når stien har spørring fra før', () => {
    const { squadPath } = pathsFor('/g2010?sesong=2025-2026')

    expect(squadPath('lag/531500?turnering=Serie')).toBe(
      '/g2010/lag/531500?turnering=Serie&sesong=2025-2026'
    )
  })

  it('utelater sesong når man ser på inneværende', () => {
    const { squadPath } = pathsFor('/g2010')

    expect(squadPath('tabeller')).toBe('/g2010/tabeller')
  })
})
