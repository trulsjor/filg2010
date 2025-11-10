import { test, expect } from '@playwright/test';
import { convertDateForSorting } from '../src/utils/date.utils.js';

test.describe('convertDateForSorting', () => {
  test('converts DD.MM.YYYY to YYYY-MM-DD', () => {
    expect(convertDateForSorting('14.09.2025')).toBe('2025-09-14');
    expect(convertDateForSorting('01.01.2025')).toBe('2025-01-01');
    expect(convertDateForSorting('31.12.2025')).toBe('2025-12-31');
  });

  test('returns empty string when input is empty', () => {
    expect(convertDateForSorting('')).toBe('');
  });

  test('returns original string for invalid formats', () => {
    expect(convertDateForSorting('invalid')).toBe('invalid');
    expect(convertDateForSorting('14-09-2025')).toBe('14-09-2025');
    expect(convertDateForSorting('14/09/2025')).toBe('14/09/2025');
  });

  test('handles partial dates', () => {
    expect(convertDateForSorting('14.09')).toBe('14.09');
    expect(convertDateForSorting('2025')).toBe('2025');
  });
});
