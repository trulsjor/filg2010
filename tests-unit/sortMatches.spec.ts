import { describe, expect, it } from 'vitest';
import { sortMatchesByDate } from '../src/utils/date.utils.js';

describe('sortMatchesByDate', () => {
  it('sorts matches by date ascending', () => {
    const matches = [
      { Dato: '14.11.2025', Tid: '10:00' },
      { Dato: '14.09.2025', Tid: '10:00' },
      { Dato: '14.10.2025', Tid: '10:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Dato).toBe('14.09.2025');
    expect(sorted[1].Dato).toBe('14.10.2025');
    expect(sorted[2].Dato).toBe('14.11.2025');
  });

  it('sorts matches by time when dates are equal', () => {
    const matches = [
      { Dato: '14.09.2025', Tid: '18:00' },
      { Dato: '14.09.2025', Tid: '10:00' },
      { Dato: '14.09.2025', Tid: '14:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Tid).toBe('10:00');
    expect(sorted[1].Tid).toBe('14:00');
    expect(sorted[2].Tid).toBe('18:00');
  });

  it('handles mixed dates and times', () => {
    const matches = [
      { Dato: '14.11.2025', Tid: '10:00' },
      { Dato: '14.09.2025', Tid: '18:00' },
      { Dato: '14.09.2025', Tid: '10:00' },
      { Dato: '14.10.2025', Tid: '14:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Dato).toBe('14.09.2025');
    expect(sorted[0].Tid).toBe('10:00');
    expect(sorted[1].Dato).toBe('14.09.2025');
    expect(sorted[1].Tid).toBe('18:00');
    expect(sorted[2].Dato).toBe('14.10.2025');
    expect(sorted[3].Dato).toBe('14.11.2025');
  });

  it('handles empty date or time', () => {
    const matches = [
      { Dato: '14.11.2025', Tid: '' },
      { Dato: '', Tid: '10:00' },
      { Dato: '14.09.2025', Tid: '10:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Dato).toBe('');
    expect(sorted[1].Dato).toBe('14.09.2025');
    expect(sorted[2].Dato).toBe('14.11.2025');
  });

  it('does not mutate original array', () => {
    const matches = [
      { Dato: '14.11.2025', Tid: '10:00' },
      { Dato: '14.09.2025', Tid: '10:00' },
    ];

    const original = [...matches];
    sortMatchesByDate(matches);

    expect(matches).toEqual(original);
  });

  it('handles empty array', () => {
    const matches: any[] = [];
    const sorted = sortMatchesByDate(matches);

    expect(sorted).toEqual([]);
  });

  it('handles single match', () => {
    const matches = [
      { Dato: '14.09.2025', Tid: '10:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted).toEqual(matches);
  });

  it('preserves all match properties', () => {
    const matches = [
      {
        Dato: '14.11.2025',
        Tid: '10:00',
        Kampnr: '123',
        Hjemmelag: 'Team A',
        Bortelag: 'Team B',
        'H-B': '10-5',
      },
      {
        Dato: '14.09.2025',
        Tid: '10:00',
        Kampnr: '456',
        Hjemmelag: 'Team C',
        Bortelag: 'Team D',
        'H-B': '20-15',
      },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Kampnr).toBe('456');
    expect(sorted[0].Hjemmelag).toBe('Team C');
    expect(sorted[0]['H-B']).toBe('20-15');
    expect(sorted[1].Kampnr).toBe('123');
  });

  it('handles real-world dates spanning multiple months', () => {
    const matches = [
      { Dato: '05.12.2025', Tid: '18:50' },
      { Dato: '23.11.2025', Tid: '15:50' },
      { Dato: '16.11.2025', Tid: '18:45' },
      { Dato: '15.11.2025', Tid: '14:25' },
      { Dato: '09.11.2025', Tid: '12:30' },
      { Dato: '14.09.2025', Tid: '10:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Dato).toBe('14.09.2025');
    expect(sorted[1].Dato).toBe('09.11.2025');
    expect(sorted[2].Dato).toBe('15.11.2025');
    expect(sorted[3].Dato).toBe('16.11.2025');
    expect(sorted[4].Dato).toBe('23.11.2025');
    expect(sorted[5].Dato).toBe('05.12.2025');
  });

  it('handles dates across different years', () => {
    const matches = [
      { Dato: '14.01.2026', Tid: '10:00' },
      { Dato: '14.12.2025', Tid: '10:00' },
      { Dato: '14.11.2024', Tid: '10:00' },
    ];

    const sorted = sortMatchesByDate(matches);

    expect(sorted[0].Dato).toBe('14.11.2024');
    expect(sorted[1].Dato).toBe('14.12.2025');
    expect(sorted[2].Dato).toBe('14.01.2026');
  });
});
