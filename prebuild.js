// Prebuild script to fetch fresh data before building the site
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function prebuild() {
  console.log('🔄 Fetching fresh data before build...\n');

  try {
    const { stdout, stderr } = await execAsync('npx tsx src/scripts/fetchAllTeamsData.ts');
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('✅ Data fetched successfully!\n');
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    console.log('⚠️  Build will continue with existing data\n');
  }
}

prebuild();
