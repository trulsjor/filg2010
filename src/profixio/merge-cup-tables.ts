import type { LeagueTable } from '../handball/LeagueTable.js'
import type { CupConfig } from '../types/index.js'

// update-all overskriver tables.json med serietabeller fra handball.no. Cup-tabeller
// (fra Profixio) må bevares på tvers av kjøringer – ellers forsvinner de hver gang
// update-all kjører, akkurat som cup-kampene bevares i terminlisten.
export function mergeCupTables(
  leagueTables: LeagueTable[],
  existingTables: LeagueTable[],
  cups: CupConfig[]
): LeagueTable[] {
  const cupTables = existingTables.filter((table) =>
    cups.some((cup) => table.tournamentName.startsWith(cup.name))
  )
  return [...leagueTables, ...cupTables]
}
