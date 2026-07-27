import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSquadPath } from './useSquadPath'

function wrapperFor(route: string, path: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={children} />
      </Routes>
    </MemoryRouter>
  )
}

function currentSeasonAt(route: string) {
  const { result } = renderHook(() => useSquadPath(), {
    wrapper: wrapperFor(route, '/:squadId/*'),
  })
  return result.current
}

function archiveAt(route: string) {
  const { result } = renderHook(() => useSquadPath(), {
    wrapper: wrapperFor(route, '/:squadId/:season/*'),
  })
  return result.current
}

describe('useSquadPath i inneværende sesong', () => {
  it('bygger sti uten sesongledd', () => {
    const { squadPath } = currentSeasonAt('/j2010/tabeller')

    expect(squadPath()).toBe('/j2010')
    expect(squadPath('tabeller')).toBe('/j2010/tabeller')
    expect(squadPath('spillere/abc')).toBe('/j2010/spillere/abc')
  })

  it('leser kullet fra ruten', () => {
    expect(currentSeasonAt('/j2010/tabeller').squadId).toBe('j2010')
    expect(currentSeasonAt('/g2010/tabeller').squadId).toBe('g2010')
  })

  it('beholder spørringen på undersiden', () => {
    const { squadPath } = currentSeasonAt('/g2010/tabeller')

    expect(squadPath('lag/531500?turnering=Serie')).toBe('/g2010/lag/531500?turnering=Serie')
  })
})

describe('useSquadPath i arkivet', () => {
  it('tar sesongen med i alle stier', () => {
    const { squadPath } = archiveAt('/g2010/2025-2026/tabeller')

    expect(squadPath()).toBe('/g2010/2025-2026')
    expect(squadPath('spillere')).toBe('/g2010/2025-2026/spillere')
  })

  it('setter sesongen foran spørringen, ikke etter', () => {
    const { squadPath } = archiveAt('/g2010/2025-2026/tabeller')

    expect(squadPath('lag/531500?turnering=Serie')).toBe(
      '/g2010/2025-2026/lag/531500?turnering=Serie'
    )
  })

  it('leser både kull og sesong fra ruten', () => {
    const { squadId, season } = archiveAt('/j2010/2025-2026/spillere')

    expect(squadId).toBe('j2010')
    expect(season).toBe('2025-2026')
  })
})
