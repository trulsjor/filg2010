import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

test.describe('Data Parsing', () => {
  test('should parse terminliste.json correctly', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const matches = JSON.parse(jsonContent);

    // Should be an array
    expect(Array.isArray(matches)).toBeTruthy();
    expect(matches.length).toBe(3);

    // Check structure of first match
    const firstMatch = matches[0];
    expect(firstMatch).toHaveProperty('Lag');
    expect(firstMatch).toHaveProperty('Dato');
    expect(firstMatch).toHaveProperty('Tid');
    expect(firstMatch).toHaveProperty('Kampnr');
    expect(firstMatch).toHaveProperty('Hjemmelag');
    expect(firstMatch).toHaveProperty('Bortelag');
    expect(firstMatch).toHaveProperty('H-B');
    expect(firstMatch).toHaveProperty('Bane');
    expect(firstMatch).toHaveProperty('Tilskuere');
    expect(firstMatch).toHaveProperty('Arrangør');
    expect(firstMatch).toHaveProperty('Turnering');
    expect(firstMatch).toHaveProperty('Kamp URL');
    expect(firstMatch).toHaveProperty('Hjemmelag URL');
    expect(firstMatch).toHaveProperty('Bortelag URL');
    expect(firstMatch).toHaveProperty('Turnering URL');

    console.log('✓ terminliste.json has correct structure');
    console.log(`✓ Found ${matches.length} matches in fixture`);
  });

  test('should parse match data types correctly', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const match = matches[0];

    // String fields
    expect(typeof match.Lag).toBe('string');
    expect(typeof match.Dato).toBe('string');
    expect(typeof match.Tid).toBe('string');
    expect(typeof match.Kampnr).toBe('string');
    expect(typeof match.Hjemmelag).toBe('string');
    expect(typeof match.Bortelag).toBe('string');
    expect(typeof match.Bane).toBe('string');
    expect(typeof match.Arrangør).toBe('string');
    expect(typeof match.Turnering).toBe('string');

    // Numeric or string (can be empty)
    expect(['string', 'number'].includes(typeof match.Tilskuere)).toBeTruthy();

    // URL fields should be strings
    expect(typeof match['Kamp URL']).toBe('string');
    expect(typeof match['Hjemmelag URL']).toBe('string');
    expect(typeof match['Bortelag URL']).toBe('string');
    expect(typeof match['Turnering URL']).toBe('string');

    console.log('✓ All field types are correct');
  });

  test('should handle empty values in match data', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Find match with empty H-B and Tilskuere
    const futureMatch = matches.find((m: any) => m['H-B'] === '');

    expect(futureMatch).toBeDefined();
    expect(futureMatch['H-B']).toBe('');
    expect(futureMatch.Tilskuere).toBe('');

    console.log('✓ Empty values handled correctly');
  });

  test('should validate date format (DD.MM.YYYY)', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;

    matches.forEach((match: any, index: number) => {
      expect(match.Dato).toMatch(dateRegex);
    });

    console.log('✓ All dates have correct format DD.MM.YYYY');
  });

  test('should validate time format (HH:MM)', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const timeRegex = /^\d{2}:\d{2}$/;

    matches.forEach((match: any, index: number) => {
      expect(match.Tid).toMatch(timeRegex);
    });

    console.log('✓ All times have correct format HH:MM');
  });

  test('should validate URL formats', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const urlRegex = /^https:\/\/www\.handball\.no\//;

    matches.forEach((match: any) => {
      if (match['Kamp URL']) {
        expect(match['Kamp URL']).toMatch(urlRegex);
      }
      if (match['Hjemmelag URL']) {
        expect(match['Hjemmelag URL']).toMatch(urlRegex);
      }
      if (match['Bortelag URL']) {
        expect(match['Bortelag URL']).toMatch(urlRegex);
      }
      if (match['Turnering URL']) {
        expect(match['Turnering URL']).toMatch(urlRegex);
      }
    });

    console.log('✓ All URLs have correct format');
  });

  test('should have unique kampnr for each match', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const kampnrSet = new Set();
    matches.forEach((match: any) => {
      const kampnr = match.Kampnr.trim();
      expect(kampnrSet.has(kampnr)).toBeFalsy();
      kampnrSet.add(kampnr);
    });

    console.log(`✓ All ${matches.length} kampnr are unique`);
  });

  test('should have matches for multiple teams', () => {
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const teams = new Set(matches.map((m: any) => m.Lag));

    expect(teams.size).toBeGreaterThan(1);
    expect(teams.has('Fjellhammer')).toBeTruthy();
    expect(teams.has('Fjellhammer 2')).toBeTruthy();

    console.log(`✓ Found matches for ${teams.size} teams`);
  });
});

