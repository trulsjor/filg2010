import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

const renderHeader = (props = {}) => {
  return render(
    <MemoryRouter>
      <Header {...props} />
    </MemoryRouter>
  )
}

describe('Header', () => {
  it('renders Fjellhammer logo', () => {
    renderHeader()
    const logo = screen.getByAltText('Fjellhammer logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/fjellhammer-logo.svg')
  })

  it('renders title and subtitle', () => {
    renderHeader()
    expect(screen.getByText('Fjellhammer IL')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /terminliste/i })).toBeInTheDocument()
  })

  it('renders "Neste kamp" button', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /neste kamp/i })).toBeInTheDocument()
  })

  it('calls onScrollToNext when button is clicked', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext })

    const button = screen.getByRole('button', { name: /neste kamp/i })
    fireEvent.click(button)

    expect(onScrollToNext).toHaveBeenCalledTimes(1)
  })

  it('renders calendar link', () => {
    renderHeader()
    const calendarLink = screen.getByRole('link', { name: /kalender/i })
    expect(calendarLink).toBeInTheDocument()
    expect(calendarLink).toHaveAttribute('href', '/calendar.ics')
  })

  it('renders statistikk link', () => {
    renderHeader()
    const statsLink = screen.getByRole('link', { name: /statistikk/i })
    expect(statsLink).toBeInTheDocument()
    expect(statsLink).toHaveAttribute('href', '/statistikk')
  })

  it('has proper accessibility attributes', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neste kamp/i })).toHaveAttribute('aria-label', 'Gå til neste kamp')
  })
})
