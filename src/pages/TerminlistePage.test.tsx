import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { TerminlistePage } from './TerminlistePage'
import { renderInSeason } from '../test/seasonFixture'

describe('TerminlistePage', () => {
  const renderPage = () => renderInSeason(<TerminlistePage />)

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