test.describe('Metadata Parsing', () => {
  test('should parse metadata.json correctly', () => {
    const metadataPath = path.join(FIXTURES_DIR, 'metadata.json');
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    // Check required fields
    expect(metadata).toHaveProperty('lastUpdated');
    expect(metadata).toHaveProperty('teamsCount');
    expect(metadata).toHaveProperty('matchesCount');

    console.log('✓ metadata.json has correct structure');
  });

  test('should have valid metadata types', () => {
    const metadataPath = path.join(FIXTURES_DIR, 'metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    expect(typeof metadata.lastUpdated).toBe('string');
    expect(typeof metadata.teamsCount).toBe('number');
    expect(typeof metadata.matchesCount).toBe('number');

    // Validate ISO date format
    const date = new Date(metadata.lastUpdated);
    expect(date.toString()).not.toBe('Invalid Date');

    console.log('✓ All metadata types are correct');
    console.log(`  Last updated: ${metadata.lastUpdated}`);
    console.log(`  Teams: ${metadata.teamsCount}`);
    console.log(`  Matches: ${metadata.matchesCount}`);
  });

  test('should have positive counts', () => {
    const metadataPath = path.join(FIXTURES_DIR, 'metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    expect(metadata.teamsCount).toBeGreaterThan(0);
    expect(metadata.matchesCount).toBeGreaterThan(0);

    console.log('✓ Counts are positive');
  });

  test('should match actual data counts', () => {
    const metadataPath = path.join(FIXTURES_DIR, 'metadata.json');
    const jsonPath = path.join(FIXTURES_DIR, 'terminliste.json');

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const matches = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    expect(metadata.matchesCount).toBe(matches.length);

    const uniqueTeams = new Set(matches.map((m: any) => m.Lag));
    expect(metadata.teamsCount).toBe(uniqueTeams.size);

    console.log('✓ Metadata counts match actual data');
  });
});

test.describe('Config Parsing', () => {
  test('should parse config.json correctly', () => {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    expect(config).toHaveProperty('teams');
    expect(Array.isArray(config.teams)).toBeTruthy();
    expect(config.teams.length).toBeGreaterThan(0);

    console.log(`✓ config.json has ${config.teams.length} teams`);
  });

  test('should have valid team structure', () => {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    config.teams.forEach((team: any) => {
      expect(team).toHaveProperty('name');
      expect(team).toHaveProperty('lagid');
      expect(team).toHaveProperty('seasonId');
      expect(team).toHaveProperty('color');

      expect(typeof team.name).toBe('string');
      expect(typeof team.lagid).toBe('string');
      expect(typeof team.seasonId).toBe('string');
      expect(typeof team.color).toBe('string');
    });

    console.log('✓ All teams have correct structure');
  });

  test('should have valid color hex codes', () => {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

    config.teams.forEach((team: any) => {
      expect(team.color).toMatch(hexColorRegex);
    });

    console.log('✓ All team colors are valid hex codes');
  });

  test('should have unique team names', () => {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const names = new Set();
    config.teams.forEach((team: any) => {
      expect(names.has(team.name)).toBeFalsy();
      names.add(team.name);
    });

    console.log('✓ All team names are unique');
  });

  test('should have unique lagid values', () => {
    const configPath = path.join(FIXTURES_DIR, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const lagids = new Set();
    config.teams.forEach((team: any) => {
      expect(lagids.has(team.lagid)).toBeFalsy();
      lagids.add(team.lagid);
    });

    console.log('✓ All lagid values are unique');
  });
});
