import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from './App'
import { ThemeProvider } from './context/ThemeContext'

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
