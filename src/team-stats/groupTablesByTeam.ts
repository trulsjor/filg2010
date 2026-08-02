import type { LeagueTable } from '../components/LeagueTableCard'
import type { CupConfig, Team } from '../types'
import { TeamStatsAggregate } from './TeamStatsAggregate'

export type TeamTablesIndex = Record<string, LeagueTable[]>

// Grupperer serie- og cup-tabeller under riktig lag.
//
// Cup-tabeller må følge cupens `teamTag` (f.eks. elite under 1. lag, åpen under
// 2. lag). Kan ikke bruke `findConfigTeamInTable` for dem, fordi cup-radene viser
// klubbnavnet «Fjellhammer IL» (uten lagnummer) og da treffer alle cup-tabeller
// «førstelag»-heuristikken – begge puljer havner under 1. lag.
//
// Robust: hvis teamTag-laget ennå ikke finnes i lag-lista (manifestet ikke
// regenerert etter at et andrelag ble lagt til), faller vi tilbake til vanlig
// matching slik at tabellen fortsatt vises (under 1. lag) i stedet for å forsvinne.
export function groupTablesByTeam(
  tables: LeagueTable[],
  squadTeams: Team[],
  cups: CupConfig[]
): TeamTablesIndex {
  const grouped: TeamTablesIndex = {}
  squadTeams.forEach((team) => {
    grouped[team.name] = []
  })

  const teamsSortedBySpecificity = TeamStatsAggregate.sortTeamsByNameLengthDescending(squadTeams)

  tables.forEach((table) => {
    const matchingCup = cups.find((cup) => table.tournamentName.startsWith(cup.name))
    if (matchingCup && grouped[matchingCup.teamTag]) {
      grouped[matchingCup.teamTag].push(table)
      return
    }

    const matchingTeam = TeamStatsAggregate.findConfigTeamInTable(
      table.rows,
      teamsSortedBySpecificity
    )
    if (matchingTeam) {
      grouped[matchingTeam.name].push(table)
    }
  })

  return grouped
}
