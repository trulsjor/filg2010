import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from './FilterBar'
import type { FilterState } from '../hooks/useMatches'

describe('FilterBar', () => {
  const teamNames = ['Fjellhammer', 'Fjellhammer 2']
  const defaultFilters: FilterState = {}
  const mockOnFilterChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders team filter buttons', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )
    // There are 3 "Alle" buttons (one per filter group)
    expect(screen.getAllByRole('button', { name: 'Alle' })).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Fjellhammer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fjellhammer 2' })).toBeInTheDocument()
  })

  it('renders location filter buttons', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )
    expect(screen.getByRole('button', { name: 'Hjemme' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Borte' })).toBeInTheDocument()
  })

  it('renders status filter buttons', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )
    expect(screen.getByRole('button', { name: 'Kommende' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spilte' })).toBeInTheDocument()
  })

  it('calls onFilterChange when team button is clicked', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Fjellhammer' }))
    expect(mockOnFilterChange).toHaveBeenCalledWith({ team: 'Fjellhammer' })
  })

  it('calls onFilterChange when location button is clicked', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hjemme' }))
    expect(mockOnFilterChange).toHaveBeenCalledWith({ location: 'home' })
  })

  it('calls onFilterChange when status button is clicked', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Kommende' }))
    expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'upcoming' })
  })

  it('shows active state for selected filters', () => {
    const filters: FilterState = { team: 'Fjellhammer', location: 'home' }
    render(
      <FilterBar
        teamNames={teamNames}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByRole('button', { name: 'Fjellhammer' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'Hjemme' })).toHaveClass('active')
  })

  it('clears team filter when clicking Alle', () => {
    const filters: FilterState = { team: 'Fjellhammer' }
    render(
      <FilterBar
        teamNames={teamNames}
        filters={filters}
        onFilterChange={mockOnFilterChange}
      />
    )

    const alleButtons = screen.getAllByRole('button', { name: 'Alle' })
    fireEvent.click(alleButtons[0]) // First Alle button is for team filter
    expect(mockOnFilterChange).toHaveBeenCalledWith({ team: undefined })
  })

  it('has proper accessibility attributes', () => {
    render(
      <FilterBar
        teamNames={teamNames}
        filters={defaultFilters}
        onFilterChange={mockOnFilterChange}
      />
    )

    expect(screen.getByRole('navigation', { name: /filtrer kamper/i })).toBeInTheDocument()
  })
})
