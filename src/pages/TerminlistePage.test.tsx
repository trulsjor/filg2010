import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TerminlistePage } from './TerminlistePage'
import { ThemeProvider } from '../context/ThemeContext'

describe('TerminlistePage', () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <TerminlistePage />
        </ThemeProvider>
      </MemoryRouter>
    )
  }

  it('renders the header with logo', () => {
    renderPage()
    expect(screen.getByAltText('Fjellhammer logo')).toBeInTheDocument()
  })

  it('renders the page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /terminliste/i })).toBeInTheDocument()
  })

  it('renders filter dropdown', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument()
  })

  it('renders menu button', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /meny/i })).toBeInTheDocument()
  })

  it('has navigation link to tables', () => {
    renderPage()
    expect(screen.getByTestId('tabell-link')).toBeInTheDocument()
  })
})
