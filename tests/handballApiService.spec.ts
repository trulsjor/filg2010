import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { HandballApiService } from '../src/services/handball-api.service.js';
import type { Team } from '../src/types/index.js';

const TEAM: Team = {
  name: 'Test',
  lagid: '123',
  seasonId: '456',
  color: '#000',
};

const makeWorkbookBuffer = () => {
  const sheet = XLSX.utils.json_to_sheet([
    { Kampnr: '1', Dato: '14.09.2025', Tid: '10:00', Turnering: 'Cup' },
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};

test.describe('HandballApiService', () => {
  const originalFetch = globalThis.fetch;

  test.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('retries failed fetches and eventually succeeds', async () => {
    const buffer = makeWorkbookBuffer();
    let attempts = 0;

    globalThis.fetch = async () => {
      attempts += 1;
      if (attempts < 3) {
        return new Response('error', { status: 500, statusText: 'Server error' });
      }
      return new Response(buffer, { status: 200 });
    };

    const service = new HandballApiService({ maxRetries: 3, backoffMs: 5, timeoutMs: 100 });
    const matches = await service.fetchTeamSchedule(TEAM);

    expect(attempts).toBe(3);
    expect(matches).toHaveLength(1);
    expect(matches[0].Kampnr).toBe('1');
  });

  test('throws when request keeps timing out', async () => {
    let attempts = 0;

    globalThis.fetch = (_, init: RequestInit = {}) => {
      attempts += 1;
      const signal = init.signal;
      return new Promise<Response>((_, reject) => {
        signal?.addEventListener('abort', () => {
          reject(new Error('Aborted'));
        });
      });
    };

    const service = new HandballApiService({ maxRetries: 2, timeoutMs: 10, backoffMs: 5 });

    await expect(service.fetchTeamSchedule(TEAM)).rejects.toThrow('Failed to fetch schedule');
    expect(attempts).toBe(2);
  });
});
