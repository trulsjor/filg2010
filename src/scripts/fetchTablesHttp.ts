import * as fs from 'fs';
import * as path from 'path';
import { TableFetcherService, type LeagueTable } from '../services/table-fetcher.service.js';

interface Match {
  'Turnering URL'?: string;
  Turnering?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const TERMINLISTE_PATH = path.join(DATA_DIR, 'terminliste.json');
const TABLES_PATH = path.join(DATA_DIR, 'tables.json');

export interface FetchTablesResult {
  fetched: number;
  failed: number;
  total: number;
  failedTournaments: string[];
}

export async function fetchTablesHttp(specificTournaments?: Map<string, string>): Promise<FetchTablesResult> {
  console.log('🏆 Henter serietabeller (HTTP)...');

  let tournamentUrls: Map<string, string>;

  if (specificTournaments && specificTournaments.size > 0) {
    tournamentUrls = specificTournaments;
    console.log(`📋 Oppdaterer ${tournamentUrls.size} spesifikke turneringer`);
  } else {
    if (!fs.existsSync(TERMINLISTE_PATH)) {
      console.error('❌ terminliste.json ikke funnet');
      return { fetched: 0, failed: 0, total: 0, failedTournaments: [] };
    }

    const matches: Match[] = JSON.parse(fs.readFileSync(TERMINLISTE_PATH, 'utf-8'));

    tournamentUrls = new Map<string, string>();
    for (const match of matches) {
      if (match['Turnering URL'] && match.Turnering) {
        if (match.Turnering.toLowerCase().includes('cup')) {
          continue;
        }
        tournamentUrls.set(match['Turnering URL'], match.Turnering);
      }
    }

    console.log(`📋 Fant ${tournamentUrls.size} turneringer (ekskludert cups)`);
  }

  const fetcher = new TableFetcherService();
  const tables: LeagueTable[] = [];
  const failedTournaments: string[] = [];

  for (const [url, name] of tournamentUrls) {
    console.log(`  Henter tabell for: ${name}`);
    try {
      const table = await fetcher.fetchLeagueTable(url);
      if (table) {
        tables.push(table);
        console.log(`  ✅ ${table.rows.length} lag i tabellen`);
      } else {
        console.log(`  ⚠️ Ingen tabell funnet`);
        failedTournaments.push(name);
      }
    } catch (error) {
      console.error(`  ❌ Feil ved henting: ${error}`);
      failedTournaments.push(name);
    }
  }

  let allTables = tables;
  if (specificTournaments && specificTournaments.size > 0 && fs.existsSync(TABLES_PATH)) {
    const existingTables: LeagueTable[] = JSON.parse(fs.readFileSync(TABLES_PATH, 'utf-8'));
    const updatedUrls = new Set(tables.map(t => t.tournamentUrl));
    const unchangedTables = existingTables.filter(t => !updatedUrls.has(t.tournamentUrl));
    allTables = [...unchangedTables, ...tables];
  }
  fs.writeFileSync(TABLES_PATH, JSON.stringify(allTables, null, 2), 'utf-8');
  console.log(`\n💾 Lagret ${allTables.length} tabeller til ${TABLES_PATH}`);

  if (failedTournaments.length > 0) {
    console.warn(`\n⚠️ ${failedTournaments.length} turneringer feilet:`);
    failedTournaments.forEach(name => console.warn(`  - ${name}`));
  }

  return {
    fetched: tables.length,
    failed: failedTournaments.length,
    total: tournamentUrls.size,
    failedTournaments
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchTablesHttp()
    .then(result => {
      if (result.failed > 0) {
        console.log(`\n⚠️ Ferdig med feil: Hentet ${result.fetched}/${result.total} tabeller (${result.failed} feilet)`);
        process.exit(1);
      } else {
        console.log(`\n✅ Ferdig! Hentet ${result.fetched}/${result.total} tabeller`);
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('❌ Feil:', error);
      process.exit(1);
    });
}
