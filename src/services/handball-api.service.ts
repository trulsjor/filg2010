import * as XLSX from 'xlsx';
import type { Team, RawMatchData } from '../types/index.js';
import { HandballUrlService } from './handball-url.service.js';

interface HandballApiOptions {
  maxRetries?: number;
  backoffMs?: number;
  timeoutMs?: number;
}

/**
 * Service for interacting with handball.no API
 */
export class HandballApiService {
  private urlService = new HandballUrlService();
  private readonly maxRetries: number;
  private readonly backoffMs: number;
  private readonly timeoutMs: number;

  constructor(options: HandballApiOptions = {}) {
    this.maxRetries = Math.max(1, options.maxRetries ?? 3);
    this.backoffMs = Math.max(0, options.backoffMs ?? 500);
    this.timeoutMs = Math.max(100, options.timeoutMs ?? 15000);
  }

  /**
   * Fetches team schedule data from handball.no API
   * @returns Array of match objects from Excel file
   */
  async fetchTeamSchedule(team: Team): Promise<RawMatchData[]> {
    const apiUrl = this.urlService.buildApiUrl(team.lagid, team.seasonId);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(apiUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(
            `API request failed with status ${response.status}: ${response.statusText}`
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as RawMatchData[];

        clearTimeout(timeout);
        return jsonData;
      } catch (error) {
        clearTimeout(timeout);
        if (attempt >= this.maxRetries) {
          throw new Error(
            `Failed to fetch schedule for team ${team.name} (${team.lagid}): ${error}`
          );
        }
        await delay(this.backoffMs * attempt);
      }
    }

    return [];
  }
}

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
