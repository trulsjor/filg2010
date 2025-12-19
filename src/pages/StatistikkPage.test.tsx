import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StatistikkPage } from './StatistikkPage'
import { ThemeProvider } from '../context/ThemeContext'

describe('StatistikkPage', () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <StatistikkPage />
        </ThemeProvider>
      </MemoryRouter>
    )
  }

  it('renders the page title', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /statistikk/i })).toBeInTheDocument()
  })

  it('has navigation link back to terminliste', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /tilbake/i })).toBeInTheDocument()
  })

  it('shows team statistics section', () => {
    renderPage()
    expect(screen.getByText(/kamper spilt/i)).toBeInTheDocument()
  })

  it('shows win/loss/draw counts', () => {
    renderPage()
    expect(screen.getByText(/seire/i)).toBeInTheDocument()
    expect(screen.getByText(/tap/i)).toBeInTheDocument()
    expect(screen.getByText(/uavgjort/i)).toBeInTheDocument()
  })

  it('shows link to tables page', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /se serietabeller/i })).toBeInTheDocument()
  })
})
