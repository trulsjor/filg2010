import { test, expect } from '@playwright/test';
import { fetchAndConvertData, getCsvPath } from '../src/scripts/fetchData';
import * as fs from 'fs';

test.describe('Data fetching and conversion', () => {
  test('should fetch Excel data and convert to CSV', async () => {
    // Clean up any existing CSV file
    const csvPath = getCsvPath();
    if (fs.existsSync(csvPath)) {
      fs.unlinkSync(csvPath);
    }

    // Fetch and convert data
    await fetchAndConvertData();

    // Verify CSV file exists
    expect(fs.existsSync(csvPath)).toBeTruthy();

    // Read CSV content
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Verify CSV is not empty
    expect(csvContent.length).toBeGreaterThan(0);

    // Verify CSV has multiple lines (header + data rows)
    const lines = csvContent.trim().split('\n');
    expect(lines.length).toBeGreaterThan(1);

    console.log(`CSV file contains ${lines.length} lines`);
    console.log('First few lines:', lines.slice(0, 3).join('\n'));
  });

  test('should have CSV file with expected structure', async () => {
    const csvPath = getCsvPath();

    // Ensure CSV exists (from previous test or create it)
    if (!fs.existsSync(csvPath)) {
      await fetchAndConvertData();
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');

    // Check that we have data
    expect(lines.length).toBeGreaterThan(0);

    // First line should be header or data
    expect(lines[0].length).toBeGreaterThan(0);
  });
});
