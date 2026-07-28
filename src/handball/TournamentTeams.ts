import { optionalNumber, optionalString, isRecord } from './HandballPayloadReader.js'
import { decodeHtmlEntities, readVueProp } from './VueComponentProps.js'

export interface TournamentTeam {
  teamId: string
  teamName: string
}

const TEAM_LINK_PATTERN = /<a[^>]*href="[^"]*lagid=(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g
const HTML_TAG_PATTERN = /<[^>]+>/g

export function parseTournamentTeams(html: string): TournamentTeam[] {
  const fromTable = readTeamsFromTable(html)
  if (fromTable.length > 0) return fromTable
  return readTeamsFromLinks(html)
}

function readTeamsFromTable(html: string): TournamentTeam[] {
  let data: unknown
  try {
    data = readVueProp(html, 'table-main', ':data')
  } catch {
    return []
  }

  if (!isRecord(data) || !Array.isArray(data.teamResults)) return []

  const teams: TournamentTeam[] = []
  for (const entry of data.teamResults) {
    if (!isRecord(entry)) continue
    const orgId = optionalNumber(entry, 'orgId')
    const orgName = optionalString(entry, 'orgName')
    if (orgId === null || orgId === 0 || orgName === null) continue
    teams.push({ teamId: String(orgId), teamName: orgName.trim() })
  }
  return dedupeById(teams)
}

function readTeamsFromLinks(html: string): TournamentTeam[] {
  const teams: TournamentTeam[] = []
  for (const match of html.matchAll(TEAM_LINK_PATTERN)) {
    const teamId = match[1]
    if (teamId === '0') continue
    const teamName = decodeHtmlEntities(match[2].replace(HTML_TAG_PATTERN, '')).trim()
    if (teamName.length === 0) continue
    teams.push({ teamId, teamName })
  }
  return dedupeById(teams)
}

function dedupeById(teams: TournamentTeam[]): TournamentTeam[] {
  const byId = new Map<string, TournamentTeam>()
  for (const team of teams) {
    if (!byId.has(team.teamId)) byId.set(team.teamId, team)
  }
  return Array.from(byId.values())
}
