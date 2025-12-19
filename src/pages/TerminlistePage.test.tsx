import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TerminlistePage } from './TerminlistePage'

describe('TerminlistePage', () => {
  const renderPage = () => {
    return render(
      <MemoryRouter>
        <TerminlistePage />
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

  it('renders filter bar', () => {
    renderPage()
    expect(screen.getByRole('navigation', { name: /filtrer kamper/i })).toBeInTheDocument()
  })

  it('renders match content', () => {
    renderPage()
    // Should have either desktop or mobile view with matches
    expect(screen.getByText(/sist oppdatert/i)).toBeInTheDocument()
  })

  it('has navigation link to statistics', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /statistikk/i })).toBeInTheDocument()
  })
})
