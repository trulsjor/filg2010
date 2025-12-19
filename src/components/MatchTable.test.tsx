import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchTable } from './MatchTable'
import type { Match } from '../types'

const mockMatches: Match[] = [
  {
    Dato: '15.01.2025',
    Tid: '18:00',
    Kampnr: '123456',
    Hjemmelag: 'Fjellhammer',
    Bortelag: 'Motstanderlag',
    'H-B': '24-18',
    Bane: 'Fjellhammerhallen',
    Turnering: 'Seriekamper',
    Lag: 'Fjellhammer',
    Tilskuere: '50',
    Arrangør: 'Fjellhammer IL',
    'Kamp URL': 'https://handball.no/kamp/123',
    'Hjemmelag URL': 'https://handball.no/lag/fjellhammer',
    'Bortelag URL': 'https://handball.no/lag/motstander',
    'Turnering URL': 'https://handball.no/turnering/1',
  },
  {
    Dato: '22.01.2025',
    Tid: '19:00',
    Kampnr: '789012',
    Hjemmelag: 'Annet lag',
    Bortelag: 'Fjellhammer',
    'H-B': '',
    Bane: 'Bortebane',
    Turnering: 'Seriekamper',
    Lag: 'Fjellhammer',
    Tilskuere: '',
    Arrangør: '',
    'Kamp URL': '',
    'Hjemmelag URL': '',
    'Bortelag URL': '',
    'Turnering URL': '',
  },
]

const mockGetTeamColor = vi.fn().mockReturnValue('#fbbf24')

describe('MatchTable', () => {
  it('renders table headers', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('Dato')).toBeInTheDocument()
    expect(screen.getByText('Tid')).toBeInTheDocument()
    expect(screen.getByText('Hjemmelag')).toBeInTheDocument()
    expect(screen.getByText('Bortelag')).toBeInTheDocument()
    expect(screen.getByText('H-B')).toBeInTheDocument()
    expect(screen.getByText('Bane')).toBeInTheDocument()
    expect(screen.getByText('Turnering')).toBeInTheDocument()
    expect(screen.getByText('Kamp')).toBeInTheDocument()
  })

  it('renders team column when hasMultipleTeams is true', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={true}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByRole('columnheader', { name: 'Lag' })).toBeInTheDocument()
  })

  it('does not render team column when hasMultipleTeams is false', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.queryByRole('columnheader', { name: 'Lag' })).not.toBeInTheDocument()
  })

  it('renders match data in rows', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('15.01.2025')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
    expect(screen.getByText('24-18')).toBeInTheDocument()
  })

  it('renders links for team URLs', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const link = screen.getByRole('link', { name: 'Fjellhammer' })
    expect(link).toHaveAttribute('href', 'https://handball.no/lag/fjellhammer')
  })

  it('renders "Se kamp" link when URL is available', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByRole('link', { name: 'Se kamp' })).toHaveAttribute(
      'href',
      'https://handball.no/kamp/123'
    )
  })

  it('renders dash for empty score', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    // The second match has empty score
    const cells = screen.getAllByRole('cell')
    const scoreCells = cells.filter((cell) => cell.textContent === '-')
    expect(scoreCells.length).toBeGreaterThan(0)
  })

  it('has proper accessibility attributes', () => {
    render(
      <MatchTable
        matches={mockMatches}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByRole('table')).toHaveAttribute('aria-label')
    expect(screen.getByRole('region', { name: /kampoversikt/i })).toBeInTheDocument()
  })
})
