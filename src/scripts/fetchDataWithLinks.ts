import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { scrapeMatchLinks } from './scrapeLinks';

const API_URL = 'https://www.handball.no/AjaxData/TerminlisteLag?id=531500&seasonId=201060';
const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_PATH = path.join(DATA_DIR, 'terminliste.csv');
const ENHANCED_CSV_PATH = path.join(DATA_DIR, 'terminliste-med-lenker.csv');

export async function fetchAndConvertDataWithLinks(): Promise<void> {
  try {
    console.log('Step 1: Fetching Excel data from API...');
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

    // Convert to JSON for easier manipulation
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Loaded ${jsonData.length} matches from Excel`);

    // Step 2: Scrape links from handball.no
    console.log('\nStep 2: Scraping match links from handball.no...');
    const matchLinks = await scrapeMatchLinks();

    // Create a map of kampnr -> links
    const linkMap = new Map();
    matchLinks.forEach((link) => {
      const kampnr = link.kampnr.trim();
      if (!linkMap.has(kampnr)) {
        linkMap.set(kampnr, link);
      }
    });

    console.log(`\nStep 3: Combining data with links...`);

    // Add links to the data
    const enhancedData = jsonData.map((row: any) => {
      const kampnr = String(row.Kampnr || '').trim();
      const links = linkMap.get(kampnr);

      return {
        ...row,
        'Kamp URL': links?.kampUrl || '',
        'Hjemmelag URL': links?.hjemmelagUrl || '',
        'Bortelag URL': links?.bortelagUrl || '',
      };
    });

    // Convert back to worksheet
    const enhancedWorksheet = XLSX.utils.json_to_sheet(enhancedData);

    // Convert to CSV
    const csv = XLSX.utils.sheet_to_csv(enhancedWorksheet);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write enhanced CSV file
    fs.writeFileSync(ENHANCED_CSV_PATH, csv, 'utf-8');

    console.log(`\nEnhanced data successfully saved to ${ENHANCED_CSV_PATH}`);
    console.log(`Total matches: ${enhancedData.length}`);
    console.log(`Matches with links: ${enhancedData.filter((r: any) => r['Kamp URL']).length}`);
  } catch (error) {
    console.error('Error fetching and converting data:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAndConvertDataWithLinks();
}
