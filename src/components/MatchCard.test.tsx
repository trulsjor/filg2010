import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MatchCard } from './MatchCard'
import type { Match } from '../types'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const mockMatch: Match = {
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
}

const mockGetTeamColor = vi.fn().mockReturnValue('#fbbf24')

describe('MatchCard', () => {
  it('renders match date and time', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('ons. 15.01.2025')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
  })

  it('renders team names', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('Fjellhammer')).toBeInTheDocument()
    expect(screen.getByText('Motstanderlag')).toBeInTheDocument()
  })

  it('renders score when available', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('24-18')).toBeInTheDocument()
  })

  it('renders dash when no score', () => {
    const matchWithoutScore = { ...mockMatch, 'H-B': '' }
    const { container } = renderWithRouter(
      <MatchCard
        match={matchWithoutScore}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const scoreElement = container.querySelector('.card-score')
    expect(scoreElement).toHaveTextContent('-')
  })

  it('renders venue and spectators', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('Fjellhammerhallen')).toBeInTheDocument()
    expect(screen.getByText('50 tilskuere')).toBeInTheDocument()
  })

  it('renders team indicator when hasMultipleTeams is true', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={true}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(mockGetTeamColor).toHaveBeenCalledWith('Fjellhammer')
  })

  it('adds win-card class when Fjellhammer wins at home', () => {
    const { container } = renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(container.querySelector('.win-card')).toBeInTheDocument()
  })

  it('has next-match-card id when isNextMatch is true', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={true}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(document.getElementById('next-match-card')).toBeInTheDocument()
  })

  it('renders detaljer link for old matches', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const link = screen.getByRole('link', { name: /detaljer/i })
    expect(link).toHaveAttribute('href', 'https://handball.no/kamp/123')
  })

  it('renders live link for recent/future matches', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const futureDate = `${tomorrow.getDate().toString().padStart(2, '0')}.${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}.${tomorrow.getFullYear()}`

    const futureMatch: Match = {
      ...mockMatch,
      Dato: futureDate,
      'H-B': '',
      'Kamp URL': 'https://www.handball.no/system/kamper/kamp/?matchid=123',
    }
    renderWithRouter(
      <MatchCard
        match={futureMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const link = screen.getByRole('link', { name: /live/i })
    expect(link).toHaveAttribute('href', 'https://www.handball.no/system/live-kamp/?matchId=123')
  })

  it('renders map button', () => {
    renderWithRouter(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const mapButton = screen.getByRole('link', { name: /kart/i })
    expect(mapButton).toBeInTheDocument()
    expect(mapButton).toHaveAttribute('href', expect.stringContaining('maps'))
  })
})
