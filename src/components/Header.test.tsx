import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'
import { ThemeProvider } from '../context/ThemeContext'

const renderHeader = (props = {}) => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Header {...props} />
      </ThemeProvider>
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

  it('renders tabeller link', () => {
    renderHeader()
    const tabellerLink = screen.getByRole('link', { name: /tabeller/i })
    expect(tabellerLink).toBeInTheDocument()
    expect(tabellerLink).toHaveAttribute('href', '/tabeller')
  })

  it('renders statistikk link', () => {
    renderHeader()
    const statsLink = screen.getByRole('link', { name: /statistikk/i })
    expect(statsLink).toBeInTheDocument()
    expect(statsLink).toHaveAttribute('href', '/statistikk')
  })

  it('has proper accessibility attributes', () => {
    const onScrollToNext = vi.fn()
    renderHeader({ onScrollToNext })
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /neste kamp/i })).toHaveAttribute('aria-label', 'Gå til neste kamp')
  })

  it('renders theme selector', () => {
    renderHeader()
    expect(screen.getByRole('button', { name: /velg tema/i })).toBeInTheDocument()
  })
})
