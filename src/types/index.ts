/**
 * Team configuration from config.json
 */
export interface Team {
  name: string;
  lagid: string;
  seasonId: string;
  color: string;
}

/**
 * Config file structure
 */
export interface Config {
  teams: Team[];
}

/**
 * Raw match data from handball.no API (before enhancement)
 */
export interface RawMatchData {
  Dato: string;
  Tid: string;
  Kampnr: string;
  Hjemmelag: string;
  Bortelag: string;
  'H-B': string;
  Bane: string;
  Tilskuere?: number | string;
  Arrangør?: string;
  Turnering: string;
}

/**
 * Match data with all fields populated (after enhancement)
 */
export interface Match {
  Lag: string;
  Dato: string;
  Tid: string;
  Kampnr: string;
  Hjemmelag: string;
  Bortelag: string;
  'H-B': string;
  Bane: string;
  Tilskuere: number | string;
  Arrangør: string;
  Turnering: string;
  'Kamp URL': string;
  'Hjemmelag URL': string;
  'Bortelag URL': string;
  'Turnering URL': string;
}

/**
 * Links scraped from handball.no team page
 */
export interface MatchLink {
  kampnr: string;
  kampUrl?: string;
  hjemmelagUrl?: string;
  bortelagUrl?: string;
}

/**
 * Metadata about the data fetch
 */
export interface Metadata {
  lastUpdated: string;
  teamsCount: number;
  matchesCount: number;
}

/**
 * Tournament link mapping
 */
export interface TournamentLink {
  name: string;
  url: string;
}
