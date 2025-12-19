import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchCard } from './MatchCard'
import type { Match } from '../types'

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
    render(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('15.01.2025')).toBeInTheDocument()
    expect(screen.getByText('18:00')).toBeInTheDocument()
  })

  it('renders team names', () => {
    render(
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
    render(
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
    const { container } = render(
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
    render(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(screen.getByText('Fjellhammerhallen')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('renders team indicator when hasMultipleTeams is true', () => {
    render(
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
    const { container } = render(
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
    render(
      <MatchCard
        match={mockMatch}
        isNextMatch={true}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    expect(document.getElementById('next-match-card')).toBeInTheDocument()
  })

  it('renders match details link when available', () => {
    render(
      <MatchCard
        match={mockMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const link = screen.getByRole('link', { name: /se kampdetaljer/i })
    expect(link).toHaveAttribute('href', 'https://handball.no/kamp/123')
  })

  it('renders map link for away games', () => {
    const awayMatch = {
      ...mockMatch,
      Hjemmelag: 'Motstanderlag',
      Bortelag: 'Fjellhammer',
    }
    render(
      <MatchCard
        match={awayMatch}
        isNextMatch={false}
        hasMultipleTeams={false}
        getTeamColor={mockGetTeamColor}
      />
    )
    const mapLink = screen.getByRole('link', { name: /kart/i })
    expect(mapLink).toBeInTheDocument()
    expect(mapLink).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
  })
})
