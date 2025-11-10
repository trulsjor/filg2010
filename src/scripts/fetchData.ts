import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'https://www.handball.no/AjaxData/TerminlisteLag?id=531500&seasonId=201060';
const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'terminliste.csv');

export async function fetchAndConvertData(): Promise<void> {
  try {
    // Fetch Excel file from API
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write CSV file
    fs.writeFileSync(CSV_PATH, csv, 'utf-8');

    console.log(`Data successfully saved to ${CSV_PATH}`);
  } catch (error) {
    console.error('Error fetching and converting data:', error);
    throw error;
  }
}

export function getCsvPath(): string {
  return CSV_PATH;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAndConvertData();
}
