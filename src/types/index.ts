export type TeamId = string
export type TeamName = string
export type PlayerId = string
export type TournamentName = string

export interface Team {
  name: string
  lagid: string
  seasonId: string
  color: string
}

export interface Config {
  teams: Team[]
}

export interface RawMatchData {
  Dato: string
  Tid: string
  Kampnr: string
  Hjemmelag: string
  Bortelag: string
  'H-B': string
  Bane: string
  Tilskuere?: number | string
  Arrangør?: string
  Turnering: string
}

export interface Match {
  Lag: string
  Dato: string
  Tid: string
  Kampnr: string
  Hjemmelag: string
  Bortelag: string
  'H-B': string
  Bane: string
  Tilskuere?: number | string
  Arrangør: string
  Turnering: string
  'Kamp URL'?: string
  'Hjemmelag URL'?: string
  'Bortelag URL'?: string
  'Turnering URL'?: string
}

export interface MatchLink {
  kampnr: string
  kampUrl?: string
  hjemmelagUrl?: string
  bortelagUrl?: string
  hasBeenPlayed?: boolean
}

export interface Metadata {
  lastUpdated: string
  teamsCount: number
  matchesCount: number
}

export interface TournamentLink {
  name: string
  url: string
}
