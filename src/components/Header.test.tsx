import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders Fjellhammer logo', () => {
    render(<Header />)
    const logo = screen.getByAltText('Fjellhammer IL')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/fjellhammer-logo.svg')
  })

  it('renders title and subtitle', () => {
    render(<Header />)
    expect(screen.getByText('Fjellhammer IL')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'G2010' })).toBeInTheDocument()
  })

  it('renders "Neste kamp" button', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: /neste kamp/i })).toBeInTheDocument()
  })

  it('calls onScrollToNext when button is clicked', () => {
    const onScrollToNext = vi.fn()
    render(<Header onScrollToNext={onScrollToNext} />)

    const button = screen.getByRole('button', { name: /neste kamp/i })
    fireEvent.click(button)

    expect(onScrollToNext).toHaveBeenCalledTimes(1)
  })

  it('renders calendar link', () => {
    render(<Header />)
    const calendarLink = screen.getByRole('link', { name: /kalender/i })
    expect(calendarLink).toBeInTheDocument()
    expect(calendarLink).toHaveAttribute('href', '/calendar.ics')
  })

  it('renders statistikk link', () => {
    render(<Header />)
    const statsLink = screen.getByRole('link', { name: /statistikk/i })
    expect(statsLink).toBeInTheDocument()
    expect(statsLink).toHaveAttribute('href', '/statistikk')
  })

  it('has proper accessibility attributes', () => {
    render(<Header />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neste kamp/i })).toHaveAttribute('aria-label', 'Gå til neste kamp')
  })
})
