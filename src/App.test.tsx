import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { ThemeProvider } from './context/ThemeContext'
import { LAST_SQUAD_KEY } from './squads/SeasonAccess'

function renderWithProviders(ui: React.ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  )
}

describe('App', () => {
  describe('Terminliste route (/)', () => {
    it('renders the header', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /terminliste/i })).toBeInTheDocument()
      })
    })

    it('renders the filter dropdown', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
      })
    })

    it('renders matches', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getAllByText(/Fjellhammer/i).length).toBeGreaterThan(0)
      })
    })

    it('shows last updated time', async () => {
      renderWithProviders(<App />)
      await waitFor(() => {
        expect(screen.getByText(/oppdatert/i)).toBeInTheDocument()
      })
    })
  })
})

describe('App og kullruting', () => {
  it('sender startsiden til første kull', async () => {
    renderWithProviders(<App />, { route: '/' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminliste G2010' })).toBeInTheDocument()
    })
  })

  it('viser jentelaget på sin egen rute', async () => {
    renderWithProviders(<App />, { route: '/j2010' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminliste J2010' })).toBeInTheDocument()
    })
  })

  it('viser guttelaget på sin egen rute', async () => {
    renderWithProviders(<App />, { route: '/g2010' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminliste G2010' })).toBeInTheDocument()
    })
  })

  it('sender gamle bokmerker til første kull', async () => {
    renderWithProviders(<App />, { route: '/tabeller' })

    await waitFor(() => {
      expect(screen.getByTestId('spillere-link')).toHaveAttribute('href', '/g2010/spillere')
    })
  })

  it('sender ukjent kull til første kull', async () => {
    renderWithProviders(<App />, { route: '/finnesikke' })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Terminliste G2010' })).toBeInTheDocument()
    })
  })

  it('viser arkivert sesong når den velges', async () => {
    renderWithProviders(<App />, { route: '/g2010/2025-2026' })

    await waitFor(() => {
      expect(screen.getByText(/Arkiv 2025\/2026/)).toBeInTheDocument()
    })
  })

  it('husker sist valgte kull til neste besøk', async () => {
    renderWithProviders(<App />, { route: '/j2010' })

    await waitFor(() => {
      expect(window.localStorage.getItem(LAST_SQUAD_KEY)).toBe('j2010')
    })
  })
})

describe('App og arkivvisning', () => {
  it('filtrerer arkiverte spillere på lagene som spilte den sesongen', async () => {
    renderWithProviders(<App />, { route: '/g2010/2025-2026/spillere' })

    await waitFor(() => {
      expect(screen.getByText(/spillere\)/)).toBeInTheDocument()
    })

    const antall = screen.getByText(/spillere\)/).textContent ?? ''
    expect(antall).not.toContain('(0 spillere)')
  })

  it('viser arkivets kamper, ikke inneværende sesongs', async () => {
    renderWithProviders(<App />, { route: '/g2010/2025-2026' })

    await waitFor(() => {
      expect(screen.getByText(/Arkiv 2025\/2026/)).toBeInTheDocument()
    })

    expect(screen.queryByText(/iceserien G16/)).not.toBeInTheDocument()
  })
})
