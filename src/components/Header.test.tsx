import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'
import { renderInSeason, testSeason } from '../test/seasonFixture'

const renderHeader = (props = {}) => renderInSeason(<Header {...props} />)

describe('Header', () => {
  it('renders Fjellhammer logo', () => {
    renderHeader()
    const logo = screen.getByAltText('Fjellhammer logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/fjellhammer-logo.svg')
  })

  it('renders title and subtitle', () => {
    renderHeader()
    expect(screen.getAllByText('Fjellhammer IL').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: /terminliste/i })).toBeInTheDocument()
  })

  it('renders "Neste kamp" button when onScrollToNext is provided', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext })
    expect(screen.getByRole('button', { name: /neste kamp/i })).toBeInTheDocument()
  })

  it('does not render "Neste kamp" button when showScrollButton is false', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext, showScrollButton: false })
    expect(screen.queryByRole('button', { name: /neste kamp/i })).not.toBeInTheDocument()
  })

  it('calls onScrollToNext when button is clicked', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext })

    const button = screen.getByRole('button', { name: /neste kamp/i })
    fireEvent.click(button)

    expect(onScrollToNext).toHaveBeenCalledTimes(1)
  })

  it('renders tabell link', () => {
    renderHeader()
    const tabellLink = screen.getByTestId('tabell-link')
    expect(tabellLink).toBeInTheDocument()
    expect(tabellLink).toHaveAttribute('href', '/g2010/tabeller')
  })

  it('has proper accessibility attributes', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext })
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neste kamp/i })).toHaveAttribute(
      'aria-label',
      'Gå til neste kamp'
    )
  })

  it('renders menu button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /meny/i })).toBeInTheDocument()
  })
})

describe('Header viser hvilket kull du ser på', () => {
  it('viser kullet i overskriften', () => {
    renderInSeason(<Header />, { season: testSeason() })

    expect(screen.getByRole('heading', { name: 'Terminliste G2010' })).toBeInTheDocument()
  })

  it('har ingen kullfaner, de ligger i menyen', () => {
    renderInSeason(<Header />)

    expect(screen.queryByRole('button', { name: 'J2010' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Velg kull' })).not.toBeInTheDocument()
  })

  it('har ingen sesongvelger, den ligger i menyen', () => {
    renderInSeason(<Header />)

    expect(screen.queryByLabelText('Velg sesong')).not.toBeInTheDocument()
  })
})
