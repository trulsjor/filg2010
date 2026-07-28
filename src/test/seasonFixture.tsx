import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SeasonContext } from '../squads/SeasonAccess'
import type { SeasonData } from '../squads/SeasonDataLoader'
import { ThemeProvider } from '../context/ThemeContext'
import type { Match } from '../types'

export function testMatch(overrides: Partial<Match> = {}): Match {
  return {
    Lag: 'Fjellhammer G16 1',
    Dato: '05.09.2026',
    Tid: '10:00',
    Kampnr: '95031612005',
    Hjemmelag: 'Fjellhammer',
    Bortelag: 'Kjelsås',
    'H-B': '',
    Bane: 'Kjelsåshallen',
    Arrangør: 'Kjelsås IL',
    Turnering: 'iceserien G16 - Kval Pulje 12',
    ...overrides,
  }
}

export function testSeason(overrides: Partial<SeasonData> = {}): SeasonData {
  return {
    squad: {
      id: 'g2010',
      name: 'Fjellhammer G2010',
      teams: [{ name: 'Fjellhammer G16 1', lagid: '558767', color: '#fbbf24' }],
      cups: [],
      pastSeasons: [],
    },
    teams: [{ name: 'Fjellhammer G16 1', lagid: '558767', color: '#fbbf24' }],
    seasonSlug: '2026-2027',
    seasonName: 'Håndballsesongen 2026/2027',
    isArchived: false,
    matches: [testMatch()],
    tables: [],
    playerStats: {
      players: [],
      matchStats: [],
      matchesWithoutStats: [],
      lastUpdated: '2026-07-27T10:00:00.000Z',
    },
    aggregates: { aggregates: [], generatedAt: '2026-07-27T10:00:00.000Z' },
    metadata: {
      lastUpdated: '2026-07-27T10:00:00.000Z',
      teamsCount: 1,
      matchesCount: 1,
    },
    ...overrides,
  }
}

interface RenderInSeasonOptions {
  season?: SeasonData
  route?: string
  path?: string
}

export function renderInSeason(ui: ReactElement, options: RenderInSeasonOptions = {}) {
  const season = options.season ?? testSeason()
  const route = options.route ?? `/${season.squad.id}`
  const path = options.path ?? '/:squadId'

  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <SeasonContext.Provider value={season}>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </SeasonContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  )
}
