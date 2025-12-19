import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { ThemeProvider } from './context/ThemeContext'

// Mock the data files - paths are relative to the App.tsx file
vi.mock('/Users/Truls.Jorgensen/dev/terminliste/data/terminliste.json', () => ({
  default: [
    {
      Dato: '15.01.2025',
      Tid: '18:00',
      Kampnr: '123456',
      Hjemmelag: 'Fjellhammer',
      Bortelag: 'Motstanderlag',
      'H-B': '24-18',
      Bane: 'Fjellhammerhallen',
      Turnering: 'Seriekamper',
      Lag: 'Fjellhammer',
      Tilskuere: '50',
      Arrangør: 'Fjellhammer IL',
      'Kamp URL': 'https://handball.no/kamp/123',
      'Hjemmelag URL': '',
      'Bortelag URL': '',
      'Turnering URL': '',
    },
  ],
}))

vi.mock('/Users/Truls.Jorgensen/dev/terminliste/data/metadata.json', () => ({
  default: {
    lastUpdated: '2025-01-15T10:00:00.000Z',
    teamsCount: 1,
    matchesCount: 1,
  },
}))

vi.mock('/Users/Truls.Jorgensen/dev/terminliste/config.json', () => ({
  default: {
    teams: [
      {
        name: 'Fjellhammer',
        lagid: '123',
        seasonId: '2024',
        color: '#fbbf24',
      },
    ],
  },
}))

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Terminliste route (/)', () => {
    it('renders the header', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /terminliste/i })).toBeInTheDocument()
      })
    })

    it('renders the filter bar', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: /filtrer kamper/i })).toBeInTheDocument()
      })
    })

    it('renders matches', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        // Match date appears in the cards
        expect(screen.getAllByText('15.01.2025').length).toBeGreaterThan(0)
        // Team names appear multiple times (in filters, cards, tables)
        expect(screen.getAllByText('Fjellhammer').length).toBeGreaterThan(0)
      })
    })

    it('shows last updated time', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByText(/oppdatert/i)).toBeInTheDocument()
      })
    })
  })

  describe('Statistikk route (/statistikk)', () => {
    it('renders statistikk page', async () => {
      renderWithProviders(<App />, { route: '/statistikk' })
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /statistikk/i })).toBeInTheDocument()
      })
    })

    it('shows back link to terminliste', async () => {
      renderWithProviders(<App />, { route: '/statistikk' })
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /tilbake/i })).toBeInTheDocument()
      })
    })
  })
})
