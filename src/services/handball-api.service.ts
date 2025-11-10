import * as XLSX from 'xlsx';
import type { Team } from '../types/index.js';
import { HandballUrlService } from './handball-url.service.js';

/**
 * Service for interacting with handball.no API
 */
export class HandballApiService {
  private urlService = new HandballUrlService();
  /**
   * Fetches team schedule data from handball.no API
   * @returns Array of match objects from Excel file
   */
  async fetchTeamSchedule(team: Team): Promise<any[]> {
    const apiUrl = this.urlService.buildApiUrl(team.lagid, team.seasonId);

    try {
      const response = await fetch(apiUrl);

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return jsonData;
    } catch (error) {
      throw new Error(
        `Failed to fetch schedule for team ${team.name} (${team.lagid}): ${error}`
      );
    }
  }
}
